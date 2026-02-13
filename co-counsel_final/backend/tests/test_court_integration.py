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

from backend.app.services.court_integration import CourtIntegrationService


class CourtIntegrationTests(unittest.TestCase):
    def test_provider_status_contains_expected_keys(self):
        service = CourtIntegrationService()
        status = service.provider_status()
        self.assertIn("courtlistener", status)
        self.assertIn("caselaw", status)
        self.assertIn("pacer", status)
        self.assertIn("unicourt", status)
        self.assertIn("lacs", status)
        self.assertIn("leginfo", status)
