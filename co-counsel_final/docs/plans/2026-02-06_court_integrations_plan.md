# Court Integrations Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a compliant court integrations foundation with connectors, payment ledger, API surface, and settings/UI wiring.

**Architecture:** Add provider connectors (PACER/UniCourt/LACS) behind a shared interface, a payment ledger for paid retrievals, and an orchestration service that feeds ingestion + graph/timeline pipelines.

**Tech Stack:** FastAPI, Pydantic, asyncio/httpx, React (Vite), existing settings store, existing ingestion/graph services.

---

### Task 1: Add settings + config model support

**Files:**
- Modify: `backend/app/config.py`
- Modify: `backend/app/models/api.py`
- Modify: `backend/app/services/settings.py`
- Modify: `frontend/src/types.ts`

**Step 1: Write the failing test**

Create `backend/tests/test_settings_court_credentials.py`:
```python
import os
import tempfile
import unittest

from backend.app.models.api import CredentialSettingsUpdate
from backend.app.services.settings import SettingsService


class SettingsCourtCredentialsTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        os.environ["SETTINGS_STORE_PATH"] = os.path.join(self.temp_dir.name, "settings.json")
        os.environ["MANIFEST_ENCRYPTION_KEY_PATH"] = os.path.join(self.temp_dir.name, "settings.key")

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_snapshot_includes_court_services(self):
        service = SettingsService()
        response = service.snapshot()
        self.assertIn("pacer", response.credentials.services)
        self.assertIn("unicourt", response.credentials.services)
        self.assertIn("lacs", response.credentials.services)

    def test_update_accepts_court_credentials(self):
        service = SettingsService()
        payload = CredentialSettingsUpdate(
            pacer_api_key="pacer-token",
            unicourt_api_key="uni-token",
            lacs_api_key="lacs-token",
        )
        response = service.update(payload=payload)
        self.assertTrue(response.credentials.services["pacer"])
        self.assertTrue(response.credentials.services["unicourt"])
        self.assertTrue(response.credentials.services["lacs"])
```

**Step 2: Run test to verify it fails**

Run: `python -m unittest backend.tests.test_settings_court_credentials -v`
Expected: FAIL (unknown fields or missing services keys)

**Step 3: Write minimal implementation**

- Extend `CredentialSettingsUpdate` with `pacer_api_key`, `unicourt_api_key`, `lacs_api_key`.
- Update `SettingsService._build_response` to include service readiness for these.
- Update `_apply_credential_update` to store the new secrets.
- Add runtime config defaults for API base URLs in `Settings` if needed.
- Update `frontend/src/types.ts` to include the new credentials fields.

**Step 4: Run test to verify it passes**

Run: `python -m unittest backend.tests.test_settings_court_credentials -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/config.py backend/app/models/api.py backend/app/services/settings.py backend/tests/test_settings_court_credentials.py frontend/src/types.ts

git commit -m "feat: add court credentials to settings"
```

---

### Task 2: Payment ledger (append-only)

**Files:**
- Create: `backend/app/storage/court_payment_ledger.py`
- Modify: `backend/app/config.py`
- Test: `backend/tests/test_court_payment_ledger.py`

**Step 1: Write the failing test**

```python
import tempfile
import unittest
from pathlib import Path

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
```

**Step 2: Run test to verify it fails**

Run: `python -m unittest backend.tests.test_court_payment_ledger -v`
Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

Implement a hash‑chained JSONL ledger similar to `AuditTrail`:
- `PaymentEvent` dataclass
- `CourtPaymentLedger.append()` and `verify()`
- Add config `court_payment_ledger_path` (default `storage/court_payments/ledger.jsonl`)

**Step 4: Run test to verify it passes**

Run: `python -m unittest backend.tests.test_court_payment_ledger -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/config.py backend/app/storage/court_payment_ledger.py backend/tests/test_court_payment_ledger.py

git commit -m "feat: add court payment ledger"
```

---

### Task 3: Court connector interfaces + provider stubs

**Files:**
- Create: `backend/app/services/court_connectors/base.py`
- Create: `backend/app/services/court_connectors/pacer.py`
- Create: `backend/app/services/court_connectors/unicourt.py`
- Create: `backend/app/services/court_connectors/lacs.py`
- Test: `backend/tests/test_court_connectors.py`

**Step 1: Write the failing test**

```python
import unittest

from backend.app.services.court_connectors.pacer import PacerConnector


class CourtConnectorTests(unittest.TestCase):
    def test_connector_requires_credentials(self):
        connector = PacerConnector(api_key=None, base_url="https://example")
        with self.assertRaises(ValueError):
            connector.ensure_ready()
```

