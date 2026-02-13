from __future__ import annotations

import time
from dataclasses import dataclass
from functools import lru_cache
from typing import Callable, Iterable, Mapping, Sequence

import httpx

from ..providers.catalog import ModelInfo, ProviderCapability


@dataclass(frozen=True)
class CachedModels:
    expires_at: float
    models: tuple[ModelInfo, ...]


class ProviderModelRefreshService:
    """Fetches model lists from provider APIs and caches results."""

    def __init__(
        self,
        *,
        client: httpx.Client | None = None,
        cache_ttl_seconds: int = 600,
        timeout_seconds: float = 10.0,
    ) -> None:
        self._client = client or httpx.Client(timeout=timeout_seconds)
        self._cache_ttl_seconds = cache_ttl_seconds
        self._cache: dict[tuple[str, str], CachedModels] = {}

    def refresh(self, provider_id: str, *, base_url: str | None, api_key: str | None = None) -> Sequence[ModelInfo]:
        if not base_url:
            return []
        cache_key = (provider_id, base_url)
        cached = self._cache.get(cache_key)
        if cached and cached.expires_at > time.monotonic():
            return cached.models

        url, headers, parser = self._resolve_request(provider_id, base_url, api_key)
        try:
            response = self._client.get(url, headers=headers)
            response.raise_for_status()
        except httpx.HTTPError:
            return []

        payload = response.json()
        models = tuple(parser(payload))
        if models:
            self._cache[cache_key] = CachedModels(
                expires_at=time.monotonic() + self._cache_ttl_seconds,
                models=models,
            )
        return models

    def get_cached(self, provider_id: str, *, base_url: str | None) -> Sequence[ModelInfo]:
        if not base_url:
            return []
        cached = self._cache.get((provider_id, base_url))
        if not cached:
            return []
        if cached.expires_at <= time.monotonic():
            return []
        return cached.models

    def _resolve_request(
        self,
        provider_id: str,
        base_url: str,
        api_key: str | None,
    ) -> tuple[str, Mapping[str, str], Callable[[object], Iterable[ModelInfo]]]:
        if provider_id == "ollama":
            url = self._resolve_ollama_url(base_url)
            headers: Mapping[str, str] = {"Accept": "application/json"}
            return url, headers, self._parse_ollama_models
        if provider_id == "huggingface":
            url = self._resolve_huggingface_url(base_url)
            headers = self._build_headers(api_key)
            return url, headers, self._parse_huggingface_models

        url = base_url.rstrip("/") + "/models"
        headers = self._build_headers(api_key)
        return url, headers, self._parse_models

    @staticmethod
    def _build_headers(api_key: str | None) -> Mapping[str, str]:
        headers = {
            "Accept": "application/json",
        }
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        return headers

    def _parse_models(self, payload: Mapping[str, object]) -> Iterable[ModelInfo]:
        data = payload.get("data")
        if not isinstance(data, list):
            return []
        for entry in data:
            if not isinstance(entry, dict):
                continue
            model_id = entry.get("id") or entry.get("model") or entry.get("name")
            if not model_id:
                continue
            yield self._build_model_info(str(model_id))

    def _parse_ollama_models(self, payload: Mapping[str, object]) -> Iterable[ModelInfo]:
        data = payload.get("models")
        if not isinstance(data, list):
            return []
        for entry in data:
            if not isinstance(entry, dict):
                continue
            model_id = entry.get("name") or entry.get("model")
            if not model_id:
                continue
            yield self._build_model_info(str(model_id))

    def _parse_huggingface_models(self, payload: object) -> Iterable[ModelInfo]:
        if not isinstance(payload, list):
            return []
        for entry in payload:
            if not isinstance(entry, dict):
                continue
            model_id = entry.get("modelId") or entry.get("id")
            if not model_id:
                continue
            yield self._build_model_info(str(model_id))

    @staticmethod
    def _resolve_ollama_url(base_url: str) -> str:
        trimmed = base_url.rstrip("/")
        if trimmed.endswith("/api"):
            return f"{trimmed}/tags"
        return f"{trimmed}/api/tags"

    @staticmethod
    def _resolve_huggingface_url(base_url: str) -> str:
        trimmed = base_url.rstrip("/")
        if "huggingface.co" in trimmed:
            if trimmed.endswith("/api/models"):
                return trimmed
            if trimmed.endswith("/api"):
                return f"{trimmed}/models?limit=50"
            if trimmed.endswith("huggingface.co"):
                return f"{trimmed}/api/models?limit=50"
        return "https://huggingface.co/api/models?limit=50"

    @staticmethod
    def _build_model_info(model_id: str) -> ModelInfo:
        capabilities = _infer_capabilities(model_id)
        modalities = _infer_modalities(capabilities)
        return ModelInfo(
            model_id=model_id,
            display_name=model_id,
            context_window=0,
            modalities=modalities,
            capabilities=capabilities,
            availability="dynamic",
        )


@lru_cache(maxsize=1)
def get_provider_model_refresh_service() -> ProviderModelRefreshService:
    return ProviderModelRefreshService()


def _infer_capabilities(model_id: str) -> tuple[ProviderCapability, ...]:
    lowered = model_id.lower()
    capabilities: list[ProviderCapability] = []

    if "embed" in lowered:
        capabilities.append(ProviderCapability.EMBEDDINGS)
    if any(token in lowered for token in ("vision", "image")):
        capabilities.append(ProviderCapability.VISION)
    if not capabilities:
        capabilities.append(ProviderCapability.CHAT)
    if ProviderCapability.VISION in capabilities and ProviderCapability.CHAT not in capabilities:
        capabilities.insert(0, ProviderCapability.CHAT)
    return tuple(dict.fromkeys(capabilities))


def _infer_modalities(capabilities: Iterable[ProviderCapability]) -> tuple[str, ...]:
    capabilities_set = set(capabilities)
    modalities = ["text"]
    if ProviderCapability.VISION in capabilities_set:
        modalities.append("vision")
    return tuple(modalities)
