"""Unified LLM service with multi-provider support.

This module provides a factory-based approach to LLM services, integrating with
the provider registry to support local models (Ollama, llama.cpp) and cloud
providers (Gemini, OpenAI).
"""
from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Dict, List, Optional, Sequence

from backend.app.config import get_settings
from backend.app.providers.catalog import ProviderCapability
from backend.app.providers.registry import (
    ProviderCapabilityError,
    ProviderResolution,
    get_provider_registry,
)


@dataclass
class ChatMessage:
    """Represents a chat message."""
    role: str  # "system", "user", "assistant"
    content: str


@dataclass
class LlmResponse:
    """Structured response from LLM service."""
    content: str
    model: str
    provider: str
    usage: Dict[str, int] | None = None
    raw_response: Any = None


class BaseLlmService(ABC):
    """Abstract base class for LLM services."""

    provider_id: str = ""

    def __init__(
        self,
        *,
        model: str,
        base_url: str | None = None,
        api_key: str | None = None,
        **kwargs: Any,
    ) -> None:
        self.model = model
        self.base_url = base_url
        self.api_key = api_key
        self._extra = kwargs

    @abstractmethod
    def generate_text(self, prompt: str, **kwargs: Any) -> str:
        """Generate text from a prompt synchronously."""
        raise NotImplementedError

    @abstractmethod
    async def agenerate_text(self, prompt: str, **kwargs: Any) -> str:
        """Generate text from a prompt asynchronously."""
        raise NotImplementedError

    def generate_chat(
        self,
        messages: Sequence[ChatMessage],
        **kwargs: Any,
    ) -> LlmResponse:
        """Generate a chat response synchronously."""
        # Default implementation: convert to single prompt
        prompt = "\n".join(f"{m.role}: {m.content}" for m in messages)
        content = self.generate_text(prompt, **kwargs)
        return LlmResponse(
            content=content,
            model=self.model,
            provider=self.provider_id,
        )

    async def agenerate_chat(
        self,
        messages: Sequence[ChatMessage],
        **kwargs: Any,
    ) -> LlmResponse:
        """Generate a chat response asynchronously."""
        prompt = "\n".join(f"{m.role}: {m.content}" for m in messages)
        content = await self.agenerate_text(prompt, **kwargs)
        return LlmResponse(
            content=content,
            model=self.model,
            provider=self.provider_id,
        )


# ---------------------------------------------------------------------------
# Ollama Implementation
# ---------------------------------------------------------------------------

class OllamaLlmService(BaseLlmService):
    """LLM service using Ollama for local model inference."""

    provider_id = "ollama"

    def __init__(
        self,
        *,
        model: str = "llama3.1",
        base_url: str | None = None,
        **kwargs: Any,
    ) -> None:
        super().__init__(model=model, base_url=base_url or "http://localhost:11434", **kwargs)
        self._client: Any = None

    def _get_client(self) -> Any:
        if self._client is None:
            try:
                import ollama
                self._client = ollama.Client(host=self.base_url)
            except ImportError:
                raise RuntimeError(
                    "Ollama client not installed. Install with: pip install ollama"
                )
        return self._client

    def generate_text(self, prompt: str, **kwargs: Any) -> str:
        client = self._get_client()
        try:
            response = client.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                options={"num_predict": kwargs.get("max_tokens", 1024)},
            )
            return response["message"]["content"]
        except Exception as e:
            raise RuntimeError(f"Ollama generation failed: {e}") from e

    async def agenerate_text(self, prompt: str, **kwargs: Any) -> str:
        # Ollama client is sync, wrap in executor
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, lambda: self.generate_text(prompt, **kwargs)
        )

    def generate_chat(
        self,
        messages: Sequence[ChatMessage],
        **kwargs: Any,
    ) -> LlmResponse:
        client = self._get_client()
        ollama_messages = [{"role": m.role, "content": m.content} for m in messages]
        try:
            response = client.chat(
                model=self.model,
                messages=ollama_messages,
                options={"num_predict": kwargs.get("max_tokens", 1024)},
            )
            return LlmResponse(
                content=response["message"]["content"],
                model=self.model,
                provider=self.provider_id,
                raw_response=response,
            )
        except Exception as e:
            raise RuntimeError(f"Ollama chat failed: {e}") from e


# ---------------------------------------------------------------------------
# llama.cpp Implementation
# ---------------------------------------------------------------------------

