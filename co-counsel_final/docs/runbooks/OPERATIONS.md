# Operations Runbook (MVP)

Services
- api: FastAPI (uvicorn); health at /health
- neo4j: bolt at 7687; browser 7474
- qdrant: HTTP 6333

Health Checks
- curl http://localhost:8000/health → {"status":"ok"}
- Check Docker logs: docker compose --profile prod logs -f

Env Vars
- NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, QDRANT_URL, VECTOR_DIR
- PACER_ENDPOINT, UNICOURT_ENDPOINT, LACS_ENDPOINT (court connector base URLs)
- CASELAW_API_KEY, COURTLISTENER_TOKEN (case law sources)

Common Tasks
- Restart service: docker compose --profile prod restart api
- Rebuild API: docker compose --profile prod up -d --build api

Module Runbooks
- Full station-by-station operator guides: `docs/runbooks/modules/README.md`

Court Integrations
- Credentials are stored via Settings (UI or `PATCH /settings`) in encrypted storage.
- Paid retrievals are recorded in `storage/court_payments/ledger.jsonl` (append-only).
- Provider readiness lives at `GET /courts/providers`.
