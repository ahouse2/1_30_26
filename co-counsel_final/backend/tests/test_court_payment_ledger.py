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

from backend.app.storage.court_payment_ledger import CourtPaymentLedger, PaymentEvent


class CourtPaymentLedgerTests(unittest.TestCase):
    def test_payment_ledger_appends_and_verifies(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            ledger_path = Path(temp_dir) / "payments.jsonl"
            ledger = CourtPaymentLedger(ledger_path)
            event = PaymentEvent(
                provider="unicourt",
                case_id="case-123",
                docket_id="docket-1",
                document_id="doc-9",
                event_type="intent",
                amount_estimate=12.5,
                currency="USD",
                requested_by="tester",
            )
            ledger.append(event)
            self.assertTrue(ledger.verify())
