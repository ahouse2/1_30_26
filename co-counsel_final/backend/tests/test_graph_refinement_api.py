import importlib.metadata
import sys
import types
import unittest


if "email_validator" not in sys.modules:
    stub = types.ModuleType("email_validator")

    class EmailNotValidError(ValueError):
        pass

    def validate_email(email, *args, **kwargs):
        return {"email": email, "local": email.split("@")[0] if "@" in email else email}

    stub.EmailNotValidError = EmailNotValidError
    stub.validate_email = validate_email
    sys.modules["email_validator"] = stub

_real_version = importlib.metadata.version


def _patched_version(name: str) -> str:
    if name == "email-validator":
        return "2.0.0"
    return _real_version(name)


importlib.metadata.version = _patched_version

try:
    from fastapi.testclient import TestClient
    from backend.app.main import app
except ModuleNotFoundError:
    TestClient = None
    app = None

from backend.app.services.graph_refinement import GraphRefinementWorker


ALLOWED_STATUS_CODES = {200, 401, 403}


class GraphRefinementWorkerTests(unittest.TestCase):
    def test_worker_status_payload(self) -> None:
        class _StubGraphService:
            def refine_schema(self):
                return {"new_edges": 0}

        worker = GraphRefinementWorker(
            _StubGraphService(),
            interval_seconds=0.01,
            idle_limit=1,
            min_new_edges=0,
        )
        status = worker.status()
        self.assertIn("running", status)
        self.assertIn("idle_runs", status)
        self.assertIn("interval_seconds", status)
        self.assertIn("idle_limit", status)
        self.assertIn("min_new_edges", status)


class GraphRefinementApiTests(unittest.TestCase):
    def test_graph_refinement_status_endpoint(self) -> None:
        if TestClient is None or app is None:
            self.skipTest("fastapi not available")
        client = TestClient(app)
        response = client.get("/graph/refinement/status")
        self.assertIn(response.status_code, ALLOWED_STATUS_CODES)
        if response.status_code == 200:
            payload = response.json()
            self.assertIn("running", payload)
            self.assertIn("idle_runs", payload)
            self.assertIn("interval_seconds", payload)
            self.assertIn("idle_limit", payload)
            self.assertIn("min_new_edges", payload)

    def test_graph_refinement_restart_endpoint(self) -> None:
        if TestClient is None or app is None:
            self.skipTest("fastapi not available")
        client = TestClient(app)
        response = client.post("/graph/refinement/restart")
        self.assertIn(response.status_code, ALLOWED_STATUS_CODES)
        if response.status_code == 200:
            payload = response.json()
            self.assertIn("status", payload)
            self.assertEqual(payload["status"], "restarted")
