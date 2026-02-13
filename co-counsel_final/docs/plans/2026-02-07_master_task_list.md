# Master Task List — Co-Counsel (2026-02-07)
**Timezone:** Pacific Standard Time (PST)

## Purpose
Provide a single, authoritative checklist for shipping a full-featured, UI-driven Co-Counsel product with Swarms-based orchestration, comprehensive legal workflows, and production-grade infrastructure.

## Guiding Principles
- Full parity with prior app functionality, then expand.
- UI-first experience: every capability is discoverable, guided, and auditable in the web app.
- Swarms orchestration drives automation; user can manually re-run any stage.
- Evidence traceability is mandatory (citations, provenance, chain-of-custody).

## Current Status Snapshot (High Level)
- Swarms orchestration swap complete.
- 3D graph explorer UI + graph API implemented.
- Timeline exports + storyboard implemented.
- Forensics crypto tracing upgrades implemented.
- Court integration foundations + automation phase implemented.
- Evidence binder baseline implemented.
- Provider settings + model refresh + streaming endpoints implemented.
- Docker dev/prod profiles unified.
- UI redesign extended across timeline, forensics, evidence viewer, legal dashboard, and graph surfaces.

## Epics and Tasks

### 1) Swarms Orchestration and Team Parity
- [x] Replace MS Agents with Swarms orchestrator and tool adapters.
- [x] Swarms routing plan + QA phase integration.
- [x] Full parity with legacy team behaviors (see Parity Matrix below).
- [ ] Add background graph-refinement swarm with stopping criteria.
- [ ] Add autonomous policy tuning for long-running cases (trust policy tuning UI + controls).
- [x] Add scheduled automation triggers (ingest → run → draft sequence).

### 2) Ingestion, LlamaIndex, and Retrieval
- [x] LlamaIndex ingestion integration (chunking, embedding, parsing).
- [x] Folder upload + relative path reconstruction.
- [ ] Enhance ingestion UI (source type selection, progress, failure recovery).
- [ ] Expand LlamaHub connectors (OCR, email, cloud drives) and expose in UI.
- [ ] Add ingestion validation report (coverage, skipped files, OCR status).

### 3) Knowledge Graph and RAG
- [x] Graph explorer UI + graph API.
- [x] Graph refinement worker status endpoints.
- [ ] Fact extraction pipeline (claims, events, entities) with citations + confidence.
- [ ] Background swarm for graph schema refinement, clustering, and new edges.
- [x] Case-specific graph snapshots and diffing.
- [x] Graph query builder UI with evidence citations. (Cypher + result summary; citations wiring pending)

### 4) Forensics Suite (Core + Crypto)
- [x] Crypto tracing upgrades (cross-chain hints, clustering, bridge matching).
- [x] Forensics report API and UI integration.
- [ ] Rebuild or fully wire: PDF authenticity, image authenticity, metadata forensics UI panels.
- [ ] Expand custody attribution workflows (Coinbase/Coinbase Pro, etc.).
- [ ] Add forensic report version history, export, and audit trails.

### 5) Timeline Builder (Critical)
- [x] Timeline exports (MD/HTML/PDF/XLSX) + storyboard endpoint.
- [x] Interactive timeline builder UI with citations and document inspector.
- [ ] Filters by topic/subject and evidence source.
- [x] Storyboard mode (visual timeline narrative) UI.
- [ ] Export storyboard to web page.
- [ ] Video/image generation hooks for exhibits and visual aids.

### 6) Presentation + Exhibit Binder
- [x] Evidence binder baseline.
- [x] Full exhibit presentation builder UI (drag/drop, playback, exhibits).
- [x] In-court mode (presentation controls, binder live view).
- [ ] Export to PDF/XLSX/HTML with citations. (HTML/MD/PDF/CSV UI export done; XLSX pending)

### 7) Legal Research + Theory + Strategy
- [x] Legal theory service + automated phase.
- [x] CourtListener + Case.law connectors.
- [x] Legal research UI (case law results, citation chains, summary panels).
- [x] Legal theory builder UI (framework explorer + citations).
- [ ] Trial strategy + legal strategist swarms with argument mapping UI. (Strategy panel live; argument mapping UI pending)

### 8) Court Integrations (PACER / UniCourt / LACS)
- [x] Connector stubs + credential settings + payment ledger.
- [ ] LACS scraping agent for calendar + docket ingestion.
- [ ] PACER/UniCourt payment workflow integration (secure payment queue).
- [ ] UI for court sync status, cases, deadlines, and filings.

### 9) Product-Grade UI/UX (Stunning & Operable)
- [x] Core app navigation foundation.
- [x] Full UI redesign with cohesive visual identity.
- [ ] “CENTCOM” war room orchestration view (expanded + interactive).
- [ ] 3D graph explorer polish + cinematic visualization.
- [x] Trial University module + interactive onboarding.
- [x] Voice-enabled assistant UI.

### 10) Subscription, Billing, and Access
- [ ] Auth and subscription tiers.
- [ ] Seat management + org permissions.
- [ ] Billing portal integration (Stripe or equivalent).
- [ ] Usage metering + cost telemetry UI.

### 11) DevOps and Reliability
- [x] Dev/prod compose profiles.
- [x] Docker image hardening and multi-arch build pipeline.
- [x] CI pipelines for backend, frontend, and e2e.
- [x] Observability dashboards and alerting.

### 12) Documentation and Sales Readiness
- [x] Swarms-first PRP migration.
- [x] Reproducibility log.
- [x] End-user docs per module.
- [ ] Sales demo scripts + sample data packs.

### 13) Legacy Tools/Crews Migration (Archive)
- [x] Inventory `toolsnteams_previous` definitions and map to Swarms teams/tools. (See `docs/plans/2026-02-10_toolsnteams_inventory.md`)
- [ ] Rebuild case management + discovery + deposition prep workflows.
- [x] Rebuild subpoenas + trial preparation swarms and UI.
- [ ] Rebuild drafting tooling (auto_drafter, document_drafter, templates).
- [ ] Rebuild privilege detection + bates numbering pipeline.
- [ ] Rebuild narrative discrepancy + sanctions risk analysis.
- [ ] Rebuild case management/task tracker UI panels.

## Swarm/Team Parity Matrix (Old vs New)
| Team / Swarm | Current Status | Notes |
| --- | --- | --- |
| Document Ingestion Crew | Partial | LlamaIndex ingest wired, UI needs full source selection + reporting.
| Forensic Analysis Crew | Partial | Crypto tracing expanded; PDF/image forensic UI pending.
| Legal Research Crew | Partial | CourtListener + Case.law wired; UI and deeper workflows pending.
| Litigation Support Crew | Partial | Legal theory service exists; trial strategy + argument mapping UI pending.
| Presentation/Exhibit Crew | Partial | Evidence binder exists; presentation builder UI pending.
| Timeline Crew | Implemented | Exports + storyboard + interactive UI delivered; filters + web export pending.
| QA Oversight Crew | Partial | QA phase exists; governance UI and reports pending.
| Dev Team Crew | Partial | Dev agent scaffolding exists; operational UI pending.
| Voice Assistant Crew | Pending | Infra present; UI and pipeline integration pending.
| CENTCOM War Room | Partial | Core view exists; needs deeper workflow linkage and telemetry polish.

## Immediate Next Moves
1. Complete UI-driven timeline builder (critical).
2. Expand swarm parity: forensics + legal research + trial strategy UI.
3. Product-grade UI redesign and orchestration UX polish.
4. Payment/billing tier integration for subscription launch.