**Step 2: Run test to verify it fails**

Run: `python -m unittest backend.tests.test_court_connectors -v`
Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

- `CourtConnector` protocol with `ensure_ready`, `search`, `fetch_case`, `fetch_document`, `fetch_calendar`.
- Provider stubs raise clear `ValueError` if no key; otherwise return placeholder structures.

**Step 4: Run test to verify it passes**

Run: `python -m unittest backend.tests.test_court_connectors -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/court_connectors backend/tests/test_court_connectors.py

git commit -m "feat: add court connector stubs"
```

---

### Task 4: Court integration service (orchestration)

**Files:**
- Create: `backend/app/services/court_integration.py`
- Modify: `backend/app/services/ingestion.py` (if new entry point needed)
- Test: `backend/tests/test_court_integration.py`

**Step 1: Write the failing test**

```python
import unittest

from backend.app.services.court_integration import CourtIntegrationService


class CourtIntegrationTests(unittest.TestCase):
    def test_provider_status_contains_expected_keys(self):
        service = CourtIntegrationService()
        status = service.provider_status()
        self.assertIn("pacer", status)
        self.assertIn("unicourt", status)
        self.assertIn("lacs", status)
```

**Step 2: Run test to verify it fails**

Run: `python -m unittest backend.tests.test_court_integration -v`
Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

- Provide `provider_status()` to show readiness and last sync.
- Provide `search()` and `fetch_document()` stubs wired to connectors.
- Wire in payment ledger hooks for paid retrievals.

**Step 4: Run test to verify it passes**

Run: `python -m unittest backend.tests.test_court_integration -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/court_integration.py backend/tests/test_court_integration.py

git commit -m "feat: add court integration service"
```

---

### Task 5: API endpoints

**Files:**
- Create: `backend/app/api/courts.py`
- Modify: `backend/app/main.py` (router registration)
- Modify: `backend/app/models/api.py` (request/response models)
- Test: `backend/tests/test_court_api.py`

**Step 1: Write the failing test**

```python
import unittest

from fastapi.testclient import TestClient
from backend.app.main import app


class CourtApiTests(unittest.TestCase):
    def test_court_provider_status(self):
        client = TestClient(app)
        response = client.get("/courts/providers")
        self.assertIn(response.status_code, (200, 401, 403))
```

**Step 2: Run test to verify it fails**

Run: `python -m unittest backend.tests.test_court_api -v`
Expected: FAIL (404)

**Step 3: Write minimal implementation**

- Add provider status endpoint.
- Add search + fetch endpoints returning structured payloads (even if stubbed).
- Add payment authorize endpoint that records ledger entries.

**Step 4: Run test to verify it passes**

Run: `python -m unittest backend.tests.test_court_api -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/api/courts.py backend/app/main.py backend/app/models/api.py backend/tests/test_court_api.py

git commit -m "feat: add court integration api"
```

---

### Task 6: Frontend settings + Court Data panel

**Files:**
- Modify: `frontend/src/components/SettingsPanel.tsx`
- Create: `frontend/src/components/CourtDataPanel.tsx`
- Modify: `frontend/src/App.tsx`
- Test: `frontend/src/components/__tests__/CourtDataPanel.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import CourtDataPanel from '../CourtDataPanel';

test('shows provider readiness badges', () => {
  render(<CourtDataPanel />);
  expect(screen.getByText(/PACER/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- CourtDataPanel`
Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

- Add credential fields for pacer/unicourt/lacs in Settings.
- Add Court Data panel to show readiness + pending paid items.

**Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test -- CourtDataPanel`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/SettingsPanel.tsx frontend/src/components/CourtDataPanel.tsx frontend/src/components/__tests__/CourtDataPanel.test.tsx frontend/src/App.tsx

git commit -m "feat: add court data panel"
```

---

### Task 7: Documentation

**Files:**
- Modify: `docs/ROADMAP.md`
- Modify: `docs/runbooks/OPERATIONS.md`
- Modify: `docs/architecture/agentic_systems.md`

**Step 1: Write doc changes**
- Add Court integration section with compliance disclaimers.
- Update runbooks with payment ledger path and API key handling.

**Step 2: Commit**

```bash
git add docs/ROADMAP.md docs/runbooks/OPERATIONS.md docs/architecture/agentic_systems.md

git commit -m "docs: court integrations foundation"
```
