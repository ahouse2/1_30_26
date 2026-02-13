from __future__ import annotations

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.app.storage.workflow_run_store import WorkflowRunStore


def test_workflow_run_store_creates_run(tmp_path: Path) -> None:
    store = WorkflowRunStore(base_path=tmp_path)
    run = store.create_run(case_id="case-1", phases=["ingestion", "timeline"])
    assert run["run_id"]
    assert run["status"] == "queued"

    loaded = store.get_run("case-1", run["run_id"])
    assert loaded["phases"][0]["phase"] == "ingestion"


def test_workflow_run_store_events_round_trip(tmp_path: Path) -> None:
    store = WorkflowRunStore(base_path=tmp_path)
    run = store.create_run(case_id="case-1", phases=["ingestion"])
    store.append_event("case-1", run["run_id"], "run_started", {"case_id": "case-1"})
    events, cursor = store.read_events("case-1", run["run_id"], since=0)
    assert events
    assert cursor >= 1
