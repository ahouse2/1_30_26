from __future__ import annotations

from dataclasses import dataclass
import logging
from threading import Lock
from typing import Dict, Iterable, List, Tuple

import requests

from ..providers.catalog import ModelInfo, ProviderCapability

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class _CacheKey:
    provider_id: str
    base_url: str


class ProviderModelRefreshService:
    """Caches dynamic provider model catalogs used by the settings surface."""

    def __init__(self) -> None:
        self._cache: Dict[_CacheKey, Tuple[ModelInfo, ...]] = {}
        self._lock = Lock()

    def get_cached(self, provider_id: str, *, base_url: str | None = None) -> Tuple[ModelInfo, ...]:
        key = _CacheKey(provider_id=provider_id, base_url=(base_url or "").strip())
        with self._lock:
            return self._cache.get(key, ())

    def refresh(
        self,
        provider_id: str,
        *,
        base_url: str | None = None,
        api_key: str | None = None,
    ) -> Tuple[ModelInfo, ...]:
        models = self._fetch(provider_id, base_url=base_url, api_key=api_key)
        key = _CacheKey(provider_id=provider_id, base_url=(base_url or "").strip())
        with self._lock:
            self._cache[key] = models
        return models

    def _fetch(
        self,
        provider_id: str,
        *,
        base_url: str | None = None,
        api_key: str | None = None,
    ) -> Tuple[ModelInfo, ...]:
        provider = provider_id.strip().lower()
        if provider == "openrouter":
            return self._fetch_openrouter(base_url=base_url, api_key=api_key)
        if provider in {"ollama", "localai"}:
            return self._fetch_ollama_like(base_url=base_url)
        # For unsupported providers we safely return an empty dynamic set.
        return ()

    def _fetch_openrouter(self, *, base_url: str | None, api_key: str | None) -> Tuple[ModelInfo, ...]:
        url = (base_url or "https://openrouter.ai/api/v1").rstrip("/")
        if not url.endswith("/models"):
            url = f"{url}/models"
        headers = {"Accept": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            payload = response.json()
        except Exception as exc:
            logger.warning("OpenRouter model refresh failed: %s", exc)
            return ()

        items = payload.get("data", []) if isinstance(payload, dict) else []
        return tuple(self._build_model_infos(items))

    def _fetch_ollama_like(self, *, base_url: str | None) -> Tuple[ModelInfo, ...]:
        url = (base_url or "http://localhost:11434").rstrip("/")
        if not url.endswith("/api/tags"):
            url = f"{url}/api/tags"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            payload = response.json()
        except Exception as exc:
            logger.warning("Local model refresh failed: %s", exc)
            return ()

        items = payload.get("models", []) if isinstance(payload, dict) else []
        adapted: List[dict] = []
        for item in items:
            if not isinstance(item, dict):
                continue
            model_id = str(item.get("name") or item.get("model") or "").strip()
            if not model_id:
                continue
            adapted.append(
                {
                    "id": model_id,
                    "name": model_id,
                    "context_length": 32768,
                }
            )
        return tuple(self._build_model_infos(adapted))

    def _build_model_infos(self, items: Iterable[dict]) -> List[ModelInfo]:
        results: List[ModelInfo] = []
        seen: set[str] = set()
        for item in items:
            if not isinstance(item, dict):
                continue
            model_id = str(item.get("id") or item.get("name") or item.get("model") or "").strip()
            if not model_id or model_id in seen:
                continue
            seen.add(model_id)
            context_window = int(item.get("context_length") or item.get("context_window") or 32768)
            modalities = self._infer_modalities(item=item, model_id=model_id)
            capabilities = self._infer_capabilities(model_id=model_id, modalities=modalities)
            results.append(
                ModelInfo(
                    model_id=model_id,
                    display_name=str(item.get("name") or model_id),
                    context_window=context_window,
                    modalities=modalities,
                    capabilities=capabilities,
                    availability="dynamic-catalog",
                )
            )
        return results

    @staticmethod
    def _infer_modalities(*, item: dict, model_id: str) -> Tuple[str, ...]:
        modalities = item.get("modalities")
        if isinstance(modalities, list) and modalities:
            parsed = tuple(str(value) for value in modalities if str(value).strip())
            if parsed:
                return parsed
        lowered = model_id.lower()
        if any(tag in lowered for tag in ("vision", "vl", "multimodal")):
            return ("text", "vision")
        return ("text",)

    @staticmethod
    def _infer_capabilities(
        *,
        model_id: str,
        modalities: Tuple[str, ...],
    ) -> Tuple[ProviderCapability, ...]:
        lowered = model_id.lower()
        if any(tag in lowered for tag in ("embedding", "embed")):
            return (ProviderCapability.EMBEDDINGS,)
        caps: List[ProviderCapability] = [ProviderCapability.CHAT]
        if "vision" in modalities:
            caps.append(ProviderCapability.VISION)
        return tuple(caps)


_PROVIDER_MODEL_REFRESH_SERVICE: ProviderModelRefreshService | None = None
_PROVIDER_MODEL_REFRESH_LOCK = Lock()


def get_provider_model_refresh_service() -> ProviderModelRefreshService:
    global _PROVIDER_MODEL_REFRESH_SERVICE
    if _PROVIDER_MODEL_REFRESH_SERVICE is None:
        with _PROVIDER_MODEL_REFRESH_LOCK:
            if _PROVIDER_MODEL_REFRESH_SERVICE is None:
                _PROVIDER_MODEL_REFRESH_SERVICE = ProviderModelRefreshService()
    return _PROVIDER_MODEL_REFRESH_SERVICE
