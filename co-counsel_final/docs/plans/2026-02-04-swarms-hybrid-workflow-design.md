# Swarms Hybrid Case Workflow Design

Date: 2026-02-04
Owner: Codex
Status: Draft (validated by user)

## Summary
We will introduce a CaseWorkflowService with a Phase Registry to run an end-to-end automated pipeline after ingestion, while still exposing every phase as a manually re-runnable team. Each phase will execute via a Swarms team profile or tool bundle, produce structured JSON + Markdown outputs, and emit knowledge-graph upserts. The workflow will persist CaseState and PhaseRun records for traceability, deterministic replays, and auditability.

## Goals
- Provide a default automated pipeline from ingestion to drafting.
- Preserve and reintegrate all prior capabilities (forensics, timeline, QA, presentation, etc.) within Swarms architecture.
- Enable manual re-trigger of any phase or subset of phases.
- Persist structured artifacts (JSON + Markdown) per phase for UI and downstream automation.
- Upsert knowledge-graph changes at each phase with full provenance.
- Integrate LlamaIndex for parsing, chunking, indexing, retrieval, and graph enrichment.

## Non-Goals
- Replacing storage engines or UI frameworks.
- Introducing a new external workflow engine.
- Deleting legacy code; legacy is archived under `archive-co counsel/`.

## Architecture Overview
The workflow layer orchestrates phases and state, while phase handlers implement domain logic. The Phase Registry is the single source of truth mapping phase name to Swarms team profile, handler, required inputs, and output schema. CaseWorkflowService drives phase execution, persists PhaseRun records, applies state deltas, and triggers graph upserts.

## Core Components
- CaseWorkflowService: orchestrates phases, applies state updates, persists PhaseRun and artifacts, manages retries and manual runs.
- Phase Registry: declarative registry describing phases, outputs, Swarms profile, and graph upsert behavior.
- Phase Handlers: domain logic for each phase; can invoke Swarms orchestration or direct tools.
- CaseState Store: persistent state snapshots keyed by `case_id` and `state_version`.
- Artifact Store: versioned JSON + Markdown outputs linked to PhaseRun.
- GraphService Upserts: graph payloads emitted from every phase, with provenance metadata.
- LlamaIndex Pipeline: parsing, chunking, indexing, and retrieval integration used by multiple phases.

## Data Model
- CaseState
  - case_id
  - state_version
  - ingestion_summary
  - indexing_summary
  - extracted_entities
  - extracted_events
  - legal_theories
  - strategy_recommendations
  - artifacts_index
- PhaseRun
  - run_id
  - case_id
  - phase
  - inputs_ref
  - outputs_ref
  - state_version_before
  - state_version_after
  - swarms_profile
  - model_config
  - citations
  - status
- PhaseArtifact
  - artifact_id
  - run_id
  - format (json|md)
  - content_ref
  - created_at

## Phase Registry (Default Pipeline)
- ingestion
- preprocess
- forensics
- parsing_chunking
- indexing
- fact_extraction
- timeline
- legal_theories
- strategy
- drafting
- qa_review

Each phase outputs JSON + Markdown and a GraphUpsertPayload.

## Knowledge Graph Integration
Each phase emits a GraphUpsertPayload. Examples:
- ingestion: document nodes, provenance edges
- fact_extraction: entities, claims, event nodes, citations
- timeline: event order edges, temporal metadata
- legal_theories: hypothesis nodes linked to evidence
- drafting: draft nodes linked to supporting evidence

GraphService will upsert after each phase and persist graph snapshot refs for diffing and rollback.

## LlamaIndex Integration
- parsing_chunking phase uses LlamaIndex readers and chunking strategies
- indexing phase persists LlamaIndex indices and syncs nodes into the property graph
- retrieval phase (within fact_extraction, legal_theories, drafting) blends vector + graph + LlamaIndex node retrieval

## API Surface
- POST /api/workflow/run
  - Run full pipeline for a case
- POST /api/workflow/phase
  - Run specific phase or subset of phases
- GET /api/workflow/status
  - Retrieve phase status, artifacts, and graph snapshot refs

## Manual Re-Trigger
Every phase is exposed as a callable unit. The UI will allow re-run of any phase, with optional parameters to override model configuration or supply additional evidence.

## Error Handling
- Phase-level retries with capped attempts
- Partial failure handling with resumable state
- If graph upsert fails, phase run is marked partial and queued for retry
- Artifact persistence is atomic per phase

## Testing Strategy
- Unit tests for Phase Registry validation and handler wiring
- Integration tests for end-to-end pipeline execution with stubbed LLMs
- Graph upsert tests with fixture payloads and snapshot validation
- Retrieval tests covering LlamaIndex + graph + vector fusion

## Capability Reintegration Plan
- Map archived tools and teams in `archive-co counsel/` to phases or tools within phases.
- Rebuild missing tools as first-class handlers rather than ad-hoc scripts.
- Ensure parity with prior features: forensics suite, timeline builder, presentation builder, QA oversight, drafting, and research.

## Open Questions
- Final storage location for artifacts (DB vs object storage) and retention policy.
- Default model/provider choices per phase for cost vs accuracy.
- UI: how to expose confidence scores and citations per phase.
