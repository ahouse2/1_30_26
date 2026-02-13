# Settings and Providers Runbook

## UI Entry
- Top-right `Settings` panel

## Primary APIs
- `GET /settings`
- `PATCH /settings`
- `GET /settings/models`
- `POST /settings/models/refresh`

## Supported Providers
- Gemini
- OpenAI
- OpenRouter
- LocalAI
- LM Studio
- Ollama
- Hugging Face

## Operator Steps
1. Set primary and secondary providers.
2. Refresh provider models for each active provider.
3. Set default models for `chat`, `embeddings`, and `vision`.
4. Configure module-level overrides for stations that need custom models.
5. Save credentials and validate each provider status in Settings.

## Success Criteria
- Defaults and module overrides persist after reload.
- Query/timeline/voice stations reflect provider selections.

## Common Issues
- Model list empty:
  - Check API base URL and provider key validity.
- Overrides ignored:
  - Ensure module override has both provider and model selected.
