# Reproducibility Log

## 2026-02-09
- Applied halo command hub UI shell + theme tokens inspired by ref7–ref13 and stitch-3.
- Enabled Tailwind base/components/utilities in `frontend/src/styles/index.css` for consistent utility rendering.
- Added layout shell test and updated `frontend/index.html` to load Sora, IBM Plex Mono, Material Symbols, and Font Awesome.
- Tests: `cd frontend && npm test -- layoutShell.test.tsx`
- Installed Playwright Chromium and captured UI screenshots.
  - `cd frontend && npx playwright install chromium`
  - `node` script using `@playwright/test` to capture `dashboard`, `graph`, `trial-university`, `mock-trial`, `live-chat`, `upload`, `service-of-process`, `in-court-presentation`

## 2026-02-09 (Follow-up)
- Removed AppleDouble `._*` files under `frontend` and added `.gitignore` guard.
- Added `@radix-ui/react-scroll-area` and `@radix-ui/react-icons` deps; ran `cd frontend && npm install`.
- Added Vitest globals and excluded `._*` from Vite/Vitest.
- Fixed `Progress` indicator color support + tests.
- Fixed `Avatar` (ReadyPlayerMe + lipsync wiring), `KnowledgeGraphViewer` node lookup, `Layout` context usage, `useAppLayout` default, `ForensicsReportPage` params/import, and `Toast` displayName.
- Tests: `cd frontend && npx vitest run progress.test.tsx`
- Build: `cd frontend && npm run build`
- UI screenshots captured from `http://127.0.0.1:5176` into `logs/ui_screenshots/2026-02-09-fix/`.

## 2026-02-09 (Folder Ingestion Pipeline)
- Added manual stage trigger API (`/api/ingestion/{job_id}/stage/{stage}/run`) with stage-aware execution and status tracking.
- Added folder upload client (`startFolderUpload`) and UI surfaces for folder selection + pipeline controls.
- Added ingestion status stage details (`status_details.stages`) and stage lifecycle updates during runs.
- Tests:
  - `PYTHONPATH=/Volumes/MAC_DEV/REPOS/co-counsel_final/tools:/Volumes/MAC_DEV/REPOS/co-counsel_final pytest backend/tests/test_ingestion_stage_api.py -q`
  - `PYTHONPATH=/Volumes/MAC_DEV/REPOS/co-counsel_final/tools:/Volumes/MAC_DEV/REPOS/co-counsel_final pytest backend/tests/test_ingestion_status_details.py -q`
  - `cd frontend && npx vitest run tests/documentApiUpload.test.ts tests/folderUploadZone.test.tsx tests/ingestionPipelinePanel.test.tsx tests/uploadEvidencePage.test.tsx`
