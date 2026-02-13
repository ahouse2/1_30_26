# Timeline Builder UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a premium timeline builder UI with storyboard mode and export center, integrate it into navigation, and deliver a cohesive visual experience.

**Architecture:** Add a dedicated Timeline page that composes TimelineView (refactored into subcomponents) and a right-hand inspector with citations. Use local storage for user notes/pins. Styling lives in `frontend/src/styles/index.css` under a new timeline section.

**Tech Stack:** React + TypeScript, QueryContext, existing timeline endpoints, CSS.

---

### Task 1: Add timeline route + navigation entry

**Files:**
- Create: `frontend/src/pages/TimelinePage.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Layout.tsx`

**Step 1: Write the failing test**
- Create a minimal render test asserting `/timeline` route exists and page renders (if test harness exists).

**Step 2: Run test to verify it fails**
Run: `npm --prefix frontend test -- TimelinePage` (expected FAIL if test not wired).

**Step 3: Write minimal implementation**
- Add TimelinePage component that renders a header + `<TimelineView />`.
- Add `/timeline` route in `App.tsx`.
- Add nav link in `Layout.tsx`.

**Step 4: Run test to verify it passes**
Run: `npm --prefix frontend test -- TimelinePage` (expected PASS).

**Step 5: Commit**
- `git add frontend/src/pages/TimelinePage.tsx frontend/src/App.tsx frontend/src/components/Layout.tsx`
- `git commit -m "feat: add timeline page route"`

---

### Task 2: Refactor TimelineView into premium layout

**Files:**
- Modify: `frontend/src/components/TimelineView.tsx`

**Step 1: Write the failing test**
- Add a test asserting inspector + filters render and Storyboard toggle works (if feasible).

**Step 2: Run test to verify it fails**
Run: `npm --prefix frontend test -- TimelineView` (expected FAIL if not implemented).

**Step 3: Write minimal implementation**
- Add layout grid: header + stats + filters, main content with rail and inspector.
- Add event selection + inspector panel with citations.
- Add local storage notes/pins for events.
- Add refresh button using `refreshTimelineOnDemand`.

**Step 4: Run test to verify it passes**
Run: `npm --prefix frontend test -- TimelineView` (expected PASS).

**Step 5: Commit**
- `git add frontend/src/components/TimelineView.tsx`
- `git commit -m "feat: upgrade timeline builder layout"`

---

### Task 3: Storyboard mode overlay

**Files:**
- Modify: `frontend/src/components/TimelineView.tsx`

**Step 1: Write the failing test**
- Add a test for storyboard empty state rendering.

**Step 2: Run test to verify it fails**
Run: `npm --prefix frontend test -- TimelineView` (expected FAIL).

**Step 3: Write minimal implementation**
- Add storyboard panel with scene cards + navigation controls.
- Link scene citations to inspector.

**Step 4: Run test to verify it passes**
Run: `npm --prefix frontend test -- TimelineView` (expected PASS).

**Step 5: Commit**
- `git add frontend/src/components/TimelineView.tsx`
- `git commit -m "feat: add storyboard mode panel"`

---

### Task 4: Export center UI

**Files:**
- Modify: `frontend/src/components/TimelineView.tsx`

**Step 1: Write the failing test**
- Add a test verifying export buttons render and disable while exporting.

**Step 2: Run test to verify it fails**
Run: `npm --prefix frontend test -- TimelineView` (expected FAIL).

**Step 3: Write minimal implementation**
- Add export center panel with tiles and status messaging.
- Reuse `handleExport` with extra UI state.

**Step 4: Run test to verify it passes**
Run: `npm --prefix frontend test -- TimelineView` (expected PASS).

**Step 5: Commit**
- `git add frontend/src/components/TimelineView.tsx`
- `git commit -m "feat: add timeline export center"`

---

### Task 5: Timeline CSS + visual polish

**Files:**
- Modify: `frontend/src/styles/index.css`

**Step 1: Write the failing test**
- Manual visual check (no automated CSS tests).

**Step 2: Apply styles**
- Add timeline layout styles, cards, inspector, storyboard, and export center.
- Ensure responsive behavior for mobile.

**Step 3: Manual verification**
- Run frontend and verify layout on desktop and mobile widths.

**Step 4: Commit**
- `git add frontend/src/styles/index.css`
- `git commit -m "feat: timeline builder visual polish"`

---

### Task 6: Update docs + logs

**Files:**
- Modify: `docs/logs/reproducibility.md`
- Modify: `logs/build_logs/2026-02-07.md`

**Steps:**
1. Add entry for timeline UI build.
2. Note tests run/failed.
3. Commit.
