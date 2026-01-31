# Model Provider Policy

Defaults
- Primary: Google Gemini‑2.5‑Flash (multimodal; vision/voice capable)
- Optional: OpenAI GPT‑5.0 (user‑selectable)

Abstraction
- Implement a provider layer with unified interfaces for completion, chat, vision, and embeddings where possible.
- Configure via env: `PROVIDER=gemini|openai`, provider‑specific keys, model names.

Usage
- Ingestion Vision Agent uses Gemini by default.
- Retrieval/analysis agents can switch providers per policy/config.

Testing
- Maintain mocks for provider calls to enable offline tests.

