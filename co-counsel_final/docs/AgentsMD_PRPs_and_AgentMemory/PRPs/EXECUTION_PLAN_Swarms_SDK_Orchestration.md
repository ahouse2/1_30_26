# Execution Plan — Swarms Orchestration Refresh

> Note: Filename is legacy for continuity; content is Swarms-first.

## Objective
Replace all legacy orchestration references with Swarms-based workflows and document the current Swarms runtime.

## Scope
- Swarms phase registry for ingestion, facts, legal theory, strategy, drafting, QA, forensics.
- Manual re-trigger UI and API.
- Artifact persistence with JSON + Markdown outputs per phase.

## Steps
1. Confirm phase registry and mappings in backend services.
2. Validate workflow API and storage paths.
3. Ensure graph upserts happen per phase.
4. Update documentation and runbooks.

## Validation
- Execute `POST /workflow/run` on a sample case.
- Confirm artifacts in workflow storage.
- Verify QA phase includes citation counts and flags.
