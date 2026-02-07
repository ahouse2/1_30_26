# Execution Guide — ACE Loop & Logs

> **PRP Navigation:** [Base](PRP_CoCounsel_Swarms_LlamaIndex_Swarms_base.md) · [Planning](PRP_CoCounsel_Swarms_LlamaIndex_Swarms_planning.md) · [Spec](PRP_CoCounsel_Swarms_LlamaIndex_Swarms_spec.md) · [Tasks](PRP_CoCounsel_Swarms_LlamaIndex_Swarms_tasks.md) · [Pre-PRP Plan](PRE_PRP_PLAN.md) · [ACE Execution Guide](EXECUTION_GUIDE_ACE.md) · [Task List Master](TASK_LIST_MASTER.md) · [PRP Templates](templates/README.md)

ACE Roles
- Retriever: builds ContextPacket (vector hits, graph entities/paths, citations)
- Planner: drafts code/answers referencing ContextPacket IDs
- Critic: checks scope, citations, acceptance criteria, repo hygiene
- Orchestrator: merges/stylizes; writes outcomes and follow‑ups

Loop
1) Retriever → ContextPacket JSON
2) Planner → Draft (must include citations/IDs)
3) Critic → Redlines; require corrections
4) Planner → Apply; repeat up to N (default 3)
5) Orchestrator → finalize; log outcome

Logging
- Append to docs/logs/reproducibility.md with tasks, files touched, and commands used
- If unfinished, write handoff notes under docs/reviews/ with scope, WIP, next actions

Validation Hooks
- Unit/integration/e2e suites run on ACE finalize
- Citation coverage and retrieval traces must be present for acceptance
- Forensics acceptance: every ingested file has hash/metadata/structure artifacts; image/financial checks executed where applicable
