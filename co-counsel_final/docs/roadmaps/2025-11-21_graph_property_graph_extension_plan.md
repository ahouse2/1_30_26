# Graph Property Graph & Retrieval Trace Expansion Plan

## Vision
- Deliver seamless property graph integration between ingestion, retrieval, and agent tooling.
  - Harmonise LlamaIndex KnowledgeGraphIndex usage across memory + Neo4j runtimes.
  - Ensure ingestion completion triggers community analytics + timeline enrichments reliably.
  - Expand retrieval traces with subgraph payloads consumable by UI + agents.
  - Provide Cypher/text-to-Cypher workflows for exploratory analysis.
  - Codify schema, ontology, and update procedures for future operators.

## Phase 1 — Graph substrate alignment
- Audit `backend/app/services/graph.py` for property graph and knowledge index coverage.
  - Identify gaps between fallback store and LlamaIndex integration for both memory + Neo4j.
  - Enumerate node/edge cache behaviours and Neo4j session lifecycle expectations.
- Design adapter strategy for `KnowledgeGraphIndex` initialisation + node synchronisation.
  - Determine when to invoke `ensure_knowledge_index` (lazy vs eager) to balance cost + freshness.
  - Define translation utilities from `GraphNode`/`GraphEdge` -> LlamaIndex node constructs.

## Phase 2 — Ingestion completion analytics
- Trace ingestion pipeline end-of-run hooks.
  - Verify timeline enrichment, community detection, and audit instrumentation.
  - Define mutation payloads needed to trigger knowledge index refresh.
- Specify enrichment metrics for status payloads.
  - Document event/highlight counts, relation merges, triple totals.

## Phase 3 — Retrieval trace surfacing
- Map retrieval trace schema to UI contract.
  - Ensure subgraph payload includes nodes/edges/events/communities keyed predictably.
  - Decide pagination/filter boundaries for privilege trace alignment with doc scope.
- Outline tests that assert graph payload inclusion in traces.
  - Extend `backend/tests/test_retrieval.py` coverage for nodes/relations/events.

## Phase 4 — Agent tooling & Cypher exploration
- Catalogue agent toolkit commands to expose graph exploration helpers.
  - Confirm `run_cypher`, schema description, and community overview functions.
  - Document text-to-Cypher template usage + custom prompt shaping.

## Phase 5 — Documentation updates
- Prepare schema + ontology narrative for `docs/roadmaps/`.
  - Detail node classes, relation types, enrichment lifecycle, and update procedures.
- Update PRPs with integration guidance + operational steps.

## Quality Gates
- ✅ Pytest suites: `backend/tests/test_graph_service.py`, `backend/tests/test_retrieval.py`.
- ✅ Static analysis spans (linters/mypy) as available.
- ✅ Update Chain of Stewardship log + build log artefact.
