# Trial Prep Hub Runbook

## UI Route
- `/trial-prep`

## Supporting APIs
- `POST /workflow/run`
- `POST /workflow/phase`
- `POST /workflow/runs`
- `GET /workflow/runs/{run_id}`
- `POST /scenarios/run`

## Operator Steps
1. Generate key arguments from current evidence set.
2. Build witness and exhibit readiness checklist.
3. Run scenario simulation where needed for argument stress testing.
4. Save strategic outputs into presentation and timeline stations.

## Success Criteria
- Trial theories are mapped to supporting evidence.
- Scenario runs produce actionable deltas for prep.

## Common Issues
- Simulation fails:
  - Validate scenario id exists and model provider is available.
- Gaps in witness prep:
  - Re-run research and deposition prep legacy workflow from parity station.
