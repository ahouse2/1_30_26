from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from backend.app.services.parity_ops import ParityOpsService


class _FakeCitation:
    def __init__(self, citation_id: str) -> None:
        self.citation_id = citation_id

    def to_dict(self) -> dict:
        return {"citation_id": self.citation_id}


class _FakeRetrievalService:
    def query(self, question: str, page_size: int = 8) -> SimpleNamespace:
        return SimpleNamespace(
            answer=f"retrieval-context::{question}::{page_size}",
            citations=[_FakeCitation("cit-1"), _FakeCitation("cit-2")],
        )


class _FakeTimelineService:
    def list_events(self, limit: int = 10) -> SimpleNamespace:
        events = [
            SimpleNamespace(summary="Deposition complete"),
            SimpleNamespace(summary="Motion hearing"),
        ]
        return SimpleNamespace(events=events[:limit])


class _FakeLlmService:
    def generate_text(self, prompt: str) -> str:
        return f"generated::{prompt[:120]}"


class _FakePrivilegeService:
    def classify(self, document_id: str, text: str, metadata: dict | None = None) -> SimpleNamespace:
        return SimpleNamespace(
            label="not_privileged",
            score=0.11,
            explanation="No attorney-client markers detected.",
            signals=[],
        )


class ParityOpsServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tempdir = tempfile.TemporaryDirectory()
        patchers = [
            patch("backend.app.services.parity_ops.get_settings", return_value=SimpleNamespace(workflow_storage_path=Path(self._tempdir.name))),
            patch("backend.app.services.parity_ops.get_retrieval_service", return_value=_FakeRetrievalService()),
            patch("backend.app.services.parity_ops.get_timeline_service", return_value=_FakeTimelineService()),
            patch("backend.app.services.parity_ops.get_llm_service", return_value=_FakeLlmService()),
            patch("backend.app.services.parity_ops.get_privilege_classifier_service", return_value=_FakePrivilegeService()),
        ]
        self._patchers = patchers
        for patcher in patchers:
            patcher.start()
            self.addCleanup(patcher.stop)
        self.addCleanup(self._tempdir.cleanup)
        self.service = ParityOpsService()

    def test_get_parity_matrix_summary(self) -> None:
        matrix = self.service.get_parity_matrix()
        self.assertIn("summary", matrix)
        self.assertIn("items", matrix)
        self.assertGreater(matrix["summary"]["implemented"], 0)
        self.assertGreater(matrix["summary"]["score"], 0)

    def test_list_legacy_workflows_contains_expected(self) -> None:
        workflows = self.service.list_legacy_workflows()
        workflow_ids = {item["workflow_id"] for item in workflows}
        self.assertIn("deposition_prep", workflow_ids)
        self.assertIn("trial_preparation", workflow_ids)

    def test_run_legacy_workflow_returns_payload(self) -> None:
        result = self.service.run_legacy_workflow(
            case_id="case-123",
            workflow_id="discovery_production",
            prompt="Need matrix by custodian",
        )
        self.assertEqual(result["workflow_id"], "discovery_production")
        payload = result["payload"]
        self.assertIn("production_plan", payload)
        self.assertIn("citations", payload)
        self.assertGreaterEqual(len(payload["citations"]), 1)

    def test_run_legacy_workflow_invalid_id(self) -> None:
        with self.assertRaises(ValueError):
            self.service.run_legacy_workflow(
                case_id="case-123",
                workflow_id="unknown-workflow",
                prompt="",
            )


if __name__ == "__main__":
    unittest.main()
