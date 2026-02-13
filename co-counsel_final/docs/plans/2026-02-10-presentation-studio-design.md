# Presentation Studio Design (2026-02-10)

## Overview
The Presentation Studio provides a single workspace to curate exhibit binders, assemble courtroom-ready decks, and launch in‑court presentation playback. The studio fuses the evidence binder API (server‑side source of truth) with a local “deck order” surface that supports fast, drag‑reorder operations. It replaces the prior demo-only view with a real binder library, binder creation flow, and an exhibit deck that can be exported to multiple formats (MD/HTML/CSV/PDF). The design follows the cinematic UI system and uses a compact two‑column layout: evidence on the left, binder and deck controls on the right, with a live preview stage below.

## Architecture & Data Flow
- **Binders**: Uses `/evidence-binders` endpoints to list, create, and append items. This is the canonical evidence binder store.
- **Exhibits**: Uses existing case + evidence endpoints (with demo fallback when APIs are offline).
- **Deck Order**: Stored in UI state for fast reordering (drag/drop). We do not persist order yet; this is a deliberate vertical-slice tradeoff until a presentation service is ready.
- **Exports**: Generated client‑side from binder data. MD/CSV/HTML downloads are direct. PDF uses printable HTML in a new window.

## Component Structure
1. **InCourtPresentationPage**
   - Case selector + Evidence list
   - Binder library + binder creation
   - Exhibit deck ordering with drag/reorder
   - Export actions + in‑court mode toggle
   - Live preview stage for the selected exhibit
2. **Evidence Binder API Service**
   - Centralized in `frontend/src/services/evidence_binder_api.ts` for reuse.

## Error Handling
- Demo fallback for cases/evidence when API is offline.
- Binder fetch failure gracefully falls back to demo binders with a visible error message.
- Individual actions (create/add/export) are scoped to component state; errors do not hard‑fail the page.

## Testing
- Manual checks:
  - Create binder, add exhibit, reorder items, export to MD/HTML/CSV/PDF.
  - Toggle in‑court mode and verify live preview persists.
  - Demo mode fallback if `/api/cases` fails.
- Automation can follow later via Playwright once endpoint reliability is confirmed.
