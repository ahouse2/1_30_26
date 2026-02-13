# Context Compact Checkpoint — 2026-02-11 (PST)

## Current Operational State
- Docker prod stack core is up: `api`, `neo4j`, `qdrant`, `frontend-prod`, `grafana`, `otel-collector`, `storage-backup`.
- Verified:
  - `http://localhost:8000/docs` returns `200 OK`.
  - `http://localhost/` reachable (`frontend-prod`).

## Key Runtime Fixes Applied This Cycle
- Compose/runtime stabilization:
  - Removed invalid Neo4j password-file env from Neo4j service.
  - Moved Neo4j migrations mount to `/migrations` and aligned migration runner path.
  - Added backend bind mount for fast operational patches in prod compose.
- Backend startup hardening:
  - Added JWT import fallback (`python-jose` -> `pyjwt`) in auth modules.
  - Added password hashing fallback when `passlib` unavailable.
  - Added DB bootstrap fallback to SQLite when Postgres driver/target unavailable.
  - Made agent prewarm and graph-refinement startup optional to prevent boot-time crashes.
- Build reliability:
  - Added/used AppleDouble cleanup (`._*`) handling and ignores for Docker context issues.

## Files Updated (this cycle)
- `docker-compose.yml`
- `scripts/bootstrap_full_stack.sh`
- `infra/profiles/prod.env`
- `docker/secrets/neo4j_password.txt`
- `backend/app/api/auth.py`
- `backend/app/auth/jwt.py`
- `backend/app/database.py`
- `backend/app/events.py`

## Active Goal (Next)
1. Run real ingestion vertical slice end-to-end and capture failure points.
2. Patch ingestion UX/reporting gaps (source selection, progress/recovery, validation report).
3. Continue panel parity polish (In-Court Presentation, Timeline filters, Research/Strategy refinements).
4. Re-enable graph refinement safely behind explicit startup/data guards after validation.

## Notes
- Keep step-away forward progress (no circular rewrites).
- Continue updating `docs/plans/2026-02-09_gap_checklist_live.md` and reproducibility logs as tasks close.
