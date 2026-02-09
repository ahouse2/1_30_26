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
- [ ] Full parity with legacy team behaviors (see Parity Matrix).
- [ ] Background graph-refinement swarm with stopping criteria.
- [ ] Autonomous policy tuning for long-running cases (trust policy tuning UI + controls).
- [ ] Scheduled automation triggers (ingest → run → draft sequence).

## 2) Ingestion, LlamaIndex, and Retrieval
**Definition of done:** Full source selection + progress + recovery UI, expanded connectors, validation report surfaced.

- [x] LlamaIndex ingestion integration (chunking, embedding, parsing).
- [x] Folder upload + relative path reconstruction.
- [ ] Enhance ingestion UI (source type selection, progress, failure recovery).
- [ ] Expand LlamaHub connectors (OCR, email, cloud drives) + UI exposure.
- [ ] Add ingestion validation report (coverage, skipped files, OCR status).

## 3) Knowledge Graph and RAG
**Definition of done:** Fact extraction + citations, schema refinement + clustering worker, snapshots + diffing, query builder UI with citations.

- [x] Graph explorer UI + graph API.
- [x] Graph refinement worker status endpoints.
- [ ] Fact extraction pipeline (claims, events, entities) with citations + confidence.
- [ ] Background swarm for graph schema refinement, clustering, and new edges.
- [ ] Case-specific graph snapshots and diffing.
- [ ] Graph query builder UI with evidence citations.

## 4) Forensics Suite (Core + Crypto)
**Definition of done:** Authenticity panels, custody attribution, report history + exports + audit trails.

- [x] Crypto tracing upgrades (cross-chain hints, clustering, bridge matching).
- [x] Forensics report API and UI integration.
- [ ] Rebuild/wire PDF authenticity, image authenticity, metadata forensics UI panels.
- [ ] Expand custody attribution workflows (Coinbase/Coinbase Pro, etc.).
- [ ] Add forensic report version history, export, and audit trails.

## 5) Timeline Builder (Critical)
**Definition of done:** Full filters, storyboard web export, media hooks.

- [x] Timeline exports (MD/HTML/PDF/XLSX) + storyboard endpoint.
- [x] Interactive timeline builder UI with citations and document inspector.
- [ ] Filters by topic/subject and evidence source.
- [x] Storyboard mode (visual timeline narrative) UI.
- [ ] Export storyboard to web page.
- [ ] Video/image generation hooks for exhibits and visual aids.

## 6) Presentation + Exhibit Binder
**Definition of done:** Drag/drop presentation builder, in-court mode, export formats.

- [x] Evidence binder baseline.
- [ ] Full exhibit presentation builder UI (drag/drop, playback, exhibits).
- [ ] In-court mode (presentation controls, binder live view).
- [ ] Export to PDF/XLSX/HTML with citations.

## 7) Legal Research + Theory + Strategy
**Definition of done:** Research UI, theory builder UI, strategy UI with argument mapping.

- [x] Legal theory service + automated phase.
- [x] CourtListener + Case.law connectors.
- [ ] Legal research UI (case law results, citation chains, summary panels).
- [ ] Legal theory builder UI (framework explorer + citations).
- [ ] Trial strategy + legal strategist swarms with argument mapping UI.

## 8) Court Integrations (PACER / UniCourt / LACS)
**Definition of done:** LACS scraping, payment workflow, case/docket UI.

- [x] Connector stubs + credential settings + payment ledger.
- [ ] LACS scraping agent for calendar + docket ingestion.
- [ ] PACER/UniCourt payment workflow integration (secure payment queue).
- [ ] UI for court sync status, cases, deadlines, and filings.

## 9) Product-Grade UI/UX
**Definition of done:** War room, polished 3D graph, Trial University, voice assistant UI.

- [x] Core app navigation foundation.
- [x] Full UI redesign with cohesive visual identity.
- [ ] “CENTCOM” war room orchestration view (expanded + interactive).
- [ ] 3D graph explorer polish + cinematic visualization.
- [ ] Trial University module + interactive onboarding.
- [ ] Voice-enabled assistant UI.

## 10) Subscription, Billing, and Access
**Definition of done:** Auth + tiers + billing portal + usage metering.

- [ ] Auth and subscription tiers.
- [ ] Seat management + org permissions.
- [ ] Billing portal integration (Stripe or equivalent).
- [ ] Usage metering + cost telemetry UI.

## 11) DevOps and Reliability
**Definition of done:** hardened images, CI, observability/alerting.

- [x] Dev/prod compose profiles.
- [ ] Docker image hardening and multi-arch build pipeline.
- [ ] CI pipelines for backend, frontend, and e2e.
- [ ] Observability dashboards and alerting.

## 12) Documentation and Sales Readiness
**Definition of done:** end-user docs per module + sales demo pack.

- [x] Swarms-first PRP migration.
- [x] Reproducibility log.
- [ ] End-user docs per module.
- [ ] Sales demo scripts + sample data packs.

## 13) Legacy Tools/Crews Migration (Archive)
**Definition of done:** inventory mapped, key workflows rebuilt, UI panels restored.

- [ ] Inventory `toolsnteams_previous` definitions and map to Swarms teams/tools.
- [ ] Rebuild case management + discovery + deposition prep workflows.
- [ ] Rebuild subpoenas + trial preparation swarms and UI.
- [ ] Rebuild drafting tooling (auto_drafter, document_drafter, templates).
- [ ] Rebuild privilege detection + bates numbering pipeline.
- [ ] Rebuild narrative discrepancy + sanctions risk analysis.
- [ ] Rebuild case management/task tracker UI panels.

---

## Notes
- Updated per user request to maintain a live checklist view and vertical-slice execution.
- This file will be updated after each completed epic with clear `[x]` markings.
