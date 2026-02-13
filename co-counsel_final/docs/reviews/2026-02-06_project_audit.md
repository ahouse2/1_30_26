# Project Audit — Swarms Program (2026-02-06)

## Summary
This audit evaluates current code and UI coverage against the Swarms-first target feature set. Status values: Implemented, Partial, Missing.

## Capability Matrix
| Capability | Status | Evidence | Gap Notes |
| --- | --- | --- | --- |
| Swarms workflow orchestration | Implemented | `backend/app/services/workflow.py`, `backend/app/workflow/registry.py`, `backend/app/api/workflow.py`, `frontend/src/pages/CaseWorkflowPage.tsx` | Needs richer UI controls for per-team retriggers. |
| LlamaIndex ingestion + indexing | Implemented | `backend/app/services/ingestion.py`, `backend/app/services/retrieval.py` | Needs stronger coverage for edge-case formats and connectors. |
| Knowledge graph upserts + refinement | Partial | `backend/app/services/graph.py`, `backend/app/services/graph_refinement.py` | Backend refinement swarm exists; UI visibility/controls still needed. |
| Timeline builder (auto + UI) | Implemented | `backend/app/services/timeline.py`, `backend/app/api/timeline.py`, `frontend/src/components/TimelineView.tsx` | Auto-extraction still limited; continue improving evidence coverage. |
| Forensics suite (docs/images/financial) | Partial | `backend/app/services/forensics.py`, `backend/app/api/forensics.py`, `frontend/src/pages/ForensicsReportPage.tsx` | Advanced authenticity checks still limited; needs full ELA/clone/font/object pipelines. |
| Crypto tracing / asset tracking | Partial | `backend/app/forensics/crypto_tracer.py`, `backend/app/forensics/bridge_registry.py`, `backend/app/forensics/custodial_attribution.py` | Needs deeper enrichment, sanctioned-address lists, and production-grade attribution flows. |
| Exhibit binder + presentation builder | Partial | `backend/app/api/evidence_binder.py`, `backend/app/evidence_binder/router.py`, `backend/app/storage/evidence_binder_store.py`, `frontend/src/pages/InCourtPresentationPage.tsx` | Needs richer slide tooling and exhibit export formats. |
| Document drafting | Partial | `backend/app/services/drafting.py`, `backend/app/api/agents.py`, `frontend/src/pages/DocumentDraftingPage.tsx` | Needs robust templates and end-to-end draft export. |
| 3D graph explorer | Implemented | `backend/app/api/graph.py`, `backend/app/services/graph.py`, `frontend/src/components/graph-explorer/GraphExplorerPanel.tsx` | Add advanced filtering + graph refinement status overlay. |
| War-room orchestration view | Implemented | `backend/app/services/workflow_runner.py`, `backend/app/api/workflow.py`, `frontend/src/pages/CentcomWarRoomPage.tsx` | Extend with per-team reruns + audit export. |
| Mock trial arena | Partial | `frontend/src/components/MockTrialArena.tsx`, `backend/app/api/scenarios.py` | UI placeholder; scenario engine needs integration for interactive simulation. |
| Trial University module | Partial | `frontend/src/components/trial-university/TrialUniversityPanel.tsx` | Content is static; needs backend curriculum and progress tracking. |
| Voice assistant | Partial | `backend/app/api/voice.py`, `backend/app/services/voice.py`, `frontend/src/components/VoiceConsole.tsx` | Needs production STT/TTS wiring and orchestration integration. |
| QA Swarm layer | Partial | `backend/app/agents/qa.py`, `backend/app/workflow/phases.py` | Needs comprehensive QA scoring across all artifacts. |
| Dev Swarm | Partial | `backend/app/agents/teams/software_development.py`, `frontend/src/pages/DevTeamPage.tsx` | Requires workflows for proposals and approvals. |
| Autonomous vs interactive separation | Partial | `backend/app/services/workflow.py`, `frontend/src/pages/CaseWorkflowPage.tsx` | Needs explicit UX boundaries and user control surfaces. |
| Court + case law integrations | Partial | `backend/app/services/court_integration.py`, `backend/app/services/court_connectors/*`, `backend/app/api/courts.py` | Needs live API wiring, paid retrieval confirmations in UI, and case-law sync enrichment. |

## Top Gaps (Critical)
1. Court integrations (LACS, PACER, UniCourt) with live API wiring + paid retrieval UI.
2. Forensics hardening (authenticity pipelines, crypto attribution depth).
3. Trial experience modules (mock trial arena, Trial University) with real data wiring.
4. Exhibit binder + presentation builder workflows (end-to-end).
