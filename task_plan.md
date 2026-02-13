# Task Plan: PRP Migration + Project Audit + Stabilization

## Goal
Migrate legacy MS Agents PRP docs to Swarms-first versions, archive originals, then audit the current project state and close critical gaps in functionality.

## Phases
- [x] Phase 1: Plan and scope
- [x] Phase 2: Migrate PRP docs + archive legacy
- [x] Phase 3: Audit current system coverage and gaps
- [ ] Phase 4: Remediation plan and execution

## Key Questions
1. Should new Swarms PRP docs reuse the same filenames/paths, or use new naming while the originals are archived?
2. What is the expected depth of the post-migration audit (doc-only, code + runtime behavior, or full functional matrix)?

## Decisions Made
- Archive legacy MS Agents PRP docs under `archive-co counsel/`.
- Use the same filenames/paths for Swarms replacements (approach 1).
- Remediation backlog created in `docs/plans/2026-02-06_swarms_remediation_backlog.md`.

## Errors Encountered
- `rg` not available in environment; used `grep -R` instead.
- `pytest` not available in environment (`python -m pytest` failed: No module named pytest).

## Status
**Currently in Phase 4** - CENTCOM War Room implemented; next up: Docker Compose + frontend packaging, then 3D graph explorer.
