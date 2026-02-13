# Co-Counsel Swarms Spec

> **PRP Navigation:** [Base](PRP_CoCounsel_Swarms_LlamaIndex_Swarms_base.md) · [Planning](PRP_CoCounsel_Swarms_LlamaIndex_Swarms_planning.md) · [Spec](PRP_CoCounsel_Swarms_LlamaIndex_Swarms_spec.md) · [Tasks](PRP_CoCounsel_Swarms_LlamaIndex_Swarms_tasks.md) · [Pre-PRP Plan](PRE_PRP_PLAN.md) · [ACE Execution Guide](EXECUTION_GUIDE_ACE.md) · [Task List Master](TASK_LIST_MASTER.md) · [PRP Templates](templates/README.md)

## Purpose
Define the Swarms-first architecture, workflows, and API surface for the Co-Counsel legal discovery system.

## System Goals
- Automated case pipeline from ingestion to drafted outputs.
- Manual re-trigger for any phase or subset of tools.
- Citations and provenance for every artifact.
- Hybrid vector + graph retrieval with ongoing refinement.

## Architecture
### Components
1. Ingestion Service
- LlamaIndex loaders, OCR, vision classification, chunking, embeddings.
- Outputs: Llama nodes, normalized metadata, ingestion job record.

2. Vector + Graph Stores
- Vector: Qdrant (default), Chroma fallback.
- Graph: Neo4j (entities, relationships, timeline events, wallet flows).

3. Swarms Orchestration
- Phase registry maps workflow steps to Swarms profiles.
- Supervisor Swarm coordinates phase execution.
- QA Swarm validates outputs and citations.

4. Retrieval Service
- Hybrid vector + graph retrieval.
- Re-ranking and citation bundle formatting.

5. Timeline Engine
- Event extraction from evidence + graph.
- UI-driven filters, citations, and export formats.

6. Forensics and Crypto
- Document authenticity, metadata, hashing.
- Crypto wallet extraction and on-chain analysis.

7. Drafting + Presentation
- Draft outputs for motions/briefs.
- Exhibit binder builder and presentation assets.

## Workflow Phases
- Ingestion
- Fact extraction
- Legal theory
- Strategy
- Drafting
- QA review
- Forensics

Each phase produces:
- JSON artifact
- Markdown artifact
- Graph upsert payload
- Optional llama_nodes sync

## Data Model (high level)
- Document(id, source, metadata)
- Entity(id, type, name, confidence)
- Relation(id, source, target, type, confidence)
- Event(id, date, description, sources)
- Timeline(id, case_id, events[])
- Draft(id, type, content, sources)
- ForensicsArtifact(id, type, report)
- Wallet(address, blockchain)
- Transaction(id, from, to, amount, currency)

## API Surface (MVP)
- POST /ingest
- POST /workflow/run
- GET /workflow/status/{case_id}
- GET /query
- GET /timeline
- GET /graph/neighbor
- GET /forensics/document/{document_id}
- GET /forensics/image/{image_id}
- GET /forensics/financial/{transaction_id}

## UI Features (MVP)
- Workflow control panel (auto-run + manual retrigger)
- Timeline builder with citations and export
- Case query and citations inspector
- Forensics artifact viewer

## Non-Functional Requirements
- Deterministic phase outputs and artifact versioning.
- Observability for ingestion/workflow phases.
- Secure handling of evidence and chain-of-custody metadata.

## Open Gaps (to close)
- Advanced forensic analysis implementations (ELA, clone/splicing, font/object).
- Paid court document retrieval integrations (LACS, PACER, UniCourt).
- 3D graph explorer, war-room orchestration view, mock trial arena.
