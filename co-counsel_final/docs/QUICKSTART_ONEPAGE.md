# Co-Counsel One-Page Install + Run (macOS)

**Target repo:** `/Volumes/MAC_DEV/REPOS/2-4-26_tree/co-counsel_final`

## 1) Prerequisites (system)
- Docker Desktop + Docker Compose
- Python 3.11+
- Node 18+
- Optional: Tesseract OCR (for `pytesseract`)

## 2) Clone + enter repo
```bash
git clone <repo-url>
cd /Volumes/MAC_DEV/REPOS/2-4-26_tree/co-counsel_final
```

## 3) Configure environment
- Edit profile files (preferred):
  - `infra/profiles/dev.env`
  - `infra/profiles/prod.env`
- Minimum keys:
  - LLM: `GEMINI_API_KEY` or `OPENAI_API_KEY`
  - Graph: `NEO4J_PASSWORD`
  - Vector: `QDRANT_URL` (if not using defaults)
- Provider endpoints + keys:
  - Set/override base URLs and API keys in the Settings UI for OpenRouter, LocalAI, LM Studio, Hugging Face, and Ollama.

Full list: `backend/app/config.py` and `docs/QUICKSTART.md`.

## 4) Start (recommended: Docker)
**Dev (Vite UI, fastest):**
```bash
./scripts/start-stack.sh --mode dev
```

**Prod (full stack: telemetry + voice + backups):**
```bash
./scripts/start-stack-full.sh --mode prod
```

**Direct compose (no helper scripts):**
```bash
docker compose --profile dev up -d
# or
docker compose --profile prod up -d
```

## 5) Validate
- API docs: `http://localhost:8000/docs`
- UI:
  - Dev: `http://localhost:5173`
  - Prod: `http://localhost`

## 6) Stop
```bash
docker compose --profile dev down
# or
docker compose --profile prod down
```

## Optional: Local dev (no Docker)
```bash
./scripts/bootstrap_backend.sh
cd frontend && npm ci
uvicorn backend.app.main:app --reload
cd frontend && npm run dev
```

## Notes
- `./scripts/bootstrap_full_stack.sh` is the advanced launcher (handles model caches + migrations).
- `start.sh` is legacy and does not use dev/prod profiles.
