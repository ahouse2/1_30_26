# Swarms Hybrid Workflow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a hybrid Swarms workflow engine that runs the full case pipeline automatically after ingestion while allowing manual re-runs of any phase, with JSON + Markdown artifacts and knowledge-graph upserts.

**Architecture:** Add a CaseWorkflowService with a Phase Registry and persistent CaseState/PhaseRun stores. Each phase executes via Swarms profiles and emits graph upserts. API endpoints expose full runs and per-phase runs.

**Tech Stack:** FastAPI, Pydantic, existing Swarms orchestration, LlamaIndex pipeline, GraphService, JSONL storage.

---

### Task 1: Add workflow models and request fields

**Files:**
- Create: `backend/app/models/workflow.py`
- Modify: `backend/app/models/api.py`

**Step 1: Write the failing test**

Create `backend/tests/test_workflow_models.py`:

```python
from backend.app.models.workflow import PhaseRunRequest, WorkflowRunRequest


def test_workflow_models_accept_optional_case_id():
    payload = WorkflowRunRequest(case_id="case-1", phases=["ingestion"], auto_run=True)
    assert payload.case_id == "case-1"
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_workflow_models.py::test_workflow_models_accept_optional_case_id -v`
Expected: FAIL with `ModuleNotFoundError: backend.app.models.workflow`

**Step 3: Write minimal implementation**

Create `backend/app/models/workflow.py`:

```python
from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


PhaseName = Literal[
    "ingestion",
    "preprocess",
    "forensics",
    "parsing_chunking",
    "indexing",
    "fact_extraction",
    "timeline",
    "legal_theories",
    "strategy",
    "drafting",
    "qa_review",
]


class WorkflowRunRequest(BaseModel):
    case_id: Optional[str] = None
    phases: List[PhaseName] = Field(default_factory=list)
    auto_run: bool = True


class PhaseRunRequest(BaseModel):
    case_id: str
    phases: List[PhaseName]
    override_model: Optional[str] = None


class PhaseArtifactRef(BaseModel):
    artifact_id: str
    format: Literal["json", "md"]
    path: str
    created_at: datetime


class PhaseRunResponse(BaseModel):
    run_id: str
    case_id: str
    phase: PhaseName
    status: Literal["queued", "running", "succeeded", "failed"]
    artifacts: List[PhaseArtifactRef] = Field(default_factory=list)
```

Modify `backend/app/models/api.py`:

```python
class IngestionRequest(BaseModel):
    sources: List[IngestionSource]
    case_id: Optional[str] = None
    auto_run: bool = True
    phases: List[str] = Field(default_factory=list)
```

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_workflow_models.py::test_workflow_models_accept_optional_case_id -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/models/workflow.py backend/app/models/api.py backend/tests/test_workflow_models.py
git commit -m "feat: add workflow request models"
```

---

### Task 2: Add workflow storage primitives

**Files:**
- Create: `backend/app/storage/workflow_store.py`
- Modify: `backend/app/config.py`

**Step 1: Write the failing test**

Create `backend/tests/test_workflow_store.py`:

```python
from backend.app.storage.workflow_store import WorkflowStore


def test_workflow_store_round_trip(tmp_path):
    store = WorkflowStore(base_path=tmp_path)
    run_id = store.save_phase_run("case-1", "ingestion", {"ok": True})
    record = store.get_phase_run("case-1", run_id)
    assert record["payload"]["ok"] is True
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_workflow_store.py::test_workflow_store_round_trip -v`
Expected: FAIL with `ModuleNotFoundError: backend.app.storage.workflow_store`

**Step 3: Write minimal implementation**

Create `backend/app/storage/workflow_store.py`:

```python
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict
from uuid import uuid4


class WorkflowStore:
    def __init__(self, base_path: Path) -> None:
        self.base_path = base_path
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _case_dir(self, case_id: str) -> Path:
        path = self.base_path / case_id
        path.mkdir(parents=True, exist_ok=True)
        return path

    def save_phase_run(self, case_id: str, phase: str, payload: Dict[str, Any]) -> str:
        run_id = uuid4().hex
        record = {
            "run_id": run_id,
            "phase": phase,
            "payload": payload,
            "created_at": datetime.utcnow().isoformat(),
        }
        path = self._case_dir(case_id) / f"phase_{run_id}.json"
        path.write_text(json.dumps(record, indent=2))
        return run_id

    def get_phase_run(self, case_id: str, run_id: str) -> Dict[str, Any]:
        path = self._case_dir(case_id) / f"phase_{run_id}.json"
        return json.loads(path.read_text())
