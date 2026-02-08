# Setup and Start

## Prerequisites
- Python 3.11+
- Node 18+
- Docker Desktop + Docker Compose
- Optional system tools for forensics and media pipelines: Tesseract OCR, Poppler, ffmpeg

## Backend dependencies
1. Create a virtual environment
```
python -m venv .venv
source .venv/bin/activate
```
2. Install Python requirements
```
pip install -r backend/requirements.txt
```

## Frontend dependencies
1. Install Node dependencies
```
npm --prefix frontend install
```

## Start (Docker, recommended)
1. Dev profile (fastest, Vite UI)
```
./scripts/start-stack.sh --mode dev
```
2. Prod profile (full stack)
```
./scripts/start-stack.sh --mode prod
```
3. Direct compose (no helper script)
```
docker compose --profile dev up -d
# or
docker compose --profile prod up -d
```

## Start (local dev, no Docker)
1. Backend API
```
uvicorn backend.app.main:app --reload
```
2. Frontend UI
```
npm --prefix frontend run dev
```

## Provider keys and model selection
- Configure provider API keys and base URLs in the Settings UI.
- Supported providers: OpenAI, Gemini, OpenRouter, LocalAI, LM Studio, Ollama, Hugging Face.
- Use the "Refresh models" button in Settings to pull model lists from each provider.

## Default ports
- API: http://localhost:8000
- UI (dev): http://localhost:5173
- UI (prod): http://localhost
- Neo4j: http://localhost:7474
- Qdrant: http://localhost:6333/dashboard
