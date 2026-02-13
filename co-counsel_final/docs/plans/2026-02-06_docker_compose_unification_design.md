# Docker Compose Unification Design

**Date:** 2026-02-06

## Goals
- Consolidate Docker orchestration into a single compose file with **dev** and **prod** profiles.
- Ensure **prod** is full-featured (includes telemetry, STT/TTS, backups, and observability).
- Keep data persistence consistent across profiles with a single host-side storage layout.
- Fix Dockerfile build issues and align frontend production Nginx config.
- Update docs and reproducibility logs to reflect the new runtime model.

## Non-Goals
- No changes to core application logic or agent orchestration behavior.
- No new services beyond existing infra stack.

## Architecture Summary
- Single compose file: `co-counsel_final/docker-compose.yml`.
- **Profiles**:
  - `dev`: api + neo4j + qdrant + frontend (Vite)
  - `prod`: api + neo4j + qdrant + frontend-prod + stt + tts + otel-collector + grafana + storage-backup
- Environment configuration centralized in `.env` with safe defaults.
- Host data under `co-counsel_final/var/...` used consistently for all profiles.
- Secrets remain in `co-counsel_final/docker/secrets` (dev defaults, override in prod).

## Key Changes
- Merge legacy infra compose services into root compose using profiles (archive the old compose file).
- Fix `frontend/Dockerfile.prod` Nginx config copy path.
- Clean `backend/Dockerfile` (remove stray whitespace, keep deterministic installs).
- Update docs to describe dev/prod commands and required env variables.
- Archive superseded compose files into `archive-co counsel` with a short README note.

## Risks
- Profile misconfiguration could start dev frontend in prod; mitigated by profile separation and docs.
- Missing env variables in prod could break telemetry or voice services; mitigated by `.env` defaults and docs.

## Validation
- `docker compose --profile dev config` renders valid config.
- `docker compose --profile prod config` renders valid config.
- Optional: `docker compose --profile dev up -d` and `docker compose --profile prod up -d` (manual verification).