```

Modify `backend/app/config.py`:

```python
class Settings(BaseSettings):
    workflow_storage_path: Path = Field(default=Path("storage/workflows"))

    def ensure_directories(self) -> None:
        ...
        self.workflow_storage_path.mkdir(parents=True, exist_ok=True)
```

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_workflow_store.py::test_workflow_store_round_trip -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/storage/workflow_store.py backend/app/config.py backend/tests/test_workflow_store.py
git commit -m "feat: add workflow storage"
```

---

### Task 3: Add phase registry and definitions

**Files:**
- Create: `backend/app/workflow/registry.py`
- Create: `backend/app/workflow/__init__.py`

**Step 1: Write the failing test**

Create `backend/tests/test_phase_registry.py`:

```python
from backend.app.workflow.registry import get_phase_registry


def test_phase_registry_contains_ingestion():
    registry = get_phase_registry()
    assert "ingestion" in registry
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_phase_registry.py::test_phase_registry_contains_ingestion -v`
Expected: FAIL

**Step 3: Write minimal implementation**

Create `backend/app/workflow/registry.py`:

```python
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict, List


@dataclass(frozen=True)
class PhaseDefinition:
    name: str
    handler: Callable[..., dict]
    swarms_profile: str
    outputs: List[str]


def get_phase_registry() -> Dict[str, PhaseDefinition]:
    from . import phases

    return {
        "ingestion": PhaseDefinition(
            name="ingestion",
            handler=phases.run_ingestion,
            swarms_profile="CoreCaseTeam",
            outputs=["json", "md"],
        ),
    }
```

Create `backend/app/workflow/__init__.py`:

```python
from .registry import get_phase_registry, PhaseDefinition
```

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_phase_registry.py::test_phase_registry_contains_ingestion -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/workflow/registry.py backend/app/workflow/__init__.py backend/tests/test_phase_registry.py
git commit -m "feat: add phase registry"
```

---

### Task 4: Add workflow service orchestration

**Files:**
- Create: `backend/app/services/workflow.py`
- Modify: `backend/app/services/__init__.py`

**Step 1: Write the failing test**

Create `backend/tests/test_workflow_service.py`:

```python
from backend.app.services.workflow import CaseWorkflowService


def test_run_single_phase(tmp_path):
    service = CaseWorkflowService(storage_path=tmp_path)
    result = service.run_phases(case_id="case-1", phases=["ingestion"], payload={})
    assert result[0].phase == "ingestion"
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_workflow_service.py::test_run_single_phase -v`
Expected: FAIL

**Step 3: Write minimal implementation**

Create `backend/app/services/workflow.py`:

```python
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List

from ..storage.workflow_store import WorkflowStore
from ..workflow.registry import get_phase_registry


@dataclass
class PhaseRunResult:
    run_id: str
    phase: str
    payload: Dict[str, Any]


class CaseWorkflowService:
    def __init__(self, storage_path: Path) -> None:
        self.store = WorkflowStore(storage_path)
        self.registry = get_phase_registry()

    def run_phases(self, case_id: str, phases: List[str], payload: Dict[str, Any]) -> List[PhaseRunResult]:
        results: List[PhaseRunResult] = []
        for phase in phases:
            definition = self.registry[phase]
            output = definition.handler(case_id=case_id, payload=payload)
            run_id = self.store.save_phase_run(case_id, phase, output)
            results.append(PhaseRunResult(run_id=run_id, phase=phase, payload=output))
        return results
```

Modify `backend/app/services/__init__.py` to export `CaseWorkflowService`.

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_workflow_service.py::test_run_single_phase -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/workflow.py backend/app/services/__init__.py backend/tests/test_workflow_service.py
git commit -m "feat: add workflow orchestration service"
```

---

### Task 5: Add phase handlers (ingestion, preprocess, forensics, parsing, indexing)

