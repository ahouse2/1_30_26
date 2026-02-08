# Roadmap — Swarms-First Milestones

The authoritative roadmap is now maintained in:
- `docs/roadmaps/2026-02-06_swarms_roadmap_milestones.md`

Short summary:
- Milestone 0: Swarms orchestration baseline with LlamaIndex ingestion and graph refinement.
- Milestone 1: Timeline builder + evidence binder + drafting outputs.
- Milestone 2: Forensics and crypto tracing hardening.
- Milestone 3: Visualization and interactive UI experiences.
- Milestone 4: Court integrations and paid document retrieval (foundation in progress: connectors, payment ledger, API wiring, case law sync automation).
- Milestone 5: Training and education modules.
- Milestone 6: QA and Dev Swarms for ongoing autonomy and quality.
 
Legacy phase breakdown (superseded):
Phase 1 — Data Foundations
- Neo4j constraints; vector store wiring; readiness/health endpoints

Phase 2 — Ingestion MVP
- LlamaHub loaders (local + one cloud); OCR required; Vision‑LLM agent for classification/tagging/scanned docs; chunk + embed; persist

Phase 3 — Context Engine
- Triples extraction → Neo4j; hybrid retriever; ContextPacket JSON

Phase 4 — Forensics Core (Non‑Negotiable)
- Hashing (SHA‑256), metadata extraction, PDF structure checks, email header analysis
- Image authenticity pipeline (EXIF, ELA, PRNU/clone detection where feasible)
- Financial forensics (basic): totals consistency, anomaly flags, entity extraction; produce forensics summary artifacts

Phase 5 — Swarms Orchestration
- Swarms routing + agent teams; deterministic tool plans; QA rubric enforcement

Phase 6 — Timeline
- Event graph + API; UI timeline with cited pop‑outs

Phase 7 — Legal Research & Extended Forensics
- CourtListener/web search integrations; privilege detector; chain‑of‑custody exports

Phase 8–9 — API + Frontend
- /ingest, /query, /timeline, /graph/neighbor; legal-grade UI refresh with evidence traceability

Phase 10 — Testing/Hardening
- Unit/integration/e2e/load; security posture; orphan scan CI

Phase 11 — Packaging
- Installers/containers/binaries as needed
- Tiered Docker Compose profiles + `scripts/install_tier.sh` for Community/Professional/Enterprise deployments with OTLP & Grafana bundles
- Billing telemetry surface (`/billing/*`), onboarding flow, and commercial collateral tracked under `docs/commercial/`
