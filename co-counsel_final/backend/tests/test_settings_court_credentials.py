import importlib.metadata
import os
import sys
import tempfile
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

from backend.app.config import reset_settings_cache
from backend.app.models.api import CredentialSettingsUpdate, SettingsUpdateRequest
from backend.app.services.settings import SettingsService


class SettingsCourtCredentialsTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        os.environ["SETTINGS_STORE_PATH"] = os.path.join(self.temp_dir.name, "settings.json")
        key_path = os.path.join(self.temp_dir.name, "settings.key")
        with open(key_path, "wb") as handle:
            handle.write(os.urandom(32))
        os.environ["MANIFEST_ENCRYPTION_KEY_PATH"] = key_path
        reset_settings_cache()

    def tearDown(self):
        self.temp_dir.cleanup()
        reset_settings_cache()

    def test_snapshot_includes_court_services(self):
        service = SettingsService()
        response = service.snapshot()
        self.assertIn("pacer", response.credentials.services)
        self.assertIn("unicourt", response.credentials.services)
        self.assertIn("lacs", response.credentials.services)
        self.assertIn("caselaw", response.credentials.services)
        self.assertIn("leginfo", response.credentials.services)
        self.assertTrue(response.credentials.services["leginfo"])

    def test_update_accepts_court_credentials(self):
        service = SettingsService()
        payload = CredentialSettingsUpdate(
            pacer_api_key="pacer-token",
            unicourt_api_key="uni-token",
            lacs_api_key="lacs-token",
            caselaw_api_key="case-token",
        )
        response = service.update(payload=SettingsUpdateRequest(credentials=payload))
        self.assertTrue(response.credentials.services["pacer"])
        self.assertTrue(response.credentials.services["unicourt"])
        self.assertTrue(response.credentials.services["lacs"])
        self.assertTrue(response.credentials.services["caselaw"])
