# Quickstart

## Prerequisites
- Python 3.11+, Node 18+, Docker + Docker Compose

## Setup
1) Create `.env`
```
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=securepassword
VECTOR_DIR=./storage/vector
ENCRYPTION_KEY=base64-url-safe-32-byte-key
INGESTION_WORKSPACE_DIR=./storage/workspaces
PROVIDER=gemini
GEMINI_API_KEY=...
# Or OpenAI
# PROVIDER=openai
# OPENAI_API_KEY=...
```
2) Start services (one-click prod):
```
./scripts/run-prod.sh

Full production stack (includes voice profile):
./scripts/run-prod-full.sh

Operational smoke report (exports markdown + json to logs/build_logs):
./scripts/smoke-operational.sh
```
Provider support (implemented):
- Gemini
- OpenAI
- OpenRouter
- LocalAI
- LM Studio
- Ollama
- Hugging Face

Provider config examples:
```
# OpenRouter (chat)
MODEL_PROVIDERS_PRIMARY=openrouter
DEFAULT_CHAT_MODEL=openrouter/anthropic/claude-3.5-sonnet

# Ollama (local chat)
MODEL_PROVIDERS_PRIMARY=ollama
DEFAULT_CHAT_MODEL=llama3.1
OLLAMA_BASE_URL=http://localhost:11434

# LocalAI (OpenAI-compatible local endpoint)
MODEL_PROVIDERS_PRIMARY=localai
DEFAULT_CHAT_MODEL=localai/gpt-4o-mini
LOCALAI_BASE_URL=http://localhost:8080/v1

# Hugging Face embeddings
MODEL_PROVIDERS_PRIMARY=huggingface
DEFAULT_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```
Optional flags:
```
./scripts/run-prod.sh --no-seed --data-dir "/path/to/case-data" --e2e
API_BASE_URL=http://localhost:8000 CASE_ID=CASE-042 ./scripts/smoke-operational.sh
# Include auth for protected endpoints (query/timeline):
AUTH_BEARER_TOKEN=<jwt> API_BASE_URL=http://localhost:8000 CASE_ID=CASE-042 ./scripts/smoke-operational.sh
```
Enable optional voice services (stt/tts):
```
./scripts/run-prod.sh --voice
```
Override voice images if needed:
```
STT_IMAGE=linuxserver/faster-whisper:latest TTS_IMAGE=rhasspy/larynx:latest TTS_BACKEND=local ./scripts/run-prod.sh --voice
```
If you still have an old `ghcr.io/guillaumekln/faster-whisper-server:*` override in your shell/env, startup now auto-corrects it to `linuxserver/faster-whisper:latest`.

Voice profile details:
- STT runs from `linuxserver/faster-whisper:latest` (host `:9000` -> container `:10300`)
- TTS defaults to local Coqui for more natural voice (`TTS_BACKEND=local`).
- You can still run `rhasspy/larynx:latest` by setting `TTS_BACKEND=remote`.
Observability alert probe:
```
python tools/monitoring/slo_alert_probe.py --metrics-url http://localhost:9464/metrics
```
3) Run backend locally (once scaffolded)
```
uv run python -m api
```
4) Open UI (once scaffolded)
```
npm run dev
```

## Validate
- Hit `GET /health` (when implemented)
- Upload a document via `POST /api/documents/upload` (multipart form: `case_id`, `doc_type`, `file`)
- Start a folder upload via `POST /api/ingestion/folder/start` with `{ "folder_name": "...", "doc_type": "my_documents" }`
- Start each file upload via `POST /api/ingestion/folder/{folder_id}/file/start`
- Stream chunks via `POST /api/ingestion/file/{upload_id}/chunk`, then `POST /api/ingestion/file/{upload_id}/complete`
- Finalize the folder via `POST /api/ingestion/folder/{folder_id}/complete` to enqueue ingestion
- Poll ingestion status via `GET /api/ingestion/{job_id}/status`
- Manually run a stage via `POST /api/ingestion/{job_id}/stage/{stage}/run` with `{ "resume_downstream": true }`
- Ask a question via `GET /query?q=...` and verify citations
- Retrieve forensics reports via `/forensics/document?id=...` and `/forensics/image?id=...`

## Module Runbooks
- Station-by-station operating guides live in `docs/runbooks/modules/README.md`
