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
- Upload a document via `POST /api/documents/upload` (multipart form: `case_id`, `doc_type`, `file`)
- Start a folder upload via `POST /api/ingestion/folder/start` with `{ "folder_name": "...", "doc_type": "my_documents" }`
- Start each file upload via `POST /api/ingestion/folder/{folder_id}/file/start`
- Stream chunks via `POST /api/ingestion/file/{upload_id}/chunk`, then `POST /api/ingestion/file/{upload_id}/complete`
- Finalize the folder via `POST /api/ingestion/folder/{folder_id}/complete` to enqueue ingestion
- Poll ingestion status via `GET /api/ingestion/{job_id}/status`
- Manually run a stage via `POST /api/ingestion/{job_id}/stage/{stage}/run` with `{ "resume_downstream": true }`
- Ask a question via `GET /query?q=...` and verify citations
- Retrieve forensics reports via `/forensics/document?id=...` and `/forensics/image?id=...`
