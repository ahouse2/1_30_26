# CENTCOM War Room Runbook

## UI Route
- `/centcom`

## Primary APIs
- `GET /courts/providers`
- `GET /graph/refinement/status`
- `GET /cost/summary`
- `GET /billing/health`
- `GET /workflow/runs/{run_id}`

## Operator Steps
1. Use CENTCOM to verify station status and current run health.
2. Confirm court provider readiness before court sync tasks.
3. Monitor graph refinement status and restart if stalled.
4. Review billing/cost telemetry for abnormal spikes.

## Success Criteria
- Active workflows and dependencies report healthy.
- Operators can detect and triage degraded services quickly.

## Common Issues
- Stale status cards:
  - Trigger manual refresh and check backend `/health`.
- Court providers degraded:
  - Recheck credentials and upstream provider availability.
