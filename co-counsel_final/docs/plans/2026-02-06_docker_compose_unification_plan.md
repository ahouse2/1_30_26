# Docker Compose Unification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate Docker orchestration into a single compose file with dev/prod profiles, where prod is full-featured and docs/logs reflect the new runtime model.

**Architecture:** One root compose file with explicit `dev` and `prod` profiles; core services run in both; prod-only services include telemetry, voice services, and backups. Shared host-side storage lives under `co-counsel_final/var/`.

**Tech Stack:** Docker Compose v2, Python (backend), Node/Vite + Nginx (frontend)

---

### Task 1: Enforce dev/prod profiles + full prod services in root compose

**Files:**
- Create: `co-counsel_final/scripts/compose_profile_check.sh`
- Modify: `co-counsel_final/docker-compose.yml`

**Step 1: Write the failing test**

Create `co-counsel_final/scripts/compose_profile_check.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail

DEV_CONFIG=$(docker compose --profile dev config)
PROD_CONFIG=$(docker compose --profile prod config)

# Dev should include frontend and exclude frontend-prod
if ! echo "$DEV_CONFIG" | grep -q "frontend:"; then
  echo "dev config missing frontend"; exit 1; fi
if echo "$DEV_CONFIG" | grep -q "frontend-prod:"; then
  echo "dev config unexpectedly includes frontend-prod"; exit 1; fi

# Prod should include frontend-prod and exclude frontend
if ! echo "$PROD_CONFIG" | grep -q "frontend-prod:"; then
  echo "prod config missing frontend-prod"; exit 1; fi
if echo "$PROD_CONFIG" | grep -q "frontend:"; then
  echo "prod config unexpectedly includes frontend"; exit 1; fi

# Prod should include full-featured services
for svc in stt tts otel-collector grafana storage-backup; do
  if ! echo "$PROD_CONFIG" | grep -q "$svc:"; then
    echo "prod config missing $svc"; exit 1; fi
  done

echo "compose profiles check passed"
```

**Step 2: Run test to verify it fails**
Run: `bash co-counsel_final/scripts/compose_profile_check.sh`
Expected: FAIL with missing profile/service messages because root compose is not yet profile-aware.

**Step 3: Write minimal implementation**
Update `co-counsel_final/docker-compose.yml` to:
- Add only `dev` and `prod` profiles (no community/pro/enterprise).
- Include `api`, `neo4j`, `qdrant` for both profiles (explicit `profiles: [dev, prod]` or no profile).
- Set `frontend` to `profiles: [dev]` and `frontend-prod` to `profiles: [prod]`.
- Merge prod-only services from the legacy infra compose (`stt`, `tts`, `otel-collector`, `grafana`, `storage-backup`) under `profiles: [prod]`.
- Bring env/volumes from infra into root compose, pointing to `co-counsel_final/var/...`.
- Keep `neo4j_password` secret wiring consistent for `api` and `neo4j`.
- Preserve `x-gpu-capable` anchor for `stt` and `tts` with `GPU_DEVICE_COUNT` defaults.

**Step 4: Run test to verify it passes**
Run: `bash co-counsel_final/scripts/compose_profile_check.sh`
Expected: PASS with “compose profiles check passed”.

**Step 5: Commit**
```bash
git add co-counsel_final/docker-compose.yml co-counsel_final/scripts/compose_profile_check.sh
# git commit -m "chore: unify docker compose dev/prod profiles"  # Skipped per user request
```

---

### Task 2: Fix frontend/backend Dockerfiles for correct prod builds

**Files:**
- Modify: `co-counsel_final/frontend/Dockerfile.prod`
- Modify: `co-counsel_final/backend/Dockerfile`

**Step 1: Write the failing test**
Run: `docker build -f co-counsel_final/frontend/Dockerfile.prod co-counsel_final/frontend`
Expected: FAIL because `frontend/frontend-nginx.conf` path does not exist in build context.

**Step 2: Run test to verify it fails**
Confirm the build fails on the `COPY frontend/frontend-nginx.conf` step.

**Step 3: Write minimal implementation**
- Update `co-counsel_final/frontend/Dockerfile.prod` to:
  - `COPY frontend-nginx.conf /etc/nginx/conf.d/default.conf`
- Update `co-counsel_final/backend/Dockerfile` to:
  - Remove the stray leading space before `RUN pip install uv`
  - Add `--no-cache-dir` to `pip install` where appropriate

**Step 4: Run test to verify it passes**
Run: `docker build -f co-counsel_final/frontend/Dockerfile.prod co-counsel_final/frontend`
Expected: PASS (frontend image builds).

**Step 5: Commit**
```bash
git add co-counsel_final/frontend/Dockerfile.prod co-counsel_final/backend/Dockerfile
# git commit -m "fix: repair dockerfiles for prod frontend build"  # Skipped per user request
```

---

### Task 3: Archive superseded compose + update docs and reproducibility log

**Files:**
- Move: legacy infra compose → `archive-co counsel/infra/` (retain filename)
- Modify: `co-counsel_final/docs/QUICKSTART.md`
- Modify: `co-counsel_final/docs/commercial/playbook.md`
- Modify: `co-counsel_final/docs/observability/opentelemetry_workflow.md`
- Modify: `co-counsel_final/docs/provider_multi_provider_plan.md`
- Modify: `co-counsel_final/docs/reviews/2025-11-27_codebase_evaluation.md`
- Modify: `co-counsel_final/docs/roadmaps/2025-11-15_co_counsel_full_scope_task_tree.md`
- Modify: `co-counsel_final/docs/roadmaps/2025-11-18_commercial_enablement_plan.md`
- Modify: `co-counsel_final/docs/roadmaps/2025-11-23_voice_interface_plan.md`
- Modify: `co-counsel_final/docs/runbooks/OPERATIONS.md`
- Modify: `co-counsel_final/docs/validation/nfr_validation_matrix.md`
- Modify: `co-counsel_final/docs/logs/reproducibility.md`

**Step 1: Write the failing test**
Run: `grep -R "archive-co counsel/infra" -n co-counsel_final/docs`
Expected: MATCHES (docs still reference infra compose).

**Step 2: Run test to verify it fails**
Confirm multiple matches exist.

**Step 3: Write minimal implementation**
- Move the old compose file into archive:
  - Create `archive-co counsel/infra/` if missing
  - Move legacy infra compose into `archive-co counsel/infra/`
- Update the docs listed above to reference:
  - `docker compose --profile dev up -d` for development
  - `docker compose --profile prod up -d` for full-featured prod
  - Replace `-f` usage with root compose profiles
  - Note that prod profile includes telemetry + voice services
- Update `co-counsel_final/docs/logs/reproducibility.md` with an entry describing the consolidation and archival move.

**Step 4: Run test to verify it passes**
Run: `grep -R "archive-co counsel/infra" -n co-counsel_final/docs`
Expected: NO MATCHES.

**Step 5: Commit**
```bash
git add co-counsel_final/docs "archive-co counsel/infra"
# git commit -m "docs: align docker instructions with unified compose"  # Skipped per user request
```
