from fastapi.testclient import TestClient

from backend.app.main import app


ALLOWED_STATUS_CODES = {200, 401, 403}


def test_graph_overview_defaults():
    client = TestClient(app)
    response = client.get("/graph/overview")
    assert response.status_code in ALLOWED_STATUS_CODES


def test_graph_search_defaults():
    client = TestClient(app)
    response = client.get("/graph/search", params={"query": "contract"})
    assert response.status_code in ALLOWED_STATUS_CODES


def test_graph_overview_case_id_param():
    client = TestClient(app)
    response = client.get("/graph/overview", params={"case_id": "CASE-123"})
    assert response.status_code in ALLOWED_STATUS_CODES
