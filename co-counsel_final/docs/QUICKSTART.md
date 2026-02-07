# Quickstart

## Prerequisites
- Python 3.11+, Node 18+, Docker + Docker Compose

## Setup
1) Create `.env`
```
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=securepassword
VECTOR_BACKEND=qdrant
QDRANT_URL=http://localhost:6333
GEMINI_API_KEY=...
# Or OpenAI
OPENAI_API_KEY=...
```
2) Configure providers in Settings UI
- Set API keys and base URLs for OpenAI, Gemini, OpenRouter, LocalAI, LM Studio, Ollama, and Hugging Face.
- Use the "Refresh models" button to pull model lists from each provider.
3) Start services:
```
# Dev (Vite frontend)
docker compose --profile dev up -d

# Prod (full-featured stack: telemetry + voice + backups)
docker compose --profile prod up -d
```
4) Open UI
- Dev: http://localhost:5173
- Prod: http://localhost

## Validate
- Hit `GET /health` (if enabled)
- Ingest sample corpus via `POST /ingest`
- Run workflow via `POST /workflow/run`
- Ask a question via `GET /query?q=...` and verify citations
- Retrieve forensics reports via `/forensics/...` endpoints
