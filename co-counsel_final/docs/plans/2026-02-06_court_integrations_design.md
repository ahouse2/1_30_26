# Court Integrations Foundation Design

## Goal
Deliver a compliant, extensible court integrations foundation that supports paid document retrieval (PACER/UniCourt), LACS data access via approved methods, and end-to-end ingestion into the Swarms pipeline (indexing, graph upserts, timeline extraction, and downstream swarm routing).

## Non‑Goals
- Implementing unauthorized scraping of court portals.
- Embedding production API keys (keys remain operator‑provided).
- Replacing existing CourtListener caselaw integration.

## Architecture Overview
The court integrations layer will live as a **connector domain** with a shared interface:
- `CourtConnector` base protocol (search dockets, fetch case summary, fetch document, fetch calendar)
- Provider implementations: `PacerConnector`, `UniCourtConnector`, `LacsConnector`
- Each connector is configured by runtime credentials stored in Settings and environment variables

A `CourtIntegrationService` orchestrates connectors and feeds outputs into the existing ingestion pipeline:
1. **Retrieve** (docket metadata, documents, calendar events)
2. **Normalize** into evidence packets with citation metadata (provider + docket ID + doc ID + timestamp + checksum)
3. **Ingest** via LlamaIndex + graph upserts
4. **Emit** graph refinement triggers and swarm notifications (timeline, legal theory, trial strategy, presentation, binder)

## Payment & Compliance
Introduce a **Court Payment Ledger** to record paid retrieval lifecycle:
- `intent` (user requested paid item, estimated cost)
- `authorized` (user approved charge)
- `captured` (document retrieved + final cost)
- `failed` (error or denied)

Ledger entries are append‑only and hash‑chained (patterned after `AuditTrail`) to preserve integrity.

## API Surface
New endpoints under `/courts`:
- `GET /courts/providers` — list provider readiness and status
- `POST /courts/search` — federated docket search (provider, query, jurisdiction filters)
- `POST /courts/cases/fetch` — pull case metadata
- `POST /courts/documents/fetch` — retrieve a document (creates payment intent if paid)
- `POST /courts/payments/authorize` — confirm a paid retrieval
- `GET /courts/payments/ledger` — list payment ledger entries (admin scope)

## UI/UX
- **Settings panel** adds credential inputs for PACER/UniCourt/LACS (stored like CourtListener).
- **Court Data panel** surfaces provider readiness, last sync time, and pending paid items.
- Paid fetch requires a clear confirmation screen before authorization.

## Observability
- Structured audit logs for each retrieval and payment event.
- Provider metrics (latency, error rate, cost) emitted to telemetry when enabled.

## Testing
- Unit tests for connectors and ledger.
- API tests for provider list, search, and payment flows.
- Integration smoke that runs without API keys (should return clear “not configured” errors).

## Risks & Mitigations
- **Compliance risk**: avoid unsupported automation; default to manual/assisted for LACS until approved access.
- **Cost risk**: require explicit authorization for paid retrievals; ledger keeps audit trail.
- **Key handling**: store only in settings or env; never log secrets.