class LlamaCppLlmService(BaseLlmService):
    """LLM service using llama.cpp server for local GGUF model inference."""

    provider_id = "llama.cpp"

    def __init__(
        self,
        *,
        model: str = "llama-3.1-8b-instruct-q4",
        base_url: str | None = None,
        **kwargs: Any,
    ) -> None:
        super().__init__(
            model=model,
            base_url=base_url or "http://localhost:8080",
            **kwargs,
        )

    def _make_request(self, prompt: str, **kwargs: Any) -> str:
        import urllib.request
        import json

        url = f"{self.base_url}/completion"
        data = json.dumps({
            "prompt": prompt,
            "n_predict": kwargs.get("max_tokens", 1024),
            "temperature": kwargs.get("temperature", 0.7),
            "stop": kwargs.get("stop", []),
        }).encode("utf-8")

        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                return result.get("content", "")
        except Exception as e:
            raise RuntimeError(f"llama.cpp request failed: {e}") from e

    def generate_text(self, prompt: str, **kwargs: Any) -> str:
        return self._make_request(prompt, **kwargs)

    async def agenerate_text(self, prompt: str, **kwargs: Any) -> str:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, lambda: self.generate_text(prompt, **kwargs)
        )


# ---------------------------------------------------------------------------
# OpenAI-Compatible Implementation
# ---------------------------------------------------------------------------

class OpenAILlmService(BaseLlmService):
    """LLM service using OpenAI API or compatible endpoints."""

    provider_id = "openai"

    def __init__(
        self,
        *,
        model: str = "gpt-4o",
        base_url: str | None = None,
        api_key: str | None = None,
        **kwargs: Any,
    ) -> None:
        super().__init__(model=model, base_url=base_url, api_key=api_key, **kwargs)
        self._client: Any = None

    def _get_client(self) -> Any:
        if self._client is None:
            try:
                import openai
                self._client = openai.OpenAI(
                    api_key=self.api_key,
                    base_url=self.base_url,
                )
            except ImportError:
                raise RuntimeError(
                    "OpenAI client not installed. Install with: pip install openai"
                )
        return self._client

    def generate_text(self, prompt: str, **kwargs: Any) -> str:
        client = self._get_client()
        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=kwargs.get("max_tokens", 1024),
                temperature=kwargs.get("temperature", 0.7),
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            raise RuntimeError(f"OpenAI generation failed: {e}") from e

    async def agenerate_text(self, prompt: str, **kwargs: Any) -> str:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, lambda: self.generate_text(prompt, **kwargs)
        )

    def generate_chat(
        self,
        messages: Sequence[ChatMessage],
        **kwargs: Any,
    ) -> LlmResponse:
        client = self._get_client()
        openai_messages = [{"role": m.role, "content": m.content} for m in messages]
        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=openai_messages,
                max_tokens=kwargs.get("max_tokens", 1024),
                temperature=kwargs.get("temperature", 0.7),
            )
            usage = None
            if response.usage:
                usage = {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                }
            return LlmResponse(
                content=response.choices[0].message.content or "",
                model=self.model,
                provider=self.provider_id,
                usage=usage,
                raw_response=response,
            )
        except Exception as e:
            raise RuntimeError(f"OpenAI chat failed: {e}") from e


# ---------------------------------------------------------------------------
# Gemini Implementation
# ---------------------------------------------------------------------------

class GeminiLlmService(BaseLlmService):
    """LLM service using Google Gemini API."""

    provider_id = "gemini"

    def __init__(
        self,
        *,
        model: str = "gemini-2.5-flash",
        api_key: str | None = None,
        **kwargs: Any,
    ) -> None:
        super().__init__(model=model, api_key=api_key, **kwargs)
        self._client: Any = None

    def _get_client(self) -> Any:
        if self._client is None:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self._client = genai.GenerativeModel(self.model)
            except ImportError:
                raise RuntimeError(
                    "Google Generative AI not installed. Install with: pip install google-generativeai"
                )
        return self._client

    def generate_text(self, prompt: str, **kwargs: Any) -> str:
        client = self._get_client()
        try:
            response = client.generate_content(prompt)
            return response.text
        except Exception as e:
            raise RuntimeError(f"Gemini generation failed: {e}") from e

    async def agenerate_text(self, prompt: str, **kwargs: Any) -> str:
        client = self._get_client()
        try:
            response = await client.generate_content_async(prompt)
            return response.text
        except Exception as e:
            raise RuntimeError(f"Gemini async generation failed: {e}") from e

    def generate_chat(
        self,
        messages: Sequence[ChatMessage],
        **kwargs: Any,
    ) -> LlmResponse:
        client = self._get_client()
        # Convert to Gemini format
        history = []
        user_message = ""
        for msg in messages:
            if msg.role == "system":
                # Gemini handles system prompts differently
                history.append({"role": "user", "parts": [msg.content]})
                history.append({"role": "model", "parts": ["Understood."]})
            elif msg.role == "user":
                user_message = msg.content
            elif msg.role == "assistant":
                history.append({"role": "model", "parts": [msg.content]})

        try:
            chat = client.start_chat(history=history)
            response = chat.send_message(user_message)
            return LlmResponse(
                content=response.text,
                model=self.model,
                provider=self.provider_id,
                raw_response=response,
            )
        except Exception as e:
            raise RuntimeError(f"Gemini chat failed: {e}") from e


# ---------------------------------------------------------------------------
# HuggingFace Implementation
# ---------------------------------------------------------------------------

