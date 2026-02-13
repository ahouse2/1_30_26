from __future__ import annotations

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.app.services.workflow import PhaseRunResult
from backend.app.services.workflow_runner import WorkflowRunner
from backend.app.storage.workflow_run_store import WorkflowRunStore


class DummyWorkflowService:
    def run_phases(self, case_id: str, phases: list[str], payload: dict) -> list[PhaseRunResult]:
        return [
            PhaseRunResult(
                run_id="phase-1",
                phase=phases[0],
                payload={"graph_delta": {"new_nodes": 1, "new_edges": 2}},
                artifacts=[],
            )
        ]


def test_workflow_runner_executes_run_inline(tmp_path: Path) -> None:
    store = WorkflowRunStore(base_path=tmp_path)
    runner = WorkflowRunner(
        run_store=store,
        workflow_service_factory=lambda: DummyWorkflowService(),
    )
    run = runner.create_run(case_id="case-1", phases=["ingestion"])
    runner.execute_run(run["run_id"])

    state = store.get_run("case-1", run["run_id"])
    assert state["status"] == "succeeded"
    assert state["phases"][0]["status"] == "succeeded"