**Files:**
- Create: `backend/app/workflow/phases.py`
- Modify: `backend/app/services/ingestion.py`

**Step 1: Write the failing test**

Create `backend/tests/test_workflow_phases.py`:

```python
from backend.app.workflow import phases


def test_ingestion_phase_returns_summary():
    result = phases.run_ingestion(case_id="case-1", payload={})
    assert "summary" in result
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_workflow_phases.py::test_ingestion_phase_returns_summary -v`
Expected: FAIL

**Step 3: Write minimal implementation**

Create `backend/app/workflow/phases.py`:

```python
from __future__ import annotations

from typing import Dict

from ..services.ingestion import IngestionService
from ..services.forensics import ForensicsService
from ..services.graph import GraphService
from ..ingestion.pipeline import IngestionPipeline


def run_ingestion(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    service = IngestionService()
    summary = service.summarize_latest(case_id)
    return {"summary": summary, "graph": {"nodes": 0, "edges": 0}}


def run_preprocess(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    pipeline = IngestionPipeline()
    result = pipeline.preprocess_case(case_id)
    return {"summary": result}


def run_forensics(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    forensics = ForensicsService()
    report = forensics.run_case(case_id)
    return {"summary": report}


def run_parsing_chunking(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    pipeline = IngestionPipeline()
    result = pipeline.parse_and_chunk(case_id)
    return {"summary": result}


def run_indexing(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    pipeline = IngestionPipeline()
    index = pipeline.index_case(case_id)
    return {"summary": index}
```

Modify `backend/app/services/ingestion.py` to expose helper methods used above (e.g., `summarize_latest`, `preprocess_case`, `parse_and_chunk`, `index_case`) that reuse existing logic.

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_workflow_phases.py::test_ingestion_phase_returns_summary -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/workflow/phases.py backend/app/services/ingestion.py backend/tests/test_workflow_phases.py
git commit -m "feat: add ingestion-related workflow phases"
```

---


### Task 6: Expand phase registry to include all phases

**Files:**
- Modify: `backend/app/workflow/registry.py`

**Step 1: Write the failing test**

Update `backend/tests/test_phase_registry.py`:

```python

def test_phase_registry_includes_all_phases():
    registry = get_phase_registry()
    for phase in [
        "ingestion",
        "preprocess",
        "forensics",
        "parsing_chunking",
        "indexing",
        "fact_extraction",
        "timeline",
        "legal_theories",
        "strategy",
        "drafting",
        "qa_review",
    ]:
        assert phase in registry
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_phase_registry.py::test_phase_registry_includes_all_phases -v`
Expected: FAIL

**Step 3: Write minimal implementation**

Modify `backend/app/workflow/registry.py` to add PhaseDefinition entries for all phases with correct Swarms profiles.

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_phase_registry.py::test_phase_registry_includes_all_phases -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/workflow/registry.py backend/tests/test_phase_registry.py
git commit -m "feat: expand phase registry"
```

---


### Task 7: Add phase handlers (fact extraction, timeline, legal theories, strategy, drafting, QA)

**Files:**
- Modify: `backend/app/workflow/phases.py`
- Create: `backend/app/services/fact_extraction.py`
- Create: `backend/app/services/legal_theories.py`
- Create: `backend/app/services/strategy.py`
- Create: `backend/app/services/drafting.py`

**Step 1: Write the failing test**

Create `backend/tests/test_workflow_phase_outputs.py`:

```python
from backend.app.workflow import phases


def test_legal_theories_phase_output():
    result = phases.run_legal_theories(case_id="case-1", payload={})
    assert "theories" in result
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_workflow_phase_outputs.py::test_legal_theories_phase_output -v`
Expected: FAIL

**Step 3: Write minimal implementation**

Extend `backend/app/workflow/phases.py`:

```python
def run_fact_extraction(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    from ..services.fact_extraction import FactExtractionService
    return FactExtractionService().extract(case_id)


def run_timeline(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    from ..services.timeline import TimelineService
    return {"timeline": TimelineService().get_timeline(case_id)}


def run_legal_theories(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    from ..services.legal_theories import LegalTheoryService
    return LegalTheoryService().generate(case_id)


def run_strategy(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    from ..services.strategy import StrategyService
    return StrategyService().recommend(case_id)


def run_drafting(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    from ..services.drafting import DraftingService
    return DraftingService().draft(case_id)


def run_qa_review(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    from ..services.qa_oversight_service import QAOversightService
    return QAOversightService().review(case_id)
```

