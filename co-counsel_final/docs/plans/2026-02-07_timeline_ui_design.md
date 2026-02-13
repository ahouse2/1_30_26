# Timeline Builder + Storyboard + Export Center — Design

**Goal:** Deliver a premium, UI-first timeline builder with citations, inspector, and workflow controls, followed by storyboard mode and an export center.

**Architecture:** Single-page timeline workspace with three primary columns: timeline rail, event inspector, and citations/document viewer. Storyboard mode overlays or replaces the event rail with narrative scenes. Export center uses existing export endpoints with improved UX and status feedback.

**Tech Stack:** React + TypeScript, existing QueryContext, CSS (cinematic theme), existing timeline endpoints.

---

## 1) Timeline Builder Workspace (Core)

The timeline builder is a dedicated page that presents a high-signal timeline rail and a persistent inspector. The rail groups events by day with an interactive “active event” anchor. Each event card shows title, timestamp, summary, risk, confidence, and event tags (entities/relations). The inspector on the right shows a deep view of the selected event (full summary, risk breakdown, recommended actions, deadlines). Beneath it sits a citation console: clickable citations with document previews, using the existing DocumentViewerPanel for evidence. The top bar includes filters (entity, risk, deadline, time range), quick stats (event count, high risk count, next deadline), and “refresh” and “load more” controls.

The workflow logic remains unchanged: QueryContext provides events, filters, citations, and refresh. The UI adds local-only “review notes” per event (stored in local storage keyed by event ID) and optional “pin” tags for user prioritization. No backend changes required to ship this phase.

## 2) Storyboard Mode (Narrative)

Storyboard mode is a narrative pass over the same event list. It uses the existing storyboard endpoint and displays scenes as cinematic cards (title, narrative, visual prompt). Scenes can be played in sequence (next/prev or autoplay) and can link to source citations. The storyboard can be toggled on the same page; when enabled, the rail collapses and the storyboard occupies the primary column. The inspector remains active and focuses on the scene’s linked event/citations.

This mode is an interpretive overlay; it doesn’t change data in storage. It adds better context for narrative strategy, motion practice, and trial storytelling.

## 3) Export Center

The export center wraps the existing export endpoint and provides a dedicated panel with format tiles (MD, HTML, PDF, XLSX) and a “Publish Web View” action. It surfaces the filter context being applied (entity/risk/deadline/storyboard toggle) and returns a download link with status feedback. Exports can be initiated from the timeline builder or storyboard mode.

## Interaction + UX Notes

- Emphasis on legibility, contrast, and motion: the active event glows, citation links animate, and timeline rail reveals with subtle entrance transitions.
- Premium aesthetic: dense yet airy layout, crisp typography, and rich background gradients aligned to the existing cinematic theme.
- Accessibility: keyboard navigation between events, proper aria labels for filters, focus rings, and high-contrast text.

## Error Handling

- Storyboard failures display inline error state and a retry button.
- Exports report errors in the panel (non-blocking toast or inline status).
- Timeline load errors surface with a “retry fetch” control.

## Testing

- Frontend: basic component smoke tests for TimelineView and Storyboard toggles.
- Backend: no changes required for this phase (existing endpoints).
