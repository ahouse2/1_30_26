from backend.app.services.workflow import CaseWorkflowService


def test_workflow_calls_graph_upsert(tmp_path, monkeypatch):
    called = {"count": 0}

    def fake_upsert(*_args, **_kwargs):
        called["count"] += 1

    service = CaseWorkflowService(storage_path=tmp_path)
    service.graph_service.upsert_payload = fake_upsert
    service.run_phases(case_id="case-1", phases=["ingestion"], payload={})
    assert called["count"] == 1
