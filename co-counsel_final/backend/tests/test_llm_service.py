"""Tests for the LLM service module."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from backend.app.services.llm_service import (
    BaseLlmService,
    ChatMessage,
    GeminiLlmService,
    HuggingFaceLlmService,
    LlamaCppLlmService,
    LlmResponse,
    OllamaLlmService,
    OpenAILlmService,
    create_llm_service,
    get_llm_service,
    reset_llm_service_cache,
)


@pytest.fixture(autouse=True)
def _reset_cache() -> None:
    """Reset service cache before each test."""
    reset_llm_service_cache()
    yield
    reset_llm_service_cache()


class TestCreateLlmService:
    """Tests for the create_llm_service factory function."""

    def test_create_ollama_service(self) -> None:
        service = create_llm_service("ollama", model="llama3.1")
        assert isinstance(service, OllamaLlmService)
        assert service.model == "llama3.1"
        assert service.provider_id == "ollama"

    def test_create_llamacpp_service(self) -> None:
        service = create_llm_service("llama.cpp", model="llama-3.1-8b-instruct-q4")
        assert isinstance(service, LlamaCppLlmService)
        assert service.model == "llama-3.1-8b-instruct-q4"
        assert service.provider_id == "llama.cpp"

    def test_create_gemini_service(self) -> None:
        service = create_llm_service("gemini", model="gemini-2.5-flash")
        assert isinstance(service, GeminiLlmService)
        assert service.model == "gemini-2.5-flash"
        assert service.provider_id == "gemini"

    def test_create_openai_service(self) -> None:
        service = create_llm_service("openai", model="gpt-4o")
        assert isinstance(service, OpenAILlmService)
        assert service.model == "gpt-4o"
        assert service.provider_id == "openai"

    def test_create_huggingface_service(self) -> None:
        service = create_llm_service("huggingface", model="meta-llama-3.1-70b-instruct")
        assert isinstance(service, HuggingFaceLlmService)
        assert service.model == "meta-llama-3.1-70b-instruct"
        assert service.provider_id == "huggingface"

    def test_unsupported_provider_raises(self) -> None:
        with pytest.raises(ValueError, match="Unsupported LLM provider"):
            create_llm_service("unknown-provider")

    def test_gguf_local_uses_llamacpp_service(self) -> None:
        service = create_llm_service("gguf-local", model="llama-3.2-vision-q4")
        assert isinstance(service, LlamaCppLlmService)

    def test_azure_openai_uses_openai_service(self) -> None:
        service = create_llm_service("azure-openai", model="gpt-4o")
        assert isinstance(service, OpenAILlmService)


class TestGetLlmService:
    """Tests for the get_llm_service factory with provider registry."""

    def test_returns_cached_instance(self) -> None:
        svc1 = get_llm_service(provider="ollama", model="llama3.1")
        svc2 = get_llm_service(provider="ollama", model="llama3.1")
        assert svc1 is svc2

    def test_uses_provider_registry_when_no_provider_specified(self) -> None:
        # This should use the primary provider from settings (gemini by default)
        service = get_llm_service()
        # Should resolve to primary provider
        assert service.provider_id in ("gemini", "ollama", "openai")


class TestOllamaLlmService:
    """Tests for Ollama service implementation."""

    def test_init_with_defaults(self) -> None:
        service = OllamaLlmService(model="llama3.1")
        assert service.model == "llama3.1"
        assert service.base_url == "http://localhost:11434"

    def test_init_with_custom_base_url(self) -> None:
        service = OllamaLlmService(model="llama3.1", base_url="http://192.168.1.100:11434")
        assert service.base_url == "http://192.168.1.100:11434"

    @patch("backend.app.services.llm_service.OllamaLlmService._get_client")
    def test_generate_text_calls_client(self, mock_get_client: MagicMock) -> None:
        mock_client = MagicMock()
        mock_client.chat.return_value = {"message": {"content": "Hello world!"}}
        mock_get_client.return_value = mock_client

        service = OllamaLlmService(model="llama3.1")
        result = service.generate_text("Say hello")

        assert result == "Hello world!"
        mock_client.chat.assert_called_once()

    @patch("backend.app.services.llm_service.OllamaLlmService._get_client")
    def test_generate_chat_returns_llm_response(self, mock_get_client: MagicMock) -> None:
        mock_client = MagicMock()
        mock_client.chat.return_value = {"message": {"content": "Chat response!"}}
        mock_get_client.return_value = mock_client

        service = OllamaLlmService(model="llama3.1")
        messages = [ChatMessage(role="user", content="Hello")]
        response = service.generate_chat(messages)

        assert isinstance(response, LlmResponse)
        assert response.content == "Chat response!"
        assert response.provider == "ollama"
        assert response.model == "llama3.1"


class TestLlamaCppLlmService:
    """Tests for llama.cpp service implementation."""

    def test_init_with_defaults(self) -> None:
        service = LlamaCppLlmService(model="llama-3.1-8b-instruct-q4")
        assert service.model == "llama-3.1-8b-instruct-q4"
        assert service.base_url == "http://localhost:8080"

    def test_init_with_custom_base_url(self) -> None:
        service = LlamaCppLlmService(model="test", base_url="http://192.168.1.100:8080")
        assert service.base_url == "http://192.168.1.100:8080"


class TestChatMessage:
    """Tests for ChatMessage dataclass."""

    def test_create_user_message(self) -> None:
        msg = ChatMessage(role="user", content="Hello")
        assert msg.role == "user"
        assert msg.content == "Hello"

    def test_create_assistant_message(self) -> None:
        msg = ChatMessage(role="assistant", content="Hi there!")
        assert msg.role == "assistant"
        assert msg.content == "Hi there!"


class TestLlmResponse:
    """Tests for LlmResponse dataclass."""

    def test_create_minimal_response(self) -> None:
        response = LlmResponse(content="Test", model="test-model", provider="test")
        assert response.content == "Test"
        assert response.model == "test-model"
        assert response.provider == "test"
        assert response.usage is None

    def test_create_response_with_usage(self) -> None:
        usage = {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30}
        response = LlmResponse(content="Test", model="m", provider="p", usage=usage)
        assert response.usage == usage
