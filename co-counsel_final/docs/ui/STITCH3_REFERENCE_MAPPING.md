# Stitch-3 Reference Mapping

This document tracks how the live UI maps to the approved Stitch-3 reference bundle:

- `frontend/design_refs/stitch-3/stitch/ai_evidence_intelligence_1/code.html`
- `frontend/design_refs/stitch-3/stitch/ai_evidence_intelligence_2/code.html`
- `frontend/design_refs/stitch-3/stitch/ai_evidence_intelligence_3/code.html`
- `frontend/design_refs/stitch-3/stitch/ai_evidence_intelligence_4/code.html`
- `frontend/design_refs/stitch-3/stitch/ai_evidence_intelligence_5/code.html`
- `frontend/design_refs/stitch-3/stitch/ai_evidence_intelligence_6/code.html`

## Core Visual Decisions

- Dark, low-luminance backdrop with cyan-primary glow treatment.
- Left vertical command rail with icon-first navigation.
- Uppercase, mono-accent labels for module framing and status chips.
- Glass panel cards, thin luminous borders, and restrained neon highlights.
- Dense legal dashboard composition with panel-first information hierarchy.

## Runtime Mapping

- Global shell + command rail:
  - `frontend/src/components/Layout.tsx`
  - `frontend/src/styles/index.css`
- Color/spacing primitives:
  - `frontend/src/styles/design-system.css`
  - `frontend/src/styles/cinematic-design-system.css`
- Feature panels inheriting shell language:
  - Timeline: `frontend/src/pages/TimelinePage.tsx`
  - Presentation: `frontend/src/pages/InCourtPresentationPage.tsx`
  - Forensics: `frontend/src/pages/ForensicsReportPage.tsx`
  - Research/Strategy: `frontend/src/pages/ResearchStrategyHubPage.tsx`
  - Trial Prep: `frontend/src/pages/TrialPrepHubPage.tsx`

## Notes

- Reference HTML files are design sources and are not directly imported at runtime.
- Runtime implementation follows the reference visual language via shared CSS tokens and component-level styling.
