# 3D Graph Explorer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a 3D knowledge graph explorer with case-aware overview, search, and expansion wired to the existing graph service.

**Architecture:** Extend graph API with overview + search endpoints, add case-aware graph selection, and wire a 3D scene in the frontend that fetches overview, supports search, and expands neighbors. Use a lightweight 3D force layout to generate positions client-side.

**Tech Stack:** FastAPI, Neo4j, React, @react-three/fiber, @react-three/drei

---

### Task 1: Add graph overview + search API endpoints

**Files:**
- Modify: `backend/app/api/graph.py`
- Modify: `backend/app/services/graph.py`
- Modify: `backend/app/models/api.py`
- Test: `backend/tests/test_graph_api.py`

**Step 1: Write the failing test**

Create `backend/tests/test_graph_api.py`:
```python
from fastapi.testclient import TestClient
from backend.app.main import app


def test_graph_overview_defaults():
    client = TestClient(app)
    response = client.get("/graph/overview")
    assert response.status_code in (200, 401)


def test_graph_search_defaults():
    client = TestClient(app)
    response = client.get("/graph/search", params={"query": "contract"})
    assert response.status_code in (200, 401)
```

**Step 2: Run test to verify it fails**
Run: `pytest backend/tests/test_graph_api.py -v`
Expected: FAIL with 404 on `/graph/overview` and `/graph/search`.

**Step 3: Write minimal implementation**
- Update `backend/app/models/api.py` to add:
  - `GraphSearchResponse` model: `nodes: List[GraphNodeModel]`
- Update `backend/app/services/graph.py`:
  - Add `overview(limit: int = 120, case_id: Optional[str] = None)` returning `GraphNeighborResponse`
  - Expand `search_entities` to search across node label/name/title/id, not just `:Entity`
- Update `backend/app/api/graph.py`:
  - `GET /graph/overview` with optional `case_id` and `limit`
  - `GET /graph/search` with `query`, optional `case_id`, and `limit`
  - Both gated by `authorize_graph_read`

**Step 4: Run test to verify it passes**
Run: `pytest backend/tests/test_graph_api.py -v`
Expected: PASS (or 401 if auth enforced). Either status acceptable per tests.

**Step 5: Commit**
```bash
git add backend/app/api/graph.py backend/app/services/graph.py backend/app/models/api.py backend/tests/test_graph_api.py
# git commit -m "feat: add graph overview/search endpoints"  # Skipped per user request
```

---

### Task 2: Build 3D explorer panel + data wiring

**Files:**
- Modify: `frontend/src/pages/GraphExplorerPage.tsx`
- Modify: `frontend/src/components/graph-explorer/GraphExplorerPanel.tsx`
- Modify: `frontend/src/components/graph-explorer/Graph3DScene.tsx`
- Create: `frontend/src/services/graph_api.ts`
- Create: `frontend/src/components/graph-explorer/graphLayout.ts`
- Create: `frontend/src/components/graph-explorer/GraphDetailPanel.tsx`

**Step 1: Write the failing test**
Create `frontend/src/components/graph-explorer/__tests__/GraphExplorerPanel.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { GraphExplorerPanel } from '../GraphExplorerPanel';

test('renders graph explorer controls', () => {
  render(<GraphExplorerPanel />);
  expect(screen.getByText(/Graph Explorer/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Search nodes/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**
Run: `npm --prefix frontend test -- GraphExplorerPanel`
Expected: FAIL because new controls are not yet present.

**Step 3: Write minimal implementation**
- Create `graph_api.ts` with `getOverview`, `searchNodes`, `getNeighbors` using `VITE_API_BASE_URL`.
- Add `graphLayout.ts` with deterministic orbital layout to assign `x/y/z` positions.
- Replace `GraphExplorerPanel` content with:
  - search input, overview button, focus button
  - 3D canvas using `Graph3DScene`
  - detail panel for selected node
- Update `Graph3DScene` to accept node size + color and send selection events.

**Step 4: Run test to verify it passes**
Run: `npm --prefix frontend test -- GraphExplorerPanel`
Expected: PASS.

**Step 5: Commit**
```bash
git add frontend/src/pages/GraphExplorerPage.tsx frontend/src/components/graph-explorer frontend/src/services/graph_api.ts
# git commit -m "feat: wire 3d graph explorer"  # Skipped per user request
```

---

### Task 3: Case-aware overview + docs/log updates

**Files:**
- Modify: `frontend/src/components/graph-explorer/GraphExplorerPanel.tsx`
- Modify: `backend/app/services/graph.py`
- Modify: `co-counsel_final/docs/logs/reproducibility.md`

**Step 1: Write the failing test**
Add to `backend/tests/test_graph_api.py`:
```python
def test_graph_overview_case_id_param():
    client = TestClient(app)
    response = client.get("/graph/overview", params={"case_id": "CASE-123"})
    assert response.status_code in (200, 401)
```

**Step 2: Run test to verify it fails**
Run: `pytest backend/tests/test_graph_api.py -v`
Expected: FAIL if case_id unsupported.

**Step 3: Write minimal implementation**
- Thread `case_id` into overview queries (prefer node properties tagged with `case_id` if present).
- Frontend: when a case ID is available in the app context, pass it into overview and search.
- Append reproducibility log entry for the 3D explorer.

**Step 4: Run test to verify it passes**
Run: `pytest backend/tests/test_graph_api.py -v`
Expected: PASS (or 401 if auth enforced).

**Step 5: Commit**
```bash
git add backend/app/services/graph.py backend/tests/test_graph_api.py frontend/src/components/graph-explorer/GraphExplorerPanel.tsx co-counsel_final/docs/logs/reproducibility.md
# git commit -m "chore: add case-aware graph overview"  # Skipped per user request
```
