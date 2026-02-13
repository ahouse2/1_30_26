# PRP Migration + Swarms Audit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate legacy swarms PRPs to Swarms-first docs (keeping filenames), archive originals, and produce a comprehensive audit + remediation backlog for missing functionality.

**Architecture:** We will preserve PRP filenames in `docs/AgentsMD_PRPs_and_AgentMemory/PRPs`, move legacy versions into `archive-co counsel/`, and draft Swarms-first replacements. Then we will generate an audit matrix that compares current code and UI coverage against the target feature set, and produce a prioritized remediation backlog.

**Tech Stack:** Markdown docs, Python backend (FastAPI), React frontend (Vite), Neo4j, Qdrant, LlamaIndex, Swarms.

---

### Task 1: Inventory legacy PRPs and swarms references

**Files:**
- Modify: `notes.md`

**Step 1: Find PRP files referencing swarms**

Run:
```bash
grep -R --line-number --ignore-case -e "swarms" -e "msagents" -e "microsoft agents" docs/AgentsMD_PRPs_and_AgentMemory/PRPs
```
Expected: list of PRP files to migrate.

**Step 2: Record the migration list in notes**

Add the list under “Docs to migrate” in `notes.md`.

**Step 3: Commit (skipped)**

Per user request, do not commit.

---

### Task 2: Archive legacy PRPs (keep structure)

**Files:**
- Modify: `archive-co counsel/AgentsMD_PRPs_and_AgentMemory/PRPs/*`

**Step 1: Create archive directories**

Run:
```bash
mkdir -p "archive-co counsel/AgentsMD_PRPs_and_AgentMemory/PRPs"
```
Expected: directory exists.

**Step 2: Move legacy PRP files**

Run (example):
```bash
mv docs/AgentsMD_PRPs_and_AgentMemory/PRPs/EXECUTION_PLAN_Swarms_SDK_Orchestration.md "archive-co counsel/AgentsMD_PRPs_and_AgentMemory/PRPs/"
```
Repeat for each legacy file in the migration list.

**Step 3: Commit (skipped)**

Per user request, do not commit.

---

### Task 3: Draft Swarms-first PRP replacements (base/planning/spec/tasks)

**Files:**
- Create: `docs/AgentsMD_PRPs_and_AgentMemory/PRPs/PRP_CoCounsel_Swarms_LlamaIndex_Swarms_base.md`
- Create: `docs/AgentsMD_PRPs_and_AgentMemory/PRPs/PRP_CoCounsel_Swarms_LlamaIndex_Swarms_planning.md`
- Create: `docs/AgentsMD_PRPs_and_AgentMemory/PRPs/PRP_CoCounsel_Swarms_LlamaIndex_Swarms_spec.md`
- Create: `docs/AgentsMD_PRPs_and_AgentMemory/PRPs/PRP_CoCounsel_Swarms_LlamaIndex_Swarms_tasks.md`

**Step 1: Draft Swarms-first base PRP**

Write the base PRP with Swarms-first assumptions, LlamaIndex ingestion, graph refinement, autonomous + interactive pipeline split, and compliance constraints.

**Step 2: Draft planning PRP**

Define phased delivery, acceptance criteria, risks, and dependency list for core milestones.

**Step 3: Draft spec PRP**

Describe system components, APIs, data flow, and integration points for each core capability.

**Step 4: Draft tasks PRP**

Provide detailed execution tasks aligned to milestones.

**Step 5: Commit (skipped)**

Per user request, do not commit.

---

### Task 4: Update PRP execution + session graph docs to Swarms

**Files:**
- Create: `docs/AgentsMD_PRPs_and_AgentMemory/PRPs/EXECUTION_PLAN_Swarms_SDK_Orchestration.md`
- Create: `docs/AgentsMD_PRPs_and_AgentMemory/PRPs/PRP_Swarms_Session_Graph.md`

**Step 1: Replace orchestration plan**

Rewrite as Swarms orchestration (router, teams, QA, retriggers, artifact persistence).

**Step 2: Replace session graph doc**

Document Swarms session flow, graph refinement loop, and phase handoffs.

**Step 3: Commit (skipped)**

Per user request, do not commit.

---

### Task 5: Update references and indexes

**Files:**
- Modify: `docs/AgentsMD_PRPs_and_AgentMemory/PRPs/AGENT_TOOL_REGISTRY.md`
- Modify: any PRP docs that cite swarms

**Step 1: Replace swarms references with Swarms**

Search and replace in PRPs to ensure Swarms is the only authoritative runtime.

**Step 2: Commit (skipped)**

Per user request, do not commit.

---

### Task 6: Update reproducibility log

**Files:**
- Modify: `docs/logs/reproducibility.md`

**Step 1: Append entry for PRP migration**

List migrated files, archived paths, and commands used.

**Step 2: Commit (skipped)**

Per user request, do not commit.

---

### Task 7: Perform full audit of current system coverage

**Files:**
- Create: `docs/reviews/2026-02-06_project_audit.md`
- Modify: `notes.md`

**Step 1: Create audit matrix**

For each requested capability (timeline, forensics, crypto tracing, war room UI, 3D graph, mock trial arena, voice assistant, court integrations, QA/dev teams), mark status as implemented/partial/missing with file references.

**Step 2: Capture findings and gaps**

Summarize top gaps and dependencies in `notes.md`.

**Step 3: Commit (skipped)**

Per user request, do not commit.

---

### Task 8: Create remediation backlog and next-phase plan

**Files:**
- Create: `docs/plans/2026-02-06_swarms_remediation_backlog.md`

**Step 1: Draft backlog**

Prioritize gaps into Critical, High, and Medium buckets with suggested owners (Swarm team) and dependencies.

**Step 2: Define next-phase scope**

List the first 2-3 remediation epics to implement immediately after approval.

**Step 3: Commit (skipped)**

Per user request, do not commit.

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-02-06-prp-migration-audit-plan.md`.

Two execution options:

1. **Subagent-Driven (this session)** — dispatch a fresh subagent per task, review between tasks.
2. **Parallel Session** — open a new session and run with executing-plans in batch with checkpoints.

Which approach should we use?
