# Notes: Gap Closure + Ship-Readiness

## Sources
- Master task list: docs/plans/2026-02-07_master_task_list.md
- Parity matrix and phase notes across PRPs and roadmap docs.
- User directive: complete every remaining gap via vertical slices, presume assent.

## Assumptions
- Maintain live checklist view for all remaining gaps.
- Complete each epic end-to-end before moving on (vertical slice).
- Keep reproducibility logs updated per major change.

## Findings
- Timeline builder, storyboard, export center, and cinematic UI redesign are implemented.
- Current gap set remains across swarms parity, research UI, forensics UI, court integrations, billing, DevOps, and legacy tool migration.
- Live checklist to be created in docs/plans to track completion and next steps.
- Prod stack startup now pins the repo `docker-compose.yml` to avoid environment `COMPOSE_FILE` overrides; default prod TTS voice set to female preset.
- Settings now expose agents policy + graph refinement tuning, with persisted overrides applied to runtime settings.
- Added missing API models and guarded DB auto-init to keep test imports stable; swapped in MTLS middleware for authenticated endpoints.
- Created full inventory of `toolsnteams_previous` mappings in `docs/plans/2026-02-10_toolsnteams_inventory.md` and marked checklist item complete.
- Added Swarms tools + team routing for drafting, deposition prep, subpoenas, discovery production, and trial prep; Trial Prep Hub panels now wired to `/agents/run`.
- Presentation Studio now includes binder library + exhibit deck ordering + in-court mode + multi-format exports.

- 2026-02-10: Added Research & Strategy Hub UI (legal research, theory, strategy panels) with swarm + index triggers. Normalized agents API route paths and fixed missing ReasoningResponse return. Added run-prod-full script and ensured compose unsets STT/TTS overrides before loading env.

- 2026-02-10: Loaded ref7-ref17 + stitch-3 UI references; re-skinned global theme (neon cyan/gold, glass panels, grain overlay, Inter + IBM Plex Mono) to align with provided design direction.

- 2026-02-10: Applied ref7-13 theme across dashboard/timeline/research panels; replaced emoji icons with Font Awesome and updated global UI typography + accents.

- 2026-02-10: Applied ref7-13 theme adjustments to Trial Prep + Presentation studio; refined input/label typography and progress gradients.
