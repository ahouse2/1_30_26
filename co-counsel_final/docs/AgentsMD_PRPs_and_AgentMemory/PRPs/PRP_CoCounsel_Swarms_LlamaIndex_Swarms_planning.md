name: "Planning — Co-Counsel (Swarms + LlamaIndex)"
description: |
  Generate a concrete PRD/plan for the legal co-counsel using local-first vector+graph RAG, Swarms orchestration, and LlamaIndex ingestion.

> **PRP Navigation:** [Base](PRP_CoCounsel_Swarms_LlamaIndex_Swarms_base.md) · [Planning](PRP_CoCounsel_Swarms_LlamaIndex_Swarms_planning.md) · [Spec](PRP_CoCounsel_Swarms_LlamaIndex_Swarms_spec.md) · [Tasks](PRP_CoCounsel_Swarms_LlamaIndex_Swarms_tasks.md) · [Pre-PRP Plan](PRE_PRP_PLAN.md) · [ACE Execution Guide](EXECUTION_GUIDE_ACE.md) · [Task List Master](TASK_LIST_MASTER.md) · [PRP Templates](templates/README.md)

## Initial Concept
Build an enterprise-ready legal discovery assistant that ingests a corpus, builds vector + graph indexes, runs an automated Swarms pipeline, and provides an interactive UI for retriggering phases.

## Research Focus (internal-only)
- libraries: LlamaIndex core; Neo4j driver; Qdrant/Chroma; image/PDF/email forensics libs (EXIF, PDF parsers, ELA/PRNU methods)
- patterns: GraphRAG; hybrid retrieval; Swarms orchestration; observability (OTel)
- constraints: local-first viable; minimal external dependencies; Docker-based; provider abstraction for LLMs

## Executive Summary
Problem: Legal teams need explainable, auditable answers grounded in their evidence.
Solution: Swarms-orchestrated GraphRAG using LlamaIndex ingestion and continuous knowledge-graph refinement.
Success Metrics: (a) >=90% answers include citations; (b) timeline events link to sources; (c) reproducible ingest runs with telemetry.

## User Flow (primary)
```mermaid
flowchart LR
  U[User] -->|upload/links| ING[Ingestion]
  ING --> V[Vector Index]
  ING --> G[Graph Builder]
  G --> KG[(Neo4j)]
  U -->|ask| R[Retrieval]
  R --> V
  R --> KG
  R -->|answer+citations| U
  U -->|workflow| W[Swarms Pipeline]
  W -->|artifacts| U
  U -->|timeline| T[Timeline]
  T --> KG
```

## High-Level Architecture
```mermaid
graph TB
  subgraph Frontend
    UI(Chat/Timeline/WarRoom)
  end
  subgraph Backend(API)
    W[Swarms Orchestration]
    S[Stores: Vector, Graph]
  end
  UI --> W
  W --> S
```

## Technical Specs (MVP)
- API
  - POST /ingest {sources: [...]}
  - POST /workflow/run
  - GET /query?q=...
  - GET /timeline
  - GET /graph/neighbor?id=...
  - GET /forensics/document?id=...
  - GET /forensics/image?id=...
  - GET /forensics/financial?id=...
- Data
  - Vector: Qdrant/Chroma directory
  - Graph: Neo4j 5.x; constraints on ids
  - Forensics: artifact outputs per file (hash.json, metadata.json, structure.json, authenticity.json, financial.json)

## Implementation Phases
1. Foundation: settings, stores, API, compose
2. Ingestion: folder upload, OCR + Vision, chunk/embeddings, persist
3. GraphRAG: triples extraction, Cypher upserts, ontology
4. Forensics Core: hashing/metadata/structure/image authenticity; financial baseline
5. Retrieval: hybrid retriever, citations, traces
6. Workflow: Swarms phase registry + artifacts + manual retriggers
7. UI: chat stream, citations, timeline, war-room control
8. QA: gates, scripts, metrics

## Validation & Challenges
- Devise adversarial questions; require cite-or-silence
- Track retrieval contexts in traces; assert non-empty citations
