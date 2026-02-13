from fastapi.testclient import TestClient

from backend.app.main import app


def test_workflow_run_endpoint():
    client = TestClient(app)
    resp = client.post(
        "/workflow/run",
        json={"case_id": "case-1", "phases": ["ingestion"], "auto_run": True},
    )
    assert resp.status_code == 200
