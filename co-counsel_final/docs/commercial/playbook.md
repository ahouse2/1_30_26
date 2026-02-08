# Commercial Launch Playbook

## 1. Packaging & Deployment Profiles
- **Profile catalogue** — `dev` and `prod`. Both share the root `docker-compose.yml`; the `prod` profile enables observability (`otel-collector`) and Grafana dashboards (`infra/grafana/**`).
- **Environment manifests** — `infra/profiles/dev.env` and `infra/profiles/prod.env` capture default settings for telemetry, billing plans, and Grafana credentials (with `infra/profiles/gpu.env` as an optional CUDA overlay).
- **Installer automation** — run `scripts/install_tier.sh dev|prod` to copy the profile manifest, create required storage directories (including `storage/billing`), and start the compose project with the relevant profile. Use `--dry-run` to preview commands during security review.

## 2. Profile Defaults & Support
| Profile | Primary Use Case | Feature Coverage | Support Guidance |
| ------- | ---------------- | ---------------- | ---------------- |
| Dev | Local development & QA | Core services only (no telemetry stack) | Internal engineering support |
| Prod | Full-featured production | Telemetry, Grafana, voice services, backups | Standard/proactive support playbook |

Health thresholds: soft alert at 80% quota consumption, hard alert at 95%.

## 3. Onboarding Workflow
1. **Intake form** — `frontend/src/components/OnboardingFlow.tsx` collects tenant, contact, use case, automation assumptions, and success criteria. Profile recommendations use shared heuristics with the API (`backend/app/main.py::_recommend_plan`).
2. **Submission API** — `POST /onboarding` persists metadata via `backend/app/telemetry/billing.py` (billing registry) and returns the recommended plan, timestamp, and tenant identifier.
3. **Commercial artefacts** — Submission metadata (departments, ROI assumptions, go-live date) is persisted in `storage/billing/usage.json` for playbook follow-up and ingestion into CRM.
4. **Success handoff** — The UI provides ROI projections and plan comparison to brief Customer Success prior to kickoff.

## 4. Customer Health & Telemetry
- **Instrumentation** — Billing events recorded for ingestion, query, timeline, agents, and onboarding flows (`backend/app/main.py`) with metrics exported via OpenTelemetry (`backend/app/telemetry/billing.py`).
- **Persistence** — Usage ledger stored at `storage/billing/usage.json` with thread-safe writes and per-tenant snapshots (health score, usage ratio, projected cost).
- **Dashboard** — `/billing/usage` exposes RBAC-protected JSON (role `CustomerSuccessManager`, scope `billing:read`). `frontend/src/components/CustomerHealthDashboard.tsx` visualises metrics with bearer-token input.
- **Grafana** — Prod profile ships with provisioned dashboards under `infra/grafana/dashboards/customer_health.json` pointing to the OTLP collector Prometheus endpoint.

## 5. Billing API Surface
- `GET /billing/plans` — returns plan catalogue (pricing, quotas, support tiers).
- `GET /billing/usage` — returns customer health snapshots (requires billing audience token).
- `POST /onboarding` — writes onboarding intake, triggers billing telemetry event (`BillingEventType.SIGNUP`).

## 6. Sales Enablement Collateral
- **Case studies** — see `docs/commercial/case_study_legal_ops.md` for a litigation ops success story with quantified outcomes.
- **ROI calculator methodology** — `docs/commercial/roi_calculator.md` documents formulae aligned with onboarding inputs and telemetry.
- **Battlecards & objections** — `docs/commercial/sales_enablement.md` summarises positioning, objection handling, and key differentiators for the prod profile.

## 7. Operational Routines
- **Daily** — review Grafana dashboard (Customer Intelligence folder), triage tenants flagged with health < 0.75 or usage ratio > 0.95.
- **Weekly** — sync billing ledger into CRM, align with Finance on projected overages, verify support SLA adherence via `support_response_sla_hours` counters.
- **Monthly** — audit `storage/billing/usage.json` for retention, export anonymised KPIs for exec reporting, reconcile plan overrides in environment config.

## 8. Change Management Checklist
- Update `infra/profiles/*.env` when adjusting profile defaults or telemetry endpoints.
- Keep billing plan constants in `backend/app/telemetry/billing.py` in sync with published pricing.
- Document any new collateral or profile adjustments under `docs/commercial/` and cross-link here.
- Append actions and validation results to `AGENTS.md` Chain of Stewardship after each commercial release.
