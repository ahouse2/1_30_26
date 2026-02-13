# toolsnteams_previous Inventory + Swarms Mapping (2026-02-10, PST)

**Purpose:** Explicit inventory of legacy modules and the target Swarms-first team/capability they map to. Used to drive parity completion.

## Inventory Table
| Legacy Module | Target Swarm / Capability | Status | Notes |
| --- | --- | --- | --- |
| agent_creator | Agent provisioning | Needs Audit | Map to agent creation workflows + Swarms registry.
| auto_drafter | Drafting pipeline | Partial | Drafting service + Swarms drafting tool wired; UI + templates pending.
| bates_numbering | Evidence processing | Planned | Needs bates pipeline integration + UI.
| build_customized_agent | Agent provisioning | Needs Audit | Likely maps to Swarms builder UI.
| build_customized_multi_agents | Agent provisioning | Needs Audit | Multi-agent bundle builder.
| case_management_crew | Case management | Needs Audit | Map to case intake + tracking UI.
| case_management_tools | Case management | Needs Audit | Map to case intake + tracking UI.
| chat_agent | Assistant chat | Partial | Map to core assistant + UI.
| cocounsel_agent | Assistant core | Partial | Swarms orchestrator + UI.
| code_editor | Dev tooling | Partial | Dev agent + code editor UI pending.
| command_prompt | Prompt ops | Needs Audit | Map to agent prompt ops.
| courtlistener_client | Legal research | Partial | CourtListener connector exists.
| debate | Mock trial / debate | Planned | Map to Mock Trial Arena.
| deposition_prep | Deposition prep | Partial | Swarms deposition prep tool wired; UI pending.
| discovery_production_crew | Discovery workflows | Partial | Swarms discovery production tool wired; UI pending.
| document_drafter | Drafting pipeline | Partial | Drafting service + Swarms drafting tool wired; UI pending.
| document_fetcher | Ingestion / fetch | Partial | Map to ingestion connectors.
| document_ingestion_crew | Ingestion | Implemented | LlamaIndex ingestion + folder uploads.
| document_modifier | Doc editing | Planned | Map to document editor.
| document_processor | Ingestion | Partial | Map to preprocessing pipeline.
| document_scorer | Scoring / relevance | Planned | Map to retrieval scoring + UI.
| fact_extractor | Fact extraction | Partial | Extraction stage exists; UI pending.
| file_manager | File management | Partial | Map to upload / file ops.
| forensic_analysis_crew | Forensics | Partial | Core services; UI pending.
| forensic_tools | Forensics tools | Partial | Map to forensics pipeline.
| graph_analyzer | Knowledge graph | Partial | Graph service exists; analytics UI pending.
| internet_search | Research tools | Partial | Research connectors exist.
| knowledge_graph_manager | Knowledge graph | Partial | Graph service exists; advanced workflows pending.
| legal_analysis_crew | Legal analysis | Partial | Map to legal theory + strategy.
| legal_crawler | Legal research | Partial | Connectors exist; UI pending.
| legal_research_crew | Legal research | Partial | Map to research UI + swarms.
| legal_theory_engine | Legal theory | Partial | Service exists; UI pending.
| legal_theory_ontology.json | Legal theory ontology | Partial | Used by legal theory service.
| litigation_support_crew | Litigation support | Partial | Strategy + argument mapping UI pending.
| mgx_write_project_framework | Drafting templates | Planned | Map to drafting templates.
| narrative_discrepancy_detector | QA / inconsistency | Planned | Map to QA oversight.
| ontology_loader | Legal ontology | Partial | Needs audit + UI exposure.
| presentation_generator | Presentation builder | Planned | UI + export missing.
| pretrial_generator | Trial prep | Planned | Map to trial prep workflows.
| privilege_detector | Privilege review | Planned | Privilege UI + pipeline pending.
| research | Research workflows | Partial | Map to research UI + tools.
| research_tools | Research tools | Partial | Map to research UI + tools.
| sanctions_risk_analyzer | Risk analysis | Planned | Map to QA + strategy.
| sandboxed_vm | Sandbox tooling | Partial | Sandbox API exists; UI pending.
| search_enhanced_qa | QA / search | Planned | Map to QA oversight.
| serialize_model | Model ops | Needs Audit | Evaluate usage.
| software_development_crew | Dev team | Partial | Dev agent scaffolding exists.
| subpoena_crew | Subpoenas | Partial | Swarms subpoena tool wired; UI pending.
| subpoena_manager | Subpoenas | Partial | Swarms subpoena tool wired; UI pending.
| task_tracker | Workflow tracking | Partial | Map to task tracking UI.
| template_library | Draft templates | Planned | Template UI + management.
| timeline_construction_crew | Timeline | Implemented | Timeline UI + exports.
| timeline_manager | Timeline | Implemented | Timeline UI + exports.
| trial_preparation_crew | Trial prep | Partial | Swarms trial prep tool wired; UI pending.
| vector_database_manager | Vector store | Implemented | Qdrant + embeddings wired.
| web_scraper | Research / intake | Partial | Map to research ingestion.
| write_design | Drafting | Planned | Map to drafting templates.

## Notes
- Status reflects current Swarms-first implementation as of 2026-02-10. Most legacy items require UI + workflow integration to reach full parity.
