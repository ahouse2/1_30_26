# Runbook — Dev Swarm

## Objective
Continuously triage feature requests, translate them into improvement tasks, and deliver validated patch proposals through Swarms.

## Inputs
- Feature requests
- Bug reports
- Audit backlog items

## Outputs
- Prioritized task list
- Proposed patches + tests
- Release notes for merged changes

## Operating Loop
1. Intake and classify requests.
2. Draft task plan with scope + acceptance criteria.
3. Implement minimal changes with tests.
4. Validate and summarize results.

## Guardrails
- Do not change user data without explicit approval.
- Always log changes in `docs/logs/reproducibility.md`.
- Maintain Swarms-first architecture.
