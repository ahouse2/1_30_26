# Provider Streaming + Live Model Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add OpenRouter/LocalAI/LM Studio provider support with server-side model refresh, UI model selection, and streaming-compatible LLM execution.

**Architecture:** Extend provider catalog/registry/config for new providers, introduce a provider model refresh service with caching, add a refresh API endpoint, extend LLM services with streaming hooks, and wire a `/query/stream` WebSocket endpoint to feed the existing chat UI.

**Tech Stack:** FastAPI, Pydantic, httpx, React, Vite, WebSocket.

---

### Task 1: Register new providers in catalog + registry

**Files:**
- Modify: `backend/app/providers/catalog.py`
- Modify: `backend/app/providers/catalog.json`
- Modify: `backend/app/providers/registry.py`
- Modify: `backend/app/config.py`
- Test: `backend/tests/test_provider_catalog.py`

**Step 1: Write the failing test**

Create `backend/tests/test_provider_catalog.py`:
```python
from backend.app.providers.catalog import MODEL_CATALOG, ProviderCapability
from backend.app.providers.registry import get_provider_registry


def test_model_catalog_contains_new_providers():
    assert "openrouter" in MODEL_CATALOG
    assert "localai" in MODEL_CATALOG
    assert "lmstudio" in MODEL_CATALOG


def test_provider_registry_resolves_new_providers():
    registry = get_provider_registry(
        primary_provider="openrouter",
        secondary_provider="localai",
        api_base_urls={"openrouter": "https://openrouter.ai/api/v1", "localai": "http://localhost:8080/v1"},
        runtime_paths={},
    )
    resolution = registry.resolve(ProviderCapability.CHAT)
    assert resolution.provider.provider_id in {"openrouter", "localai"}
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_provider_catalog.py -v`
Expected: FAIL (providers not registered).

**Step 3: Write minimal implementation**
- Add provider entries for `openrouter`, `localai`, `lmstudio` in `MODEL_CATALOG` and `backend/app/providers/catalog.json`.
- Add provider adapters in `backend/app/providers/registry.py`.
- Add default base URLs in `backend/app/config.py` (overrideable).

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_provider_catalog.py -v`
Expected: PASS.

**Step 5: Commit**
```bash
git add backend/app/providers/catalog.py backend/app/providers/catalog.json backend/app/providers/registry.py backend/app/config.py backend/tests/test_provider_catalog.py
# git commit -m "feat: register openrouter/localai/lmstudio providers"
```

---

### Task 2: Add provider model refresh service (server-side)

**Files:**
- Create: `backend/app/services/provider_models.py`
- Modify: `backend/app/services/settings.py`
- Test: `backend/tests/test_provider_model_refresh.py`

**Step 1: Write the failing test**

Create `backend/tests/test_provider_model_refresh.py`:
```python
import httpx
from backend.app.services.provider_models import ProviderModelRefreshService


def test_refresh_models_openai_compatible():
    def handler(request):
        return httpx.Response(200, json={"data": [{"id": "model-a"}, {"id": "model-b"}]})

    transport = httpx.MockTransport(handler)
    service = ProviderModelRefreshService(client=httpx.Client(transport=transport))
    models = service.refresh("openrouter", base_url="https://openrouter.ai/api/v1")
    assert [m.model_id for m in models] == ["model-a", "model-b"]
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_provider_model_refresh.py -v`
Expected: FAIL (service missing).

**Step 3: Write minimal implementation**
- Implement `ProviderModelRefreshService` with:
  - `refresh(provider_id, base_url, api_key=None)`
  - OpenAI-compatible `/models` fetch.
  - Short TTL cache (e.g., 10 minutes).
- Update `SettingsService.model_catalog()` to merge refreshed models if available.

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_provider_model_refresh.py -v`
Expected: PASS.

**Step 5: Commit**
```bash
git add backend/app/services/provider_models.py backend/app/services/settings.py backend/tests/test_provider_model_refresh.py
# git commit -m "feat: add provider model refresh service"
```

---

### Task 3: Add settings API refresh endpoint

**Files:**
- Modify: `backend/app/api/settings.py`
- Modify: `backend/app/models/api.py`
- Test: `backend/tests/test_settings_model_refresh.py`

**Step 1: Write the failing test**

Create `backend/tests/test_settings_model_refresh.py`:
```python
import unittest

try:
    from fastapi.testclient import TestClient
    from backend.app.main import app
except ModuleNotFoundError:
    TestClient = None
    app = None


class SettingsModelRefreshTests(unittest.TestCase):
    def test_refresh_endpoint(self):
        if TestClient is None or app is None:
            self.skipTest("fastapi not available")
        client = TestClient(app)
        response = client.post("/settings/models/refresh", json={"provider_id": "openrouter"})
        self.assertIn(response.status_code, {200, 401, 403})
```

**Step 2: Run test to verify it fails**

Run: `python -m unittest backend.tests.test_settings_model_refresh -v`
Expected: FAIL (endpoint missing).

