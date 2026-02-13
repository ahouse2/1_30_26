# Task Plan: Gap Closure + Ship-Readiness Workstream

## Goal
Close every remaining gap in the master task list with vertical-slice completion, then harden for ship-readiness.

## Phases
- [x] Phase 1: Plan and setup
- [x] Phase 2: Timeline builder + storyboard + exports
- [x] Phase 3: UI redesign + orchestration polish
- [x] Phase 4: Live checklist + gap triage (authoritative)
- [ ] Phase 5: Vertical-slice completion (per epic)
- [ ] Phase 6: QA + E2E validation + logs

## Key Questions
1. Are all remaining gaps explicitly listed and tracked in the live checklist?
2. Is each epic complete end-to-end before moving to the next?
3. Are logs and reproducibility steps captured for every major change?

## Decisions Made
- Use vertical-slice completion: finish one full feature set before moving to the next.
- Maintain a live checklist view synced with master task list.
- Proceed under presumed assent unless blocked by missing APIs.

## Errors Encountered
- `pytest` failed with `ModuleNotFoundError: No module named 'backend'` when running in `backend/`. Resolved by setting `PYTHONPATH` to repo root.
- `pytest` failed due to missing `importlib` in `backend/tests/conftest.py`. Added missing import.
- Import-time errors from missing API models (`GraphSearchResponse`, `SettingsModelRefreshRequest`, court/automation/storyboard/timeline export models). Added missing models in `backend/app/models/api.py`.
- `backend.app.main` failed to import due to PostgreSQL auto-init; wrapped `Base.metadata.create_all` to warn and continue when DB unavailable.
- Settings endpoints returned 401 due to missing client identity; replaced custom mTLS middleware with `MTLSMiddleware`.
- `vitest --run src/components/__tests__/SettingsPanel.test.tsx` hung; terminated with `pkill -f vitest` (needs follow-up).
- Patch application failed with `diffhunksrenderer.processdiffresult: trailing context mismatch` for `backend/app/main.py` due to UTF-8 BOM; removed BOM to normalize file.
- Patch context mismatch reported for `scripts/README-docker-compose.md`; file is ASCII/LF and already updated, so mismatch likely from stale patch context.
- Patch context mismatch reported for `backend/app/agents/runner.py`; removed stale import and re-applied updates using current file content.
- Patch context mismatch reported for `backend/app/api.py`; file does not exist (API is a package), so future edits must target `backend/app/api/__init__.py` or specific modules.

## Status
**Currently in Phase 5** - swarms parity + automation (legacy drafting/deposition/subpoena/discovery/trial prep teams wired).
