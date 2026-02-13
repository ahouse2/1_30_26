# Parity Ops Runbook

## UI Route
- `/parity-ops`

## Primary APIs
- `GET /parity/tasks`
- `POST /parity/tasks`
- `PATCH /parity/tasks/{task_id}`
- `POST /parity/draft`
- `POST /parity/analyze`
- `POST /parity/privilege-bates`
- `GET /parity/matrix`
- `GET /parity/legacy-workflows`
- `POST /parity/legacy-workflows/run`

## Operator Steps
1. Set `case_id` and review current task queue.
2. Add/assign tasks and keep statuses current.
3. Run legacy workflows for deposition, subpoena, discovery, and trial prep.
4. Review parity matrix score and target partial items for closure.

## Success Criteria
- Task board reflects real case readiness status.
- Legacy workflow runs produce usable output artifacts.

## Common Issues
- Workflow returns fallback text:
  - LLM provider unavailable; confirm keys/model access.
- Matrix score does not change:
  - Refresh panel after workflow run and verify backend write path.
