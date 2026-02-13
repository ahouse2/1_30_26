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

if "opentelemetry" not in sys.modules:
    otel = types.ModuleType("opentelemetry")
    otel.metrics = types.ModuleType("opentelemetry.metrics")
    otel.trace = types.ModuleType("opentelemetry.trace")
    class _StatusCode:
        OK = 0
        ERROR = 1
    class _Status:
        def __init__(self, status_code=None, description=None):
            self.status_code = status_code
            self.description = description
    otel.trace.Status = _Status
    otel.trace.StatusCode = _StatusCode
    sys.modules["opentelemetry"] = otel
    sys.modules["opentelemetry.metrics"] = otel.metrics
    sys.modules["opentelemetry.trace"] = otel.trace

# Stub heavy services imported at module load time in workflow.phases.
if "backend.app.services.forensics" not in sys.modules:
    forensics_stub = types.ModuleType("backend.app.services.forensics")

    class ForensicsService:
        def run_case(self, case_id):
            return {}

    forensics_stub.ForensicsService = ForensicsService
    sys.modules["backend.app.services.forensics"] = forensics_stub

if "backend.app.services.ingestion" not in sys.modules:
    ingestion_stub = types.ModuleType("backend.app.services.ingestion")

    class IngestionService:
        def summarize_latest(self, case_id):
            return {}

        def preprocess_case(self, case_id):
            return {}

        def parse_and_chunk(self, case_id):
            return {}

        def index_case(self, case_id):
            return {}

    ingestion_stub.IngestionService = IngestionService
    sys.modules["backend.app.services.ingestion"] = ingestion_stub

from backend.app.workflow.registry import get_phase_registry
from backend.app.workflow import phases


class CourtSyncPhaseTests(unittest.TestCase):
    def test_registry_includes_court_sync(self):
        registry = get_phase_registry()
        self.assertIn("court_sync", registry)

    def test_court_sync_returns_provider_status(self):
        result = phases.run_court_sync("case-1", {})
        self.assertIn("providers", result)