Create minimal service shells that wrap retrieval + LLM calls using existing `RetrievalService` and `LLMService`.

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_workflow_phase_outputs.py::test_legal_theories_phase_output -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/workflow/phases.py backend/app/services/fact_extraction.py backend/app/services/legal_theories.py backend/app/services/strategy.py backend/app/services/drafting.py backend/tests/test_workflow_phase_outputs.py
git commit -m "feat: add downstream workflow phases"
```

---

### Task 8: Add graph upsert integration

**Files:**
- Modify: `backend/app/services/workflow.py`
- Modify: `backend/app/services/graph.py`

**Step 1: Write the failing test**

Create `backend/tests/test_workflow_graph_upserts.py`:

```python
from backend.app.services.workflow import CaseWorkflowService


def test_workflow_calls_graph_upsert(tmp_path, monkeypatch):
    called = {"count": 0}

    def fake_upsert(*_args, **_kwargs):
        called["count"] += 1

    service = CaseWorkflowService(storage_path=tmp_path)
    service.graph_service.upsert = fake_upsert
    service.run_phases(case_id="case-1", phases=["ingestion"], payload={})
    assert called["count"] == 1
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_workflow_graph_upserts.py::test_workflow_calls_graph_upsert -v`
Expected: FAIL

**Step 3: Write minimal implementation**

Modify `backend/app/services/workflow.py` to call `GraphService.upsert` with per-phase metadata and citations.

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_workflow_graph_upserts.py::test_workflow_calls_graph_upsert -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/workflow.py backend/app/services/graph.py backend/tests/test_workflow_graph_upserts.py
git commit -m "feat: add graph upsert wiring"
```

---

### Task 9: Add workflow API endpoints

**Files:**
- Create: `backend/app/api/workflow.py`
- Modify: `backend/app/main.py`

**Step 1: Write the failing test**

Create `backend/tests/test_workflow_api.py`:

```python
from fastapi.testclient import TestClient
from backend.app.main import app


def test_workflow_run_endpoint():
    client = TestClient(app)
    resp = client.post("/workflow/run", json={"case_id": "case-1", "phases": ["ingestion"], "auto_run": True})
    assert resp.status_code == 200
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_workflow_api.py::test_workflow_run_endpoint -v`
Expected: FAIL with 404

**Step 3: Write minimal implementation**

Create `backend/app/api/workflow.py`:

```python
from fastapi import APIRouter, Depends
from ..models.workflow import WorkflowRunRequest, PhaseRunRequest
from ..services.workflow import CaseWorkflowService
from ..config import settings

router = APIRouter()


def get_workflow_service() -> CaseWorkflowService:
    return CaseWorkflowService(settings.workflow_storage_path)


@router.post("/workflow/run")
async def run_workflow(req: WorkflowRunRequest, service: CaseWorkflowService = Depends(get_workflow_service)):
    phases = req.phases or ["ingestion", "preprocess", "forensics", "parsing_chunking", "indexing", "fact_extraction", "timeline", "legal_theories", "strategy", "drafting", "qa_review"]
    results = service.run_phases(case_id=req.case_id or "default", phases=phases, payload={})
    return {"runs": [r.__dict__ for r in results]}


@router.post("/workflow/phase")
async def run_phase(req: PhaseRunRequest, service: CaseWorkflowService = Depends(get_workflow_service)):
    results = service.run_phases(case_id=req.case_id, phases=req.phases, payload={})
    return {"runs": [r.__dict__ for r in results]}
```

Modify `backend/app/main.py` to include:

