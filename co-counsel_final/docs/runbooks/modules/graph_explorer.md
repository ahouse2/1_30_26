# Graph Explorer Runbook

## UI Route
- `/graph`

## Primary APIs
- `GET /graph/overview`
- `GET /graph/neighbors/{node_id}`
- `GET /graph/search`
- `GET /graph/facts`
- `POST /graph/snapshots`
- `GET /graph/snapshots`
- `POST /graph/snapshots/diff`
- `GET /knowledge-graph/query`

## Operator Steps
1. Load graph overview and verify node/edge counts are non-zero.
2. Search for a known entity (person, document, event).
3. Open node neighbors and confirm citation-backed relationships.
4. Create snapshot before major ingest or edits.
5. Create new snapshot after updates and run diff.

## Success Criteria
- Query responses include evidence context for legal traceability.
- Snapshot diff identifies meaningful graph changes after ingest.

## Common Issues
- Empty graph:
  - Confirm ingestion completed and graph upserts were not skipped.
- Query errors:
  - Validate graph endpoint health and provider model settings.
