# Provider Streaming + Live Model Refresh Design (2026-02-07)

## Goal
Add first-class provider support for OpenRouter, LocalAI, and LM Studio alongside existing OpenAI/Gemini/Ollama/Hugging Face, with server-side live model refresh and UI model selection. Enable true streaming where supported and graceful fallbacks where not.

## Scope
- Providers: OpenRouter, LocalAI, LM Studio, Ollama, Hugging Face (plus existing OpenAI/Gemini).
- Server-side model list refresh (no client-side API calls).
- Settings UI additions: model refresh action, provider base URL overrides, and model selection.
- Streaming support in LLM service and query streaming endpoint used by the chat UI.

## Architecture
### Provider Catalog + Registry
- Extend provider catalog with OpenRouter, LocalAI, and LM Studio entries (at least one default chat model each).
- Register adapters for the new providers in the provider registry.
- Extend default `provider_api_base_urls` for OpenRouter/LocalAI/LM Studio and allow overrides via settings storage.

### Live Model Refresh
- Add a small server-side refresh service that calls provider model list endpoints (OpenAI-compatible `/models` when available).
- Cache refreshed model lists with short TTL to avoid repeated hits.
- Merge refreshed models into the catalog response served to Settings.
- If refresh fails, fall back to static catalog without breaking UI.

### Streaming
- Extend `BaseLlmService` with streaming methods and implement for OpenAI-compatible providers and Ollama.
- For providers without native streaming, emit chunked pseudo-streams to keep UI consistent.
- Implement `/query/stream` WebSocket endpoint that streams tokens + final payload using RetrievalService.

## Data Flow
1. Settings UI triggers server-side refresh for a provider.
2. Backend calls provider `/models` endpoint, caches result, returns updated catalog.
3. Settings UI updates model dropdowns immediately.
4. Chat UI uses `/query/stream` WebSocket, provider streaming emits tokens in real-time.

## Error Handling
- Provider endpoint failures -> fallback to static catalog.
- Timeouts and rate limits handled with retry/backoff and clear errors in API response.
- Streaming failures -> auto fallback to non-streaming completion.

## Testing
- Unit tests for model refresh service and catalog merge.
- API tests for refresh endpoint and settings payload integrity.
- UI test for Settings panel refresh + model dropdown update.

## Non-Goals
- Full provider-specific billing or usage dashboards.
- Client-side provider calls or key exposure.