```python
from .api import workflow
app.include_router(workflow.router, tags=["Workflow"])
```

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_workflow_api.py::test_workflow_run_endpoint -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/api/workflow.py backend/app/main.py backend/tests/test_workflow_api.py
git commit -m "feat: add workflow API endpoints"
```

---

### Task 10: Hook ingestion to auto-run workflow

**Files:**
- Modify: `backend/app/services/ingestion.py`
- Modify: `backend/app/api/ingestion.py`

**Step 1: Write the failing test**

Create `backend/tests/test_ingestion_auto_workflow.py`:

```python
from backend.app.services.ingestion import IngestionService


def test_ingestion_auto_run_triggers_workflow(monkeypatch):
    called = {"count": 0}

    def fake_run(*_args, **_kwargs):
        called["count"] += 1

    service = IngestionService()
    service.workflow_service = type("X", (), {"run_phases": fake_run})()
    service._after_ingestion(case_id="case-1", auto_run=True, phases=["ingestion"])
    assert called["count"] == 1
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_ingestion_auto_workflow.py::test_ingestion_auto_run_triggers_workflow -v`
Expected: FAIL

**Step 3: Write minimal implementation**

Modify `backend/app/services/ingestion.py` to include `_after_ingestion` and call it at the end of `ingest_sources`.

Modify `backend/app/api/ingestion.py` to pass `case_id`, `auto_run`, and `phases` from `IngestionRequest`.

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_ingestion_auto_workflow.py::test_ingestion_auto_run_triggers_workflow -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/ingestion.py backend/app/api/ingestion.py backend/tests/test_ingestion_auto_workflow.py
git commit -m "feat: trigger workflow after ingestion"
```

---

### Task 11: Frontend API + Workflow UI

**Files:**
- Create: `frontend/src/services/workflow_api.ts`
- Create: `frontend/src/pages/CaseWorkflowPage.tsx`
- Modify: `frontend/src/pages/DashboardPage.tsx`

**Step 1: Write the failing test**

Create `frontend/src/pages/__tests__/CaseWorkflowPage.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import CaseWorkflowPage from "../CaseWorkflowPage";

it("renders workflow controls", () => {
  render(<CaseWorkflowPage />);
  expect(screen.getByText("Case Workflow")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm -C frontend test -- CaseWorkflowPage.test.tsx`
Expected: FAIL with module not found

**Step 3: Write minimal implementation**

Create `frontend/src/services/workflow_api.ts` with `runWorkflow`, `runPhase`, `getWorkflowStatus`.

Create `frontend/src/pages/CaseWorkflowPage.tsx` with list of phases, a Run All button, and per-phase run buttons.

Modify `frontend/src/pages/DashboardPage.tsx` to link to Case Workflow page.

**Step 4: Run test to verify it passes**

Run: `npm -C frontend test -- CaseWorkflowPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/services/workflow_api.ts frontend/src/pages/CaseWorkflowPage.tsx frontend/src/pages/DashboardPage.tsx frontend/src/pages/__tests__/CaseWorkflowPage.test.tsx
git commit -m "feat: add workflow UI"
```

---

### Task 12: Document capabilities + archive mapping

**Files:**
- Modify: `docs/architecture/agentic_systems.md`
- Create: `docs/architecture/workflow_capability_map.md`

**Step 1: Write the failing test**

N/A (doc-only)

**Step 2: Implement**

Create `docs/architecture/workflow_capability_map.md` describing which phase/tool replaces each archived capability (forensics suite, timeline builder, presentation builder, QA teams, etc.).

Update `docs/architecture/agentic_systems.md` with workflow service and phase registry.

**Step 3: Commit**

```bash
git add docs/architecture/agentic_systems.md docs/architecture/workflow_capability_map.md
git commit -m "docs: add workflow capability map"
```

---

### Task 13: Baseline verification

**Step 1: Run backend tests**

Run: `pytest backend/tests/test_workflow_* -v`
Expected: PASS

**Step 2: Run frontend tests**

Run: `npm -C frontend test -- CaseWorkflowPage.test.tsx`
Expected: PASS

**Step 3: Commit**

```bash
git status -sb
```

---

## Execution Choice

Plan complete and saved to `docs/plans/2026-02-05-swarms-hybrid-workflow-implementation.md`.

Two execution options:

1. Subagent-Driven (this session) — I dispatch a fresh subagent per task and review between tasks.
2. Parallel Session (separate) — You open a new session that runs `executing-plans` with checkpoints.

Which approach?
