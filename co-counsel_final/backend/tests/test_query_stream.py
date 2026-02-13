import unittest

try:
    from fastapi.testclient import TestClient
    from backend.app.main import app
except ModuleNotFoundError:
    TestClient = None
    app = None


class QueryStreamTests(unittest.TestCase):
    def test_query_stream_exists(self) -> None:
        if TestClient is None or app is None:
            self.skipTest("fastapi not available")
        client = TestClient(app)
        with client.websocket_connect("/query/stream") as websocket:
            websocket.send_json({"query": "test"})
            message = websocket.receive_json()
            self.assertIn("type", message)
