from backend.app.providers.catalog import MODEL_CATALOG, ProviderCapability
from backend.app.providers.registry import get_provider_registry


def test_model_catalog_contains_new_providers() -> None:
    assert "openrouter" in MODEL_CATALOG
    assert "localai" in MODEL_CATALOG
    assert "lmstudio" in MODEL_CATALOG


def test_provider_registry_resolves_new_providers() -> None:
    registry = get_provider_registry(
        primary_provider="openrouter",
        secondary_provider="localai",
        api_base_urls={
            "openrouter": "https://openrouter.ai/api/v1",
            "localai": "http://localhost:8080/v1",
        },
        runtime_paths={},
    )
    resolution = registry.resolve(ProviderCapability.CHAT)
    assert resolution.provider.provider_id in {"openrouter", "localai"}
