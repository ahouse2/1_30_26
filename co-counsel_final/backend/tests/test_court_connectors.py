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

from backend.app.services.court_connectors.caselaw import CaseLawConnector
from backend.app.services.court_connectors.courtlistener import CourtListenerConnector
from backend.app.services.court_connectors.pacer import PacerConnector


class CourtConnectorTests(unittest.TestCase):
    def test_pacer_requires_endpoint(self):
        connector = PacerConnector(api_key="token", base_url=None)
        with self.assertRaises(ValueError):
            connector.ensure_ready()

    def test_pacer_allows_keyless_endpoint_mode(self):
        connector = PacerConnector(api_key=None, base_url="https://example")
        connector.ensure_ready()

    def test_caselaw_allows_keyless_endpoint_mode(self):
        connector = CaseLawConnector(api_key=None, base_url="https://example")
        connector.ensure_ready()

    def test_courtlistener_requires_token(self):
        connector = CourtListenerConnector(token=None, base_url="https://example")
        with self.assertRaises(ValueError):
            connector.ensure_ready()
