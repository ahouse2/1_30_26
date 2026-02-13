from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional

from ..config import Settings, get_settings
from ..models.api import (
    AppearanceSettingsSnapshotModel,
    AppearanceSettingsUpdate,
    CredentialSettingsUpdate,
    CredentialStatusModel,
    CredentialsSnapshotModel,
    ModelCatalogResponse,
    ProviderCatalogEntryModel,
    ProviderModelInfoModel,
    ProviderSettingsSnapshotModel,
    ProviderSettingsUpdate,
    SettingsResponse,
    SettingsUpdateRequest,
)
from ..providers import registry as registry_module
from ..providers.catalog import MODEL_CATALOG, ModelInfo, ProviderCapability
from ..storage.settings_store import SettingsStore
from .provider_models import get_provider_model_refresh_service, ProviderModelRefreshService


class SettingsValidationError(ValueError):
    """Raised when an incoming settings payload is invalid."""


class SettingsService:
    """Coordinates operator-configurable runtime settings."""

    def __init__(
        self,
        runtime_settings: Settings | None = None,
        *,
        store: SettingsStore | None = None,
    ) -> None:
        self._runtime_settings = runtime_settings or get_settings()
        self._store = store or SettingsStore(
            self._runtime_settings.settings_store_path,
            self._runtime_settings.manifest_encryption_key_path,
        )

    def snapshot(self) -> SettingsResponse:
        state = self._load_state()
        return self._build_response(state)

    def update(self, payload: SettingsUpdateRequest) -> SettingsResponse:
        state = self._load_state()

        if payload.providers:
            self._apply_provider_update(state, payload.providers)
        if payload.credentials:
            self._apply_credential_update(state, payload.credentials)
        if payload.appearance:
            self._apply_appearance_update(state, payload.appearance)

        state["updated_at"] = datetime.now(timezone.utc).isoformat()
        self._store.save(state)
        self._invalidate_caches()
        return self._build_response(state)

    def model_catalog(self) -> ModelCatalogResponse:
        state = self._load_state()
        providers_state: Dict[str, Any] = state.get("providers", {})
        api_base_urls = self._compose_api_base_urls(providers_state.get("api_base_urls", {}))
        refresh_service = get_provider_model_refresh_service()
        return ModelCatalogResponse(
            providers=self._build_catalog(
                api_base_urls=api_base_urls,
                refresh_service=refresh_service,
            )
        )

    def refresh_model_catalog(self, provider_id: str) -> ModelCatalogResponse:
        state = self._load_state()
        providers_state: Dict[str, Any] = state.get("providers", {})
        credentials_state: Dict[str, Any] = state.get("credentials", {})
        api_base_urls = self._compose_api_base_urls(providers_state.get("api_base_urls", {}))
        provider_api_keys: Dict[str, str] = credentials_state.get("provider_api_keys", {})

        self._ensure_provider_exists(provider_id)

        refresh_service = get_provider_model_refresh_service()
        refresh_service.refresh(
            provider_id,
            base_url=api_base_urls.get(provider_id),
            api_key=provider_api_keys.get(provider_id),
        )

        return ModelCatalogResponse(
            providers=self._build_catalog(
                api_base_urls=api_base_urls,
                refresh_service=refresh_service,
            )
        )

    def get_provider_api_key(self, provider_id: str) -> Optional[str]:
        state = self._load_state()
        credentials_state: Dict[str, Any] = state.get("credentials", {})
        provider_api_keys: Dict[str, str] = credentials_state.get("provider_api_keys", {})
        return _normalise_secret(provider_api_keys.get(provider_id))

    def get_provider_api_key(self, provider_id: str) -> Optional[str]:
        state = self._load_state()
        credentials = state.get("credentials", {})
        if not isinstance(credentials, dict):
            return None
        provider_keys = credentials.get("provider_api_keys", {})
        if not isinstance(provider_keys, dict):
            return None
        return _normalise_secret(provider_keys.get(provider_id))

    def _load_state(self) -> Dict[str, Any]:
        state = self._store.load()
        providers = state.setdefault("providers", {})
        providers.setdefault("defaults", {})
        providers.setdefault("api_base_urls", {})
        providers.setdefault("local_runtime_paths", {})
        credentials = state.setdefault("credentials", {})
        credentials.setdefault("provider_api_keys", {})
        state.setdefault("appearance", {})
        return state

    def _build_response(self, state: Dict[str, Any]) -> SettingsResponse:
        providers_state: Dict[str, Any] = state.get("providers", {})
        credentials_state: Dict[str, Any] = state.get("credentials", {})
        appearance_state: Dict[str, Any] = state.get("appearance", {})

        primary = providers_state.get("primary") or self._runtime_settings.model_providers_primary
        secondary = (
            providers_state["secondary"]
            if "secondary" in providers_state
            else self._runtime_settings.model_providers_secondary
        )
        defaults = self._compose_defaults(providers_state.get("defaults", {}))
        api_base_urls = self._compose_api_base_urls(providers_state.get("api_base_urls", {}))
        runtime_paths = self._compose_runtime_paths(providers_state.get("local_runtime_paths", {}))

        provider_api_keys: Dict[str, str] = credentials_state.get("provider_api_keys", {})
        provider_status = [
            CredentialStatusModel(provider_id=provider_id, has_api_key=bool(provider_api_keys.get(provider_id)))
            for provider_id in sorted(MODEL_CATALOG.keys())
        ]
        services_status = {
            "courtlistener": bool(_normalise_secret(credentials_state.get("courtlistener_token"))),
            "pacer": bool(_normalise_secret(credentials_state.get("pacer_api_key"))),
            "unicourt": bool(_normalise_secret(credentials_state.get("unicourt_api_key"))),
            "lacs": bool(_normalise_secret(credentials_state.get("lacs_api_key"))),
            "caselaw": bool(_normalise_secret(credentials_state.get("caselaw_api_key"))),
            "research_browser": bool(_normalise_secret(credentials_state.get("research_browser_api_key"))),
        }

        theme = appearance_state.get("theme") or "system"
        updated_at = _parse_timestamp(state.get("updated_at"))

        refresh_service = get_provider_model_refresh_service()
        return SettingsResponse(
            providers=ProviderSettingsSnapshotModel(
                primary=primary,
                secondary=secondary,
                defaults=defaults,
                api_base_urls=api_base_urls,
                local_runtime_paths=runtime_paths,
                available=self._build_catalog(
                    api_base_urls=api_base_urls,
                    refresh_service=refresh_service,
                ),
            ),
            credentials=CredentialsSnapshotModel(
                providers=provider_status,
                services=services_status,
            ),
            appearance=AppearanceSettingsSnapshotModel(theme=theme),
            updated_at=updated_at,
        )

    def _apply_provider_update(self, state: Dict[str, Any], update: ProviderSettingsUpdate) -> None:
        providers = state.setdefault("providers", {})

        if "primary" in update.model_fields_set:
            provider_id = update.primary
            if not provider_id:
                raise SettingsValidationError("Primary provider may not be empty")
            self._ensure_provider_exists(provider_id)
            providers["primary"] = provider_id

        if "secondary" in update.model_fields_set:
            secondary = update.secondary
            if secondary:
                self._ensure_provider_exists(secondary)
                providers["secondary"] = secondary
            else:
                providers["secondary"] = None

        if update.defaults is not None:
            defaults = providers.setdefault("defaults", {})
            api_base_urls = self._compose_api_base_urls(providers.get("api_base_urls", {}))
            for raw_key, model_id in update.defaults.items():
                capability = self._normalise_capability(raw_key)
                if model_id:
                    self._ensure_model_exists(model_id, api_base_urls=api_base_urls)
                    defaults[capability] = model_id
                else:
                    defaults.pop(capability, None)

        if update.api_base_urls is not None:
            overrides = providers.setdefault("api_base_urls", {})
            for provider_id, base_url in update.api_base_urls.items():
                self._ensure_provider_exists(provider_id)
                normalised = (base_url or "").strip()
                if normalised:
                    overrides[provider_id] = normalised
                else:
                    overrides.pop(provider_id, None)

        if update.local_runtime_paths is not None:
            overrides = providers.setdefault("local_runtime_paths", {})
            for provider_id, raw_path in update.local_runtime_paths.items():
                self._ensure_provider_exists(provider_id)
                normalised = (raw_path or "").strip()
                if normalised:
                    overrides[provider_id] = normalised
                else:
                    overrides.pop(provider_id, None)

    def _apply_credential_update(self, state: Dict[str, Any], update: CredentialSettingsUpdate) -> None:
        credentials = state.setdefault("credentials", {})
        provider_keys = credentials.setdefault("provider_api_keys", {})

        if update.provider_api_keys is not None:
            for provider_id, secret in update.provider_api_keys.items():
                self._ensure_provider_exists(provider_id)
                normalised = _normalise_secret(secret)
                if normalised:
                    provider_keys[provider_id] = normalised
                else:
                    provider_keys.pop(provider_id, None)

        if "courtlistener_token" in update.model_fields_set:
            credentials["courtlistener_token"] = _normalise_secret(update.courtlistener_token)

        if "pacer_api_key" in update.model_fields_set:
            credentials["pacer_api_key"] = _normalise_secret(update.pacer_api_key)

        if "unicourt_api_key" in update.model_fields_set:
            credentials["unicourt_api_key"] = _normalise_secret(update.unicourt_api_key)

        if "lacs_api_key" in update.model_fields_set:
            credentials["lacs_api_key"] = _normalise_secret(update.lacs_api_key)

        if "caselaw_api_key" in update.model_fields_set:
            credentials["caselaw_api_key"] = _normalise_secret(update.caselaw_api_key)

        if "research_browser_api_key" in update.model_fields_set:
            credentials["research_browser_api_key"] = _normalise_secret(update.research_browser_api_key)

    def _apply_appearance_update(self, state: Dict[str, Any], update: AppearanceSettingsUpdate) -> None:
        appearance = state.setdefault("appearance", {})
        if "theme" in update.model_fields_set:
            theme = update.theme or "system"
            if theme not in {"system", "light", "dark"}:
                raise SettingsValidationError(f"Unsupported theme '{theme}'")
            appearance["theme"] = theme

    def _compose_defaults(self, stored: Dict[str, str]) -> Dict[str, str]:
        defaults = {
            "chat": stored.get("chat") or self._runtime_settings.default_chat_model,
            "embeddings": stored.get("embeddings") or self._runtime_settings.default_embedding_model,
            "vision": stored.get("vision") or self._runtime_settings.default_vision_model,
        }
        for key, value in stored.items():
            if key not in defaults and value:
                defaults[key] = value
        return defaults

    def _compose_api_base_urls(self, overrides: Dict[str, str]) -> Dict[str, str]:
        combined = dict(self._runtime_settings.provider_api_base_urls)
        for provider_id, base_url in overrides.items():
            if base_url:
                combined[provider_id] = base_url
            else:
                combined.pop(provider_id, None)
        return combined

    def _compose_runtime_paths(self, overrides: Dict[str, str]) -> Dict[str, str]:
        combined = {provider_id: str(path) for provider_id, path in self._runtime_settings.provider_local_runtime_paths.items()}
        for provider_id, value in overrides.items():
            value = (value or "").strip()
            if value:
                combined[provider_id] = value
            else:
                combined.pop(provider_id, None)
        return combined

    def _build_catalog(
        self,
        *,
        api_base_urls: Dict[str, str] | None = None,
        refresh_service: ProviderModelRefreshService | None = None,
    ) -> List[ProviderCatalogEntryModel]:
        entries: List[ProviderCatalogEntryModel] = []
        for provider_id, models in MODEL_CATALOG.items():
            merged_models = self._merge_models(
                models,
                refresh_service.get_cached(provider_id, base_url=api_base_urls.get(provider_id))
                if refresh_service and api_base_urls
                else (),
            )
            adapter_cls = registry_module.ADAPTER_TYPES.get(provider_id)
            display_name = adapter_cls.display_name if adapter_cls else provider_id
            capabilities = sorted(
                {capability.value for model in merged_models for capability in model.capabilities}
            )
            model_entries = [
                ProviderModelInfoModel(
                    model_id=model.model_id,
                    display_name=model.display_name,
                    context_window=model.context_window,
                    modalities=list(model.modalities),
                    capabilities=[cap.value for cap in model.capabilities],
                    availability=model.availability,
                )
                for model in merged_models
            ]
            entries.append(
                ProviderCatalogEntryModel(
                    provider_id=provider_id,
                    display_name=display_name,
                    capabilities=capabilities,
                    models=model_entries,
                )
            )
        entries.sort(key=lambda entry: entry.provider_id)
        return entries

    @staticmethod
    def _merge_models(
        static_models: Iterable[ModelInfo],
        dynamic_models: Iterable[ModelInfo],
    ) -> tuple[ModelInfo, ...]:
        merged = list(static_models)
        static_ids = {model.model_id for model in static_models}
        for model in dynamic_models:
            if model.model_id not in static_ids:
                merged.append(model)
        return tuple(merged)

    def _ensure_provider_exists(self, provider_id: str) -> None:
        if provider_id not in MODEL_CATALOG:
            raise SettingsValidationError(f"Unsupported provider '{provider_id}'")

    def _ensure_model_exists(self, model_id: str, *, api_base_urls: Dict[str, str] | None = None) -> None:
        if any(self._model_matches(model_id, models) for models in MODEL_CATALOG.values()):
            return

        api_base_urls = api_base_urls or self._compose_api_base_urls({})
        refresh_service = get_provider_model_refresh_service()
        for provider_id, base_url in api_base_urls.items():
            for model in refresh_service.get_cached(provider_id, base_url=base_url):
                if model.model_id == model_id:
                    return

        raise SettingsValidationError(f"Unknown model identifier '{model_id}'")

    @staticmethod
    def _model_matches(model_id: str, models: Iterable[ModelInfo]) -> bool:
        return any(model.model_id == model_id for model in models)

    @staticmethod
    def _normalise_capability(value: str) -> str:
        try:
            return ProviderCapability(value).value
        except ValueError:
            try:
                return ProviderCapability(value.lower()).value
            except ValueError as exc:
                raise SettingsValidationError(f"Unsupported capability '{value}'") from exc

    def _invalidate_caches(self) -> None:
        from .. import reset_provider_registry_cache

        reset_provider_registry_cache()


def get_settings_service() -> SettingsService:
    return SettingsService()


def _parse_timestamp(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def _normalise_secret(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None
