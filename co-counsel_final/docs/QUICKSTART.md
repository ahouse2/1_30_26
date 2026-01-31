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
PROVIDER=gemini
GEMINI_API_KEY=...
# Or OpenAI
# PROVIDER=openai
# OPENAI_API_KEY=...
```
2) Start services (to be added):
```
docker compose up -d
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
- Ingest sample corpus via `POST /ingest`
- Ask a question via `GET /query?q=...` and verify citations
- Retrieve forensics reports via `/forensics/document?id=...` and `/forensics/image?id=...`
