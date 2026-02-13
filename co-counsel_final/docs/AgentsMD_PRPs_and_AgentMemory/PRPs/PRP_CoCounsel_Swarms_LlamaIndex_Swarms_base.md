name: "Co-Counsel Legal Discovery — PRP Base (Swarms)"
version: 2.0
owners:
  - "Product/Eng: andrew house"
status: draft

> **PRP Navigation:** [Base](PRP_CoCounsel_Swarms_LlamaIndex_Swarms_base.md) · [Planning](PRP_CoCounsel_Swarms_LlamaIndex_Swarms_planning.md) · [Spec](PRP_CoCounsel_Swarms_LlamaIndex_Swarms_spec.md) · [Tasks](PRP_CoCounsel_Swarms_LlamaIndex_Swarms_tasks.md) · [Pre-PRP Plan](PRE_PRP_PLAN.md) · [ACE Execution Guide](EXECUTION_GUIDE_ACE.md) · [Task List Master](TASK_LIST_MASTER.md) · [PRP Templates](templates/README.md)

## Goal / Why / What
- Goal: Ship a Swarms-first legal co-counsel that ingests evidence, builds vector + graph indexes, and runs an automated pipeline from extraction through draft outputs with citations.
- Why: Legal teams need explainable, reproducible, and comprehensive case intelligence that scales across large evidence corpora.
- What: Backend ingestion + retrieval + graph services; Swarms orchestration for core phases; interactive UI for manual re-triggers; timeline, forensics, and presentation tooling.

## Scope
- In-scope: LlamaIndex ingestion (OCR/vision, chunking, embeddings), hybrid retrieval, graph upserts + refinement worker, Swarms workflow phases (ingestion, facts, legal theory, strategy, drafting, QA, forensics), timeline builder with citations and exports, evidence binder and presentation assistant, basic voice interface scaffolding.
- Out-of-scope (this slice): paid court document retrieval automation, full mock-trial arena polish, enterprise SSO and billing.

## Context
- Reference code:
  - LlamaHub connectors: `Reference Code/llama-hub`
  - Swarms library: `swarms-master/`
- Prior PRPs/Docs: see `AgentsMD_PRPs_and_AgentMemory/PRPs/ai_docs/`
- Tech:
  - Python 3.11+, Neo4j 5.x, Qdrant/Chroma, React 18
  - Whisper (STT), Coqui (TTS) optional containers
  - LLM Provider: default Google Gemini‑2.5‑Flash; optional OpenAI GPT‑5.0; provider abstraction layer

## Implementation Blueprint
1) Data layer
   - Vector store driver (Qdrant/Chroma) via LlamaIndex Settings
   - Graph store driver (Neo4j) + idempotent upsert utils
2) Ingestion
   - LlamaHub loaders registry; chunking; embeddings; metadata; persistence
3) GraphRAG
   - Triples extraction + ontology mapping; continuous refinement worker
4) Retrieval
   - Hybrid retriever fusing vector + graph neighborhood
5) Swarms Orchestration
   - Phase registry: Ingestion, Facts, Legal Theory, Strategy, Drafting, QA, Forensics
   - Manual re-trigger per phase and per team
6) API
   - POST /ingest, GET /query?q=, POST /workflow/run, GET /timeline, GET /graph/neighbor?id=
7) UI
   - Chat + citations; timeline builder; workflow control center; evidence binder views

## Validation Gates
- Unit tests: loaders, embeddings adapter, graph upserts, hybrid retriever
- Integration: sample corpus ingest; query answers include citations + paths
- E2E: scripted journey covering ingest->workflow->timeline->draft

## Risks & Mitigations
- Hallucinations: enforce cite-or-silence, retrieval traces, QA prompts
- Extract accuracy: low-confidence review queue; user corrections
- Cost/perf: on-prem embeddings; batch jobs; incremental updates

## Deliverables
- Running compose stack with API + stores + UI
- PRD/Spec/Tasks docs; ONBOARDING.md and QUICKSTART.md
