import unittest

try:
    from fastapi.testclient import TestClient
    from backend.app.main import app
except ModuleNotFoundError:
    TestClient = None
    app = None


class SettingsModelRefreshTests(unittest.TestCase):
    def test_refresh_endpoint(self) -> None:
        if TestClient is None or app is None:
            self.skipTest("fastapi not available")
        client = TestClient(app)
        response = client.post("/settings/models/refresh", json={"provider_id": "openrouter"})
        self.assertIn(response.status_code, {200, 401, 403})
