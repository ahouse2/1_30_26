# Swarms Parity Matrix — Teams + Capabilities (2026-02-07, PST)

## Scope
This matrix maps **legacy swarms/teams** and **feature capabilities** to the current Swarms-first implementation. Status reflects **verified code or UI** in the repo as of 2026-02-07 (PST).

## Status Legend
- **Implemented**: feature exists with working API + UI or service integration.
- **Partial**: core service exists but missing UI, automation, or full workflows.
- **Planned**: outlined in plans/roadmap but not implemented.
- **Needs Audit**: mentioned but not verified in code.

## Team / Swarm Parity
| Team / Swarm | Status | Notes |
| --- | --- | --- |
| Document Ingestion Crew | Partial | LlamaIndex ingest + folder uploads; needs full UI source selection & reporting.
| Forensic Analysis Crew | Partial | Crypto tracing upgraded; PDF/image authenticity UI pending.
| Legal Research Crew | Partial | CourtListener + Case.law connectors; UI workflows pending.
| Litigation Support Crew | Partial | Legal theory service exists; trial strategy + argument mapping UI pending.
| Presentation / Exhibit Crew | Partial | Evidence binder baseline; full presentation builder UI pending.
| Timeline Crew | Implemented | Timeline exports + storyboard + interactive timeline UI.
| QA Oversight Crew | Partial | QA phase exists; governance/reporting UI pending.
| Dev Team Crew | Partial | Dev agent scaffolding; operational UI pending.
| Voice Assistant Crew | Planned | Infra present; UI + pipeline integration pending.
| CENTCOM War Room | Partial | Core view exists; needs deeper workflow linkage & telemetry polish.
| Trial University | Partial | UI module exists; lesson content + backend pipeline pending.
| Mock Trial Arena | Partial | UI arena present; gameplay + evidence tie-ins pending.

## Capability Parity
| Capability | Status | Notes |
| --- | --- | --- |
| Ingestion (files/folders) | Implemented | Folder upload + LlamaIndex ingestion present.
| OCR / parsing / chunking | Partial | LlamaIndex wired; advanced OCR pipeline needs UI + coverage report.
| Fact extraction | Partial | Extraction stage exists; structured UI + citations pipeline pending.
| Embeddings + vector storage | Implemented | Qdrant + embeddings wired; settings support.
| Retrieval + RAG | Partial | Core retrieval in place; deeper UI + advanced query builder pending.
| Knowledge graph upserts | Implemented | Graph service + explorer UI exists.
| Graph refinement swarm | Partial | Worker/status endpoints exist; automated swarm logic + stopping criteria pending.
| Timeline builder | Implemented | Exports + storyboard endpoints + interactive UI.
| Evidence binder | Partial | Baseline store + API; UI needs expansion.
| Presentation builder | Planned | No full UI; needs exhibit playback + export.
| Legal theory builder | Partial | Service exists; UI pending.
| Trial strategy builder | Planned | Needs swarm + UI.
| Argument mapping | Partial | Backend endpoints; UI pending.
| QA layer | Partial | QA phase exists; scoring + UI pending.
| Forensics (PDF, image) | Partial | Core services present; UI and deep checks pending.
| Crypto tracing | Partial | Cross-chain + clustering added; UI and attribution workflows pending.
| Court integrations (PACER/UniCourt/LACS) | Partial | Connectors + settings + ledger; LACS scraping + payments UI pending.
| Case law research | Partial | CourtListener + Case.law connectors; UI pending.
| Automation pipeline | Partial | Orchestration exists; UI controls pending.
| Voice assistant | Planned | Infra placeholders; needs integration.
| 3D graph explorer | Implemented | UI + API ready, needs polish.
| CENTCOM war room | Partial | UI exists; needs deeper orchestration visibility.
| Subscription + billing | Planned | Not yet integrated.
| Audit log + reproducibility | Partial | Repro log exists; UI audit trails pending.

## Key Gaps (Highest Priority)
1. **Presentation + exhibit builder UI** with exports.
2. **Legal research + theory + strategy UI** with citations.
3. **Forensics UI** (PDF/image authenticity + crypto attribution workflows).
4. **Automation UI controls** (run/retry/monitor).
5. **Subscription + billing** groundwork.
6. **Storyboard web export + visual aid generation hooks**.

## Legacy Tools/Crews to Migrate (from `toolsnteams_previous`)
Full inventory and mapping lives in `docs/plans/2026-02-10_toolsnteams_inventory.md`.
| Legacy Module | Target Swarm/Capability | Status |
| --- | --- | --- |
| case_management_crew + case_management_tools | Case management + intake workflows | Needs Audit |
| discovery_production_crew | Discovery workflows + production tracking | Needs Audit |
| deposition_prep | Deposition prep toolkit | Needs Audit |
| subpoena_crew + subpoena_manager | Subpoena management | Needs Audit |
| trial_preparation_crew | Trial prep workflows | Needs Audit |
| document_drafter + auto_drafter | Drafting pipeline (motions, pleadings) | Needs Audit |
| bates_numbering | Evidence + exhibit processing | Needs Audit |
| privilege_detector | Privilege review | Needs Audit |
| fact_extractor | Fact extraction pipeline | Partial |
| courtlistener_client + legal_crawler | Legal research ingestion | Partial |
| legal_theory_engine + ontology_loader | Legal theory engine | Partial |
| presentation_generator | Presentation builder | Planned |
| narrative_discrepancy_detector | QA / inconsistency detection | Planned |
| sanctions_risk_analyzer | Risk analysis | Planned |
| template_library | Draft templates | Planned |
| task_tracker | Workflow tracking | Partial |
| vector_database_manager | Vector store tooling | Implemented (Qdrant) |

## Immediate Next Actions
- Finish UI redesign across remaining modules + orchestration polish.
- Expand swarm parity for forensics/legal research/trial strategy.
- Build presentation/exhibit builder + storyboard web export.
