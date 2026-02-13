# Trial Prep Panels Design (2026-02-10)

## Overview
The Trial Prep Panels consolidate high-impact pre‑trial workflows into a cinematic command surface that maps directly to Swarms teams: deposition prep, subpoenas, discovery production, and trial strategy. The page provides a shared case context bar (case id, autonomy level, top‑k, max turns) and four actionable panels that each accept prompts and emit structured swarm outputs. The layout follows the existing cinematic design system, adds a “halo” glow layer to reinforce focus, and uses panel‑level actions to prevent cross‑panel coupling. Each panel has its own state, output region, QA notes, and telemetry badges so users can see which swarm produced what, and can re‑run any panel without disrupting the rest of the workspace.

## Architecture & Data Flow
Panels call the unified `/agents/run` endpoint (AgentsService‑backed) to ensure consistent policy, telemetry, and error handling. Each panel builds a question using its keyword (e.g., “deposition: …”) so the Swarms orchestrator routes to the correct team graph. Results are returned as `AgentRunResponse` with `final_answer`, `qa_notes`, and telemetry (turn count, status). The UI displays the response as a briefing text block plus QA notes and status chips. The shared context controls (autonomy, top‑k, max turns) are passed to each run. This keeps the orchestration logic in the backend and the UI focused on interaction and visualization.

## Error Handling & UX
Each panel has independent loading and error states to avoid a global “locked” experience. Errors are rendered in-panel with actionable messaging; no silent failures. Inputs use consistent cinematic styling, and the halo layer is purely visual (pointer‑events disabled) to avoid interfering with input. The design prioritizes immediate “run” affordances, but retains room for future features (citations, export actions, evidence chips) without restructuring the layout.

## Testing & QA
Manual UI tests should confirm that each panel triggers the correct backend team (via keyword routing), handles success and failure responses, and retains previous output after other panels run. Basic smoke tests: start each swarm with a short prompt, confirm answer block renders, and verify that telemetry fields update. End‑to‑end coverage can be extended later with mocked API responses.
