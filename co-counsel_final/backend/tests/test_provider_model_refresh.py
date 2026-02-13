import httpx

from backend.app.services.provider_models import ProviderModelRefreshService


def test_refresh_models_openai_compatible() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"data": [{"id": "model-a"}, {"id": "model-b"}]})

    transport = httpx.MockTransport(handler)
    service = ProviderModelRefreshService(client=httpx.Client(transport=transport))

    models = service.refresh("openrouter", base_url="https://openrouter.ai/api/v1")

    assert [model.model_id for model in models] == ["model-a", "model-b"]


def test_refresh_models_ollama() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/api/tags"
        return httpx.Response(200, json={"models": [{"name": "llama3:latest"}]})

    transport = httpx.MockTransport(handler)
    service = ProviderModelRefreshService(client=httpx.Client(transport=transport))

    models = service.refresh("ollama", base_url="http://localhost:11434")

    assert [model.model_id for model in models] == ["llama3:latest"]


def test_refresh_models_huggingface() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert "huggingface.co" in str(request.url)
        return httpx.Response(200, json=[{"modelId": "meta-llama/Llama-3-8B-Instruct"}])

    transport = httpx.MockTransport(handler)
    service = ProviderModelRefreshService(client=httpx.Client(transport=transport))

    models = service.refresh("huggingface", base_url="https://api-inference.huggingface.co/models")

    assert [model.model_id for model in models] == ["meta-llama/Llama-3-8B-Instruct"]