**Step 3: Write minimal implementation**
- Add `SettingsModelRefreshRequest/Response` to `backend/app/models/api.py`.
- Add `POST /settings/models/refresh` endpoint returning refreshed `ModelCatalogResponse`.

**Step 4: Run test to verify it passes**

Run: `python -m unittest backend.tests.test_settings_model_refresh -v`
Expected: PASS or skipped if fastapi missing.

**Step 5: Commit**
```bash
git add backend/app/api/settings.py backend/app/models/api.py backend/tests/test_settings_model_refresh.py
# git commit -m "feat: add settings model refresh endpoint"
```

---

### Task 4: Extend LLM services with streaming hooks

**Files:**
- Modify: `backend/app/services/llm_service.py`
- Test: `backend/tests/test_llm_streaming.py`

**Step 1: Write the failing test**

Create `backend/tests/test_llm_streaming.py`:
```python
from backend.app.services.llm_service import BaseLlmService, LlmResponse


class DummyService(BaseLlmService):
    provider_id = "dummy"
    def generate_text(self, prompt: str, **kwargs):
        return "hello world"
    async def agenerate_text(self, prompt: str, **kwargs):
        return "hello world"


def test_streaming_fallback_chunks():
    service = DummyService(model="dummy")
    chunks = list(service.stream_text("hello world", chunk_size=5))
    assert chunks == ["hello", " worl", "d"]
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_llm_streaming.py -v`
Expected: FAIL (stream_text missing).

**Step 3: Write minimal implementation**
- Add `stream_text()` / `astream_text()` to `BaseLlmService` with a chunked fallback.
- Implement native streaming for OpenAI-compatible and Ollama (if available), falling back to chunking for HuggingFace.

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_llm_streaming.py -v`
Expected: PASS.

**Step 5: Commit**
```bash
git add backend/app/services/llm_service.py backend/tests/test_llm_streaming.py
# git commit -m "feat: add streaming hooks to llm service"
```

---

### Task 5: Add `/query/stream` WebSocket endpoint

**Files:**
- Create: `backend/app/api/query_stream.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_query_stream.py`

**Step 1: Write the failing test**

Create `backend/tests/test_query_stream.py`:
```python
import unittest

try:
    from fastapi.testclient import TestClient
    from backend.app.main import app
except ModuleNotFoundError:
    TestClient = None
    app = None


class QueryStreamTests(unittest.TestCase):
    def test_query_stream_exists(self):
        if TestClient is None or app is None:
            self.skipTest("fastapi not available")
        client = TestClient(app)
        with client.websocket_connect("/query/stream") as websocket:
            websocket.send_json({"query": "test"})
            message = websocket.receive_json()
            assert "type" in message
```

**Step 2: Run test to verify it fails**

Run: `python -m unittest backend.tests.test_query_stream -v`
Expected: FAIL (endpoint missing).

**Step 3: Write minimal implementation**
- Add WebSocket endpoint that reads JSON payload, calls retrieval service, and streams JSON `token`/`done` events using `RetrievalService.stream_result`.

**Step 4: Run test to verify it passes**

Run: `python -m unittest backend.tests.test_query_stream -v`
Expected: PASS or skipped if fastapi missing.

**Step 5: Commit**
```bash
git add backend/app/api/query_stream.py backend/app/main.py backend/tests/test_query_stream.py
# git commit -m "feat: add query streaming endpoint"
```

---

### Task 6: Update Settings UI for refresh + base URL overrides

**Files:**
- Modify: `frontend/src/utils/apiClient.ts`
- Modify: `frontend/src/context/SettingsContext.tsx`
- Modify: `frontend/src/components/SettingsPanel.tsx`
- Modify: `frontend/src/types.ts`
- Test: `frontend/src/components/__tests__/SettingsPanel.test.tsx`

**Step 1: Write the failing test**

Create `frontend/src/components/__tests__/SettingsPanel.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { SettingsPanel } from '../SettingsPanel';

it('shows refresh models control', () => {
  render(<SettingsPanel />);
  expect(screen.getByText(/Refresh models/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- SettingsPanel`
Expected: FAIL (button missing).

**Step 3: Write minimal implementation**
- Add `refreshModelCatalog` API call.
- Add refresh button per provider in Settings UI.
- Add editable base URL fields per provider and persist in settings updates.

**Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test -- SettingsPanel`
Expected: PASS.

**Step 5: Commit**
```bash
git add frontend/src/utils/apiClient.ts frontend/src/context/SettingsContext.tsx frontend/src/components/SettingsPanel.tsx frontend/src/types.ts frontend/src/components/__tests__/SettingsPanel.test.tsx
# git commit -m "feat: add provider refresh + base url overrides in settings"
```

---

## Execution Options
Plan complete and saved to `docs/plans/2026-02-07_provider_streaming_refresh_plan.md`.

Two execution options:
1) **Subagent-Driven (this session)** – execute each task in order with checkpoints.
2) **Parallel Session (separate)** – open a new session and run the plan with `executing-plans`.

Which approach?
