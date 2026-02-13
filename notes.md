# Notes: Swarms Direction Docs + Repro Logs + Feature Audit

## Sources

### Local repo files
- /Volumes/MAC_DEV/REPOS/2-4-26_tree/co-counsel_final/backend/app/forensics/analyzer.py
- /Volumes/MAC_DEV/REPOS/2-4-26_tree/co-counsel_final/backend/app/forensics/crypto_tracer.py
- /Volumes/MAC_DEV/REPOS/2-4-26_tree/co-counsel_final/backend/app/services/blockchain_service.py
- /Volumes/MAC_DEV/REPOS/2-4-26_tree/co-counsel_final/backend/app/agents/tools/forensic_tools.py
- /Volumes/MAC_DEV/REPOS/2-4-26_tree/co-counsel_final/backend/app/agents/teams/forensic_analysis.py
- /Volumes/MAC_DEV/REPOS/2-4-26_tree/co-counsel_final/backend/app/api/forensics.py

## Synthesized Findings

### Current feature coverage (forensics/crypto)
- Forensic analyzer exists but most advanced techniques are stubbed and return None (ELA, clone/splicing, font/object analysis, scan-alter-rescan).
- Crypto tracing exists with wallet extraction + on-chain queries via Etherscan/Blockchair + Neo4j storage, but some paths are placeholders or depend on optional libs (web3.py, bitcoinlib). Real tracing depth is limited and needs hardening.
- Agent teams/tools reference forensics and crypto tools; endpoints exist for forensics and crypto tracing.

### Docs to update
- New Vision + Architecture doc and Roadmap + Milestones doc to reflect Swarms-first direction.
- Existing docs referencing MS agents or legacy orchestration likely need updates: architecture/agentic_systems.md, ROADMAP.md, QUICKSTART.md, ONBOARDING.md, runbooks/FORENSICS.md, validation/forensics_workflow_playbook.md.

### PRP docs to migrate (MS Agents references)
- docs/AgentsMD_PRPs_and_AgentMemory/PRPs/AGENT_TOOL_REGISTRY.md
- docs/AgentsMD_PRPs_and_AgentMemory/PRPs/EXECUTION_GUIDE_ACE.md
- docs/AgentsMD_PRPs_and_AgentMemory/PRPs/EXECUTION_PLAN_MSAgents_SDK_Orchestration.md
- docs/AgentsMD_PRPs_and_AgentMemory/PRPs/PRE_PRP_PLAN.md
- docs/AgentsMD_PRPs_and_AgentMemory/PRPs/PRP_CoCounsel_MSAgents_LlamaIndex_Swarms_base.md
- docs/AgentsMD_PRPs_and_AgentMemory/PRPs/PRP_CoCounsel_MSAgents_LlamaIndex_Swarms_planning.md
- docs/AgentsMD_PRPs_and_AgentMemory/PRPs/PRP_CoCounsel_MSAgents_LlamaIndex_Swarms_spec.md
- docs/AgentsMD_PRPs_and_AgentMemory/PRPs/PRP_CoCounsel_MSAgents_LlamaIndex_Swarms_tasks.md
- docs/AgentsMD_PRPs_and_AgentMemory/PRPs/PRP_MSAgents_Session_Graph.md
- docs/AgentsMD_PRPs_and_AgentMemory/PRPs/PRPs/PRP_MSAgents_Session_Flow.md
- docs/AgentsMD_PRPs_and_AgentMemory/PRPs/RUNBOOK_Dev_Agent.md
- docs/AgentsMD_PRPs_and_AgentMemory/PRPs/TASK_LIST_MASTER.md
- docs/AgentsMD_PRPs_and_AgentMemory/PRPs/ai_docs/TRD-PRP_legal_tech_2_rebuilt_msagents_llamaindex_swarms.md

### Audit findings (summary)
- Implemented: Swarms workflow orchestration, LlamaIndex ingestion, graph upserts + refinement.
- Partial: timeline builder (no exports/storyboard), forensics/crypto depth, voice assistant, mock trial arena, trial university, 3D graph explorer wiring, QA/Dev swarms.
- Missing: war-room orchestration UI, LACS/PACER/UniCourt integrations, exhibit binder backend.

### Reproducibility logs
- Add a dedicated log file under docs (e.g., docs/logs/reproducibility.md) with dated entries and changes.

### Sources (cross-chain + custodial attribution)
- Ledger (cross-chain tracing via bridges): https://ledger.pitt.edu/ojs/ledger/article/view/433
- Etherscan public labels: https://info.etherscan.com/public-name-tags-labels/
- USENIX "Fistful of Bitcoins" clustering heuristics: https://www.usenix.org/publications/login/december-2013-volume-38-number-6/fistful-bitcoins-characterizing-payments-among
- Coinbase legal process for subpoenas: https://help.coinbase.com/en-gb/coinbase/other-topics/legal-policies/who-do-i-contact-for-a-subpoena-request-or-dispute-or-to-send-a-legal-document
