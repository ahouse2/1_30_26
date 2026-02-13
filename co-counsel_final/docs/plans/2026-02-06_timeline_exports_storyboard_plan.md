# Timeline Exports + Storyboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add server-side timeline exports (MD/PDF/XLSX/HTML) and a storyboard mode with UI controls and backend support.

**Architecture:** Extend the timeline service to render export payloads and storyboard scenes, add an export storage path under workflow storage, and expose new API endpoints for export and storyboard retrieval. Update the frontend timeline view to trigger exports and toggle storyboard mode.

**Tech Stack:** FastAPI (backend), Pydantic models, timeline store, React (frontend), reportlab + openpyxl for exports.

---

### Task 1: Add export models + storage helpers

**Files:**
- Modify: `backend/app/models/api.py`
- Create: `backend/app/storage/timeline_exports.py`

**Step 1: Write the failing test**

Create `backend/tests/test_timeline_exports.py`:
```python
from backend.app.storage.timeline_exports import TimelineExportStore

def test_export_store_round_trip(tmp_path):
    store = TimelineExportStore(tmp_path)
    record = store.save_export("case-1", "md", b"hello", "timeline.md")
    loaded = store.get_export(record.export_id)
    assert loaded.export_id == record.export_id
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_timeline_exports.py::test_export_store_round_trip -v`
Expected: FAIL (store missing)

**Step 3: Implement minimal storage class + models**

Add `TimelineExportRecord` model, JSON metadata file, file persistence.

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_timeline_exports.py::test_export_store_round_trip -v`
Expected: PASS

**Step 5: Commit**

Skipped (per user request)

---

### Task 2: Add timeline export rendering

**Files:**
- Modify: `backend/app/services/timeline.py`

**Step 1: Write the failing test**

Add tests for export rendering outputs:
```python
def test_timeline_export_md_contains_citations():
    ...
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_timeline_exports.py::test_timeline_export_md_contains_citations -v`
Expected: FAIL

**Step 3: Implement export rendering**

Add `render_markdown`, `render_html`, `render_xlsx`, `render_pdf`, and `build_storyboard` helpers.

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_timeline_exports.py::test_timeline_export_md_contains_citations -v`
Expected: PASS

**Step 5: Commit**

Skipped (per user request)

---

### Task 3: Add timeline export + storyboard API endpoints

**Files:**
- Modify: `backend/app/api/timeline.py`
- Modify: `backend/app/main.py`

**Step 1: Write failing tests**

Add tests for `/timeline/export` and `/timeline/storyboard` response models.

**Step 2: Run tests (expected FAIL)**

**Step 3: Implement endpoints**

- `POST /timeline/export`
- `GET /timeline/export/{export_id}`
- `GET /timeline/storyboard`

**Step 4: Run tests (expected PASS)**

**Step 5: Commit**

Skipped (per user request)

---

### Task 4: Frontend export + storyboard UI

**Files:**
- Modify: `frontend/src/utils/apiClient.ts`
- Modify: `frontend/src/components/TimelineView.tsx`

**Step 1: Add API helpers**

Add `exportTimeline` and `fetchStoryboard` functions.

**Step 2: Add UI controls**

Add export buttons and storyboard toggle to the timeline view.

**Step 3: Commit**

Skipped (per user request)

---

### Task 5: Dependencies and docs

**Files:**
- Modify: `backend/requirements.txt`
- Modify: `docs/logs/reproducibility.md`

**Step 1: Add dependencies**

Add `reportlab` and `openpyxl` to requirements.

**Step 2: Log changes**

Append reproducibility log entry.

**Step 3: Commit**

Skipped (per user request)

---

## Execution Handoff

Plan saved to `docs/plans/2026-02-06_timeline_exports_storyboard_plan.md`.

Two execution options:
1. Subagent-Driven (this session)
2. Parallel Session
