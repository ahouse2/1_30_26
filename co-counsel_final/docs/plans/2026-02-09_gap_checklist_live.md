# Live Gap Checklist — Co-Counsel (2026-02-09, PST)

**Purpose:** Single live view of remaining gaps. Each epic will be completed end-to-end before moving to the next. Completed items are marked `[x]` and will not be revisited unless regressions appear.

## Global Status
- Overall: **In Progress**
- Current Focus (Vertical Slice): **Swarms parity + automation**

---

## 1) Swarms Orchestration and Team Parity
**Definition of done:** Legacy parity achieved, automation complete, graph refinement swarm running with stop criteria, scheduled triggers active, policy tuning UI present.

- [x] Replace MS Agents with Swarms orchestrator and tool adapters.
- [x] Swarms routing plan + QA phase integration.
- [x] Full parity with legacy team behaviors (see Parity Matrix).
- [x] Background graph-refinement swarm with stopping criteria.
- [x] Autonomous policy tuning for long-running cases (trust policy tuning UI + controls).
- [x] Scheduled automation triggers (ingest → run → draft sequence).

## 2) Ingestion, LlamaIndex, and Retrieval
**Definition of done:** Full source selection + progress + recovery UI, expanded connectors, validation report surfaced.

- [x] LlamaIndex ingestion integration (chunking, embedding, parsing).
- [x] Folder upload + relative path reconstruction.
- [x] Enhance ingestion UI (source type selection, progress, failure recovery).
- [x] Expand LlamaHub connectors (OCR, email, cloud drives) + UI exposure.
- [x] Add ingestion validation report (coverage, skipped files, OCR status).

## 3) Knowledge Graph and RAG
**Definition of done:** Fact extraction + citations, schema refinement + clustering worker, snapshots + diffing, query builder UI with citations.

- [x] Graph explorer UI + graph API.
- [x] Graph refinement worker status endpoints.
- [x] Fact extraction pipeline (claims, events, entities) with citations + confidence.
- [x] Background swarm for graph schema refinement, clustering, and new edges.
- [x] Case-specific graph snapshots and diffing.
- [x] Graph query builder UI with evidence citations.

## 4) Forensics Suite (Core + Crypto)
**Definition of done:** Authenticity panels, custody attribution, report history + exports + audit trails.

- [x] Crypto tracing upgrades (cross-chain hints, clustering, bridge matching).
- [x] Forensics report API and UI integration.
- [x] Rebuild/wire PDF authenticity, image authenticity, metadata forensics UI panels.
- [x] Expand custody attribution workflows (Coinbase/Coinbase Pro, etc.).
- [x] Add forensic report version history, export, and audit trails.

## 5) Timeline Builder (Critical)
**Definition of done:** Full filters, storyboard web export, media hooks.

- [x] Timeline exports (MD/HTML/PDF/XLSX) + storyboard endpoint.
- [x] Interactive timeline builder UI with citations and document inspector.
- [x] Filters by topic/subject and evidence source.
- [x] Storyboard mode (visual timeline narrative) UI.
- [x] Export storyboard to web page.
- [x] Video/image generation hooks for exhibits and visual aids.

## 6) Presentation + Exhibit Binder
**Definition of done:** Drag/drop presentation builder, in-court mode, export formats.

- [x] Evidence binder baseline.
- [x] Full exhibit presentation builder UI (drag/drop, playback, exhibits).
- [x] In-court mode (presentation controls, binder live view).
- [x] Export to PDF/XLSX/HTML with citations.

## 7) Legal Research + Theory + Strategy
**Definition of done:** Research UI, theory builder UI, strategy UI with argument mapping.

- [x] Legal theory service + automated phase.
- [x] CourtListener + Case.law connectors.
- [x] Legal research UI (case law results, citation chains, summary panels).
- [x] Legal theory builder UI (framework explorer + citations).
- [x] Trial strategy + legal strategist swarms with argument mapping UI. (Dynamic map now derived from live swarm/index outputs + citations with manual refresh control.)

## 8) Court Integrations (PACER / UniCourt / LACS)
**Definition of done:** LACS scraping, payment workflow, case/docket UI.

- [x] Connector stubs + credential settings + payment ledger.
- [x] LACS scraping agent for calendar + docket ingestion.
- [x] PACER/UniCourt payment workflow integration (secure payment queue).
- [x] UI for court sync status, cases, deadlines, and filings.

## 9) Product-Grade UI/UX
**Definition of done:** War room, polished 3D graph, Trial University, voice assistant UI.

- [x] Core app navigation foundation.
- [x] Full UI redesign with cohesive visual identity.
- [x] Settings: module-level provider/model overrides (chat + advanced embeddings/vision).
- [x] “CENTCOM” war room orchestration view (expanded + interactive).
- [x] 3D graph explorer polish + cinematic visualization.
- [x] Trial University module + interactive onboarding.
- [x] Voice-enabled assistant UI.

## 10) Subscription, Billing, and Access
**Definition of done:** Auth + tiers + billing portal + usage metering.

- [ ] Auth and subscription tiers.
- [ ] Seat management + org permissions.
- [ ] Billing portal integration (Stripe or equivalent).
- [ ] Usage metering + cost telemetry UI.

## 11) DevOps and Reliability
**Definition of done:** hardened images, CI, observability/alerting.

- [x] Dev/prod compose profiles.
- [x] Docker image hardening and multi-arch build pipeline.
- [x] CI pipelines for backend, frontend, and e2e.
- [x] Observability dashboards and alerting.

## 12) Documentation and Sales Readiness
**Definition of done:** end-user docs per module + sales demo pack.

- [x] Swarms-first PRP migration.
- [x] Reproducibility log.
- [x] End-user docs per module.
- [ ] Sales demo scripts + sample data packs.

## 13) Legacy Tools/Crews Migration (Archive)
**Definition of done:** inventory mapped, key workflows rebuilt, UI panels restored.

- [x] Inventory `toolsnteams_previous` definitions and map to Swarms teams/tools. (See `docs/plans/2026-02-10_toolsnteams_inventory.md`)
- [x] Rebuild case management/task tracker workflows.
- [x] Rebuild discovery + deposition prep workflows.
- [x] Rebuild subpoenas + trial preparation swarms and UI panels.
- [x] Rebuild drafting tooling (auto_drafter, document_drafter, templates).
- [x] Rebuild privilege detection + bates numbering pipeline.
- [x] Rebuild narrative discrepancy + sanctions risk analysis.
- [x] Rebuild case management/task tracker UI panels.

---

## Notes
- Updated per user request to maintain a live checklist view and vertical-slice execution.
- This file will be updated after each completed epic with clear `[x]` markings.