class HuggingFaceLlmService(BaseLlmService):
    """LLM service using HuggingFace Inference API."""

    provider_id = "huggingface"

    def __init__(
        self,
        *,
        model: str = "meta-llama-3.1-70b-instruct",
        api_key: str | None = None,
        **kwargs: Any,
    ) -> None:
        super().__init__(
            model=model,
            base_url="https://api-inference.huggingface.co/models",
            api_key=api_key,
            **kwargs,
        )

    def generate_text(self, prompt: str, **kwargs: Any) -> str:
        import urllib.request
        import json

        url = f"{self.base_url}/{self.model}"
        data = json.dumps({
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": kwargs.get("max_tokens", 1024),
                "temperature": kwargs.get("temperature", 0.7),
            },
        }).encode("utf-8")

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                if isinstance(result, list) and result:
                    return result[0].get("generated_text", "")
                return ""
        except Exception as e:
            raise RuntimeError(f"HuggingFace request failed: {e}") from e

    async def agenerate_text(self, prompt: str, **kwargs: Any) -> str:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, lambda: self.generate_text(prompt, **kwargs)
        )


# ---------------------------------------------------------------------------
# Service Registry & Factory
# ---------------------------------------------------------------------------

SERVICE_CLASSES: Dict[str, type[BaseLlmService]] = {
    "ollama": OllamaLlmService,
    "llama.cpp": LlamaCppLlmService,
    "gguf-local": LlamaCppLlmService,  # GGUF uses same server protocol
    "openai": OpenAILlmService,
    "azure-openai": OpenAILlmService,  # Azure uses OpenAI-compatible API
    "gemini": GeminiLlmService,
    "huggingface": HuggingFaceLlmService,
}


def create_llm_service(
    provider: str,
    model: str | None = None,
    **kwargs: Any,
) -> BaseLlmService:
    """Create an LLM service instance for the specified provider.

    Args:
        provider: Provider ID (ollama, llama.cpp, gemini, openai, etc.)
        model: Model ID to use. If None, uses provider default.
        **kwargs: Additional arguments passed to service constructor.

    Returns:
        Configured LLM service instance.

    Raises:
        ValueError: If provider is not supported.
    """
    service_class = SERVICE_CLASSES.get(provider)
    if not service_class:
        raise ValueError(
            f"Unsupported LLM provider: {provider}. "
            f"Available: {', '.join(SERVICE_CLASSES.keys())}"
        )

    settings = get_settings()

    # Resolve model from settings if not provided
    if model is None:
        if provider in ("ollama", "llama.cpp", "gguf-local"):
            model = settings.ingestion_ollama_model
        else:
            model = settings.default_chat_model

    # Resolve API keys and base URLs from settings
    if provider == "ollama":
        kwargs.setdefault("base_url", settings.ingestion_ollama_base or "http://localhost:11434")
    elif provider == "openai":
        kwargs.setdefault("api_key", settings.ingestion_openai_api_key)
        kwargs.setdefault("base_url", settings.provider_api_base_urls.get("openai"))
    elif provider == "gemini":
        kwargs.setdefault("api_key", settings.gemini_api_key)
    elif provider == "llama.cpp":
        runtime_path = settings.provider_local_runtime_paths.get("llama.cpp")
        if runtime_path:
            kwargs.setdefault("base_url", f"http://localhost:8080")

    return service_class(model=model, **kwargs)


@lru_cache(maxsize=1)
def get_llm_service(
    provider: str | None = None,
    model: str | None = None,
) -> BaseLlmService:
    """Get a cached LLM service instance using the provider registry.

    This is the primary entry point for obtaining LLM services. It integrates
    with the provider registry to respect primary/secondary provider settings.

    Args:
        provider: Override provider ID. If None, uses primary provider from settings.
        model: Override model ID. If None, uses default model for provider.

    Returns:
        Configured LLM service instance (cached).
    """
    settings = get_settings()

    if provider is None:
        # Use provider registry to resolve
        try:
            registry = get_provider_registry(
                primary_provider=settings.model_providers_primary,
                secondary_provider=settings.model_providers_secondary,
                api_base_urls=settings.provider_api_base_urls,
                runtime_paths=settings.provider_local_runtime_paths,
            )
            resolution: ProviderResolution = registry.resolve(ProviderCapability.CHAT)
            provider = resolution.provider.provider_id
            if model is None:
                model = resolution.model.model_id
        except ProviderCapabilityError:
            # Fallback to Ollama for local-first operation
            provider = "ollama"
            model = settings.ingestion_ollama_model

    return create_llm_service(provider, model)


def reset_llm_service_cache() -> None:
    """Clear the cached LLM service instance."""
    get_llm_service.cache_clear()


__all__ = [
    "BaseLlmService",
    "ChatMessage",
    "LlmResponse",
    "OllamaLlmService",
    "LlamaCppLlmService",
    "OpenAILlmService",
    "GeminiLlmService",
    "HuggingFaceLlmService",
    "create_llm_service",
    "get_llm_service",
    "reset_llm_service_cache",
]
