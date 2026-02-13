# UI Polish Pass — Presentation, Timeline, Research, Graph (2026-02-10)

## Overview
This pass tightens four mission‑critical panels to reach "courtroom‑ready" fidelity: In‑Court Presentation, Timeline Builder filters, Research/Strategy outputs, and 3D Graph Explorer. The goal is to turn each into a control‑tower experience with actionable status, clear hierarchy, and citation‑forward outputs. Scope intentionally avoids new backend workflows beyond filter wiring and query parameters.

## In‑Court Presentation Studio
We introduce a HUD row that surfaces session clock, active case, next exhibit, and courtroom mode status. This creates a cockpit feel and reduces cognitive load during live presentation. The stage section becomes a two‑column layout: exhibit preview + a presenter side stack with notes and a courtroom checklist. Controls are reorganized to emphasize mode switching and display sync. Presenter notes are designed to be persisted later; for now they are local but visually aligned with the halo/glass system.

## Timeline Filters and Query Flow
Filters expand to include topic/subject and evidence source, and are wired end‑to‑end (frontend, API parameters, backend filters). The UI uses labeled, mono‑style filter chips to match the visual system. Backend filtering uses lightweight token matching across event titles, summaries, entity highlights, relation tags, and citations. These filters flow into export and storyboard generation to keep narrative output in sync.

## Research/Strategy Output Refinement
The output blocks are restructured into signal stacks, formatted citation cards, and an argument map (position/counter/evidence). This reduces raw JSON display and makes outputs directly usable for trial prep. The argument map is static scaffolding for now, but it presents the intended UX for later live swarm integration.

## Graph Explorer Cinematic Pass
Graph Explorer receives a cinematic atmosphere layer, status metrics, and evidence links from graph queries. Evidence links open the existing evidence viewer modal so users can validate relationships immediately. This bridges the graph query system with evidence provenance and prepares the panel for later real‑time query results.
