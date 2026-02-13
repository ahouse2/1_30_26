import importlib.metadata
import sys
import tempfile
import types
import unittest
from pathlib import Path


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

from backend.app.storage.evidence_binder_store import EvidenceBinderStore


class EvidenceBinderStoreTests(unittest.TestCase):
    def test_binder_round_trip(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = EvidenceBinderStore(Path(temp_dir))
            binder = store.create_binder(name="Trial Exhibits", description="Demo")
            self.assertEqual(binder["name"], "Trial Exhibits")

            updated = store.add_item(
                binder_id=binder["id"],
                item={"document_id": "doc-1", "name": "Photo"},
            )
            self.assertEqual(len(updated["items"]), 1)

            fetched = store.get_binder(binder["id"])
            self.assertEqual(fetched["id"], binder["id"])

            all_binders = store.list_binders()
            self.assertEqual(len(all_binders), 1)
