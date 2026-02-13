# Swarms Session Orchestrator — Flow Update

> Note: Filename is legacy for continuity; content is Swarms-first.

This addendum captures the Swarms session orchestration used for the Co-Counsel pipeline. Phases are routed by intent and case stage, with explicit phase boundaries and audit artifacts.

## Phase Boundaries
- Each phase writes JSON + Markdown artifacts.
- Artifacts are linked to a workflow run ID.
- Graph upserts occur at the end of each phase.

## QA and Guardrails
- QA phase validates citations, artifact counts, and graph edges.
- Failures generate re-run recommendations for the originating phase.
