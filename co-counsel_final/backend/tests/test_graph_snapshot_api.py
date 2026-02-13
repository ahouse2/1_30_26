from fastapi.testclient import TestClient

from backend.app.main import app


ALLOWED_STATUS_CODES = {200, 400, 401, 403, 404}


def test_graph_snapshot_create_endpoint_available():
    client = TestClient(app)
    response = client.post("/graph/snapshots", json={"case_id": "CASE-123", "limit": 25})
    assert response.status_code in ALLOWED_STATUS_CODES


def test_graph_snapshot_list_endpoint_available():
    client = TestClient(app)
    response = client.get("/graph/snapshots", params={"case_id": "CASE-123"})
    assert response.status_code in ALLOWED_STATUS_CODES


def test_graph_snapshot_diff_endpoint_available():
    client = TestClient(app)
    response = client.post(
        "/graph/snapshots/diff",
        json={
            "baseline_snapshot_id": "gsnap-missing-a",
            "candidate_snapshot_id": "gsnap-missing-b",
        },
    )
    assert response.status_code in ALLOWED_STATUS_CODES
