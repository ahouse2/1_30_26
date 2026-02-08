# Swarms + LlamaIndex Migration Plan (Co-Counsel)

## Objective
Deliver a production-grade legal discovery platform with Swarms as the orchestration layer and LlamaIndex powering the full document pipeline (ingest → preprocess → parse → split → chunk → embed → graph → retrieve). Replace Microsoft Agents workflow logic and remove all placeholder behavior in the backend and UI.

## Scope
- **Agent orchestration**: Swarms-based routing, execution, synthesis, and QA workflows.
- **Ingestion pipeline**: Full LlamaIndex pipeline coverage for all supported formats and models.
- **Graph + retrieval**: Neo4j property graph + hybrid retrieval (vector + graph + rerank).
- **Frontend**: Mature, professional UI refresh that matches legal domain expectations.
- **Packaging**: Local-first dev workflow; ship-ready build targets for `.exe` and `.dmg`.

## Non-Goals
- No new product lines or integrations outside the legal discovery scope.
- No default reliance on third-party hosted tools for core pipeline functions.

## Architecture Summary
- **Swarms** orchestrates workflow selection and execution using a routing agent and domain-specific agent teams.
- **LlamaIndex** handles ingestion, parsing, chunking, embeddings, vector storage, and property graph builds.
- **Neo4j** stores entity graphs and workflow metadata for evidence traceability.
- **Retrieval** merges vector similarity, graph traversal, and cross-encoder reranking.
- **UI** surfaces evidence lineage, case timelines, and agent outputs with auditable citation links.

## Workstreams & Deliverables

### 1) Swarms Orchestration Layer
**Deliverables**
- Replace Microsoft Agents workflow graph with Swarms routing + agent teams.
- Provide deterministic routing rules with an audit log of tool selection.
- Standardize tool interface contracts for strategy, ingestion, forensics, research, QA, and synthesis.

**Acceptance Criteria**
- All existing agent workflows execute through Swarms.
- Each run emits tool routing metadata and a final synthesis response.
- Error handling uses structured workflow errors; no silent fallbacks.

### 2) LlamaIndex End-to-End Pipeline
**Deliverables**
- Ingestion supports text, PDF, image OCR, email, and archive bundles.
- Preprocessing includes normalization, redaction markers, and metadata enrichment.
- Chunking uses deterministic split rules per document type and configurable overlap.
- Embeddings and vector persistence are configurable (qdrant/chroma/memory).
- Property graph extraction builds entity nodes with provenance metadata.

**Acceptance Criteria**
- Every ingested document yields vector embeddings and graph nodes or explicit error reports.
- Graph and vector retrieval produce traceable citations for each answer.
- Pipeline emits metrics for chunk counts, embedding latency, and graph write volume.

### 3) Retrieval + Reasoning Stack
**Deliverables**
- Hybrid retriever with graph hops + vector + rerank.
- Evidence packets that include citations, provenance, and retrieval rationale.
- Deterministic QA rubric enforcement at the end of each run.

**Acceptance Criteria**
- Retrieval output includes citations with document IDs and chunk offsets.
- QA rubric scores are stored per run and surfaced in the UI.

### 4) Frontend Rebuild (Legal-Grade UI)
**Deliverables**
- New navigation: Cases, Evidence, Timeline, Research, Forensics, Drafting.
- Executive summary view with structured evidence blocks and audit trail.
- Case workspace layout with split view for evidence + agent output.

**Acceptance Criteria**
- UI renders all core workflows with professional typography, spacing, and layout.
- Evidence entries can be traced to the originating doc/chunk.

### 5) Packaging + Local Dev
**Deliverables**
- Local dev mode: hot reload for backend and frontend without Docker.
- Packaging plan: `.exe` and `.dmg` deliverables for production release.
- Build artifacts and versioning conventions documented for release.

**Acceptance Criteria**
- One-command local setup for full stack development.
- Release checklist for packaging and signing documented.

## Data & Security
- Enforce role-based access, audit logs, and retention policy for sensitive documents.
- Maintain explicit chain-of-custody metadata from ingest through output.

## Milestone Sequencing (Execution Order)
1. Swarms orchestration integration (core agent flow replacement).
2. LlamaIndex pipeline completion + validation metrics.
3. Retrieval + QA enforcement.
4. UI refresh and evidence-first workflows.
5. Packaging tooling and release prep.

## Definition of Done
- All core workflows execute via Swarms.
- LlamaIndex pipeline covers ingestion through retrieval with zero placeholder logic.
- UI is production-ready with evidence traceability and QA summaries.
- Packaging plan is documented and executable for `.exe`/`.dmg` outputs.
