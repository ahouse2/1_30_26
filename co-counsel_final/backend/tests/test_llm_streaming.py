from backend.app.services.llm_service import BaseLlmService


class DummyService(BaseLlmService):
    provider_id = "dummy"

    def generate_text(self, prompt: str, **kwargs):
        return "hello world"

    async def agenerate_text(self, prompt: str, **kwargs):
        return "hello world"


def test_streaming_fallback_chunks() -> None:
    service = DummyService(model="dummy")
    chunks = list(service.stream_text("hello world", chunk_size=5))
    assert chunks == ["hello", " worl", "d"]
