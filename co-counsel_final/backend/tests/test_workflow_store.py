from pathlib import Path

from backend.app.storage.workflow_store import WorkflowStore


def test_workflow_store_round_trip(tmp_path):
    store = WorkflowStore(base_path=tmp_path)
    run_id = store.save_phase_run("case-1", "ingestion", {"ok": True})
    record = store.get_phase_run("case-1", run_id)
    assert record["payload"]["ok"] is True

def test_workflow_store_renders_markdown(tmp_path):
    store = WorkflowStore(base_path=tmp_path)
    run_id = store.save_phase_run("case-1", "ingestion", {"ok": True})
    artifacts = store.save_artifacts("case-1", run_id, {"ok": True})
    md_path = next(item for item in artifacts if item["format"] == "md")["path"]
    content = Path(md_path).read_text()
    assert "# Phase Output" in content
    assert "\n" in content
