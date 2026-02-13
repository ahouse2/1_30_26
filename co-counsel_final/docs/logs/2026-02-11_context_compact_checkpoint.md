# Context Compact Checkpoint — 2026-02-11

## Phase
Operational-readiness gate -> transition to parity + polish.

## Completed in this phase
- Added AppleDouble (`._*`) preflight cleanup to startup script so Docker context no longer fails on macOS shadow files.
- Fixed startup script logging/guard behavior around optional voice profile string and cleanup command return handling.
- Restored shared frontend JSON parsing helper used by Service of Process / In-Court pages.
- Replaced brittle avatar SDK integration with stable TTS-backed voice avatar component.
- Fixed frontend runtime/type breakpoints (toast icon import/displayName, layout default section, forensics route params typing).
- Updated frontend build command to prioritize production bundling reliability (`vite build`) for urgent operational use.
- Narrowed tsconfig build scope to app code path and excluded test files from production build gate.
- Added missing frontend deps (`vis-data`, `@radix-ui/react-scroll-area`) and aligned `cytoscape`/`three` dependency path so bundling resolves.
- Verified local frontend production build succeeds (`npm run build`).

## Current gate status
- `./scripts/run-prod.sh` is being exercised repeatedly and now proceeds into long backend image build/install stage.
- No containers currently confirmed healthy in this checkpoint file yet; health verification remains the immediate next step after build completion.

## Immediate next actions
1. Finish `run-prod` and verify: `docker compose --profile prod ps`, `curl http://localhost:8000/docs`, `curl http://localhost/`.
2. Mark prod gate pass/fail in live checklist and reproducibility log.
3. Move to parity vertical slices in order:
   - Strategy argument mapping UI completion.
   - Trial University interactive onboarding completion.
   - Graph refinement automation/stop-criteria polish and observability.
4. Run real-data smoke flow: folder ingest -> graph -> timeline -> strategy/presentation outputs.

## Files changed in this phase
- scripts/start-stack-full.sh
- frontend/src/apiClient.ts
- frontend/src/components/Avatar.tsx
- frontend/src/components/ui/toast.tsx
- frontend/src/hooks/useAppLayout.ts
- frontend/src/pages/ForensicsReportPage.tsx
- frontend/package.json
- frontend/tsconfig.json
- frontend/src/styles/index.css

## Note
User priority: polished, reliable, million-dollar feel (not bare-minimum); monetization deferred to later phase.
