# Research and Strategy Runbook

## UI Route
- `/research-strategy`

## Primary APIs
- `GET /query`
- `GET /legal_theory`
- `GET /argument_mapping`
- `GET /strategic_recommendations`
- `POST /courts/search`
- `POST /courts/documents/fetch`

## Operator Steps
1. Run case law query and review citation chain output.
2. Open legal theory panel and verify argument framing.
3. Review argument map and strategic recommendations.
4. For court-level enrichment, run court search and fetch selected documents.
5. Confirm new court outputs appear in graph/timeline workflows.

## Success Criteria
- Research outputs include authority source metadata.
- Strategy recommendations are traceable to evidence or precedent.

## Common Issues
- Sparse results:
  - Check provider credentials (CourtListener/Case.law/PACER/UniCourt).
- Conflicting recommendations:
  - Re-run after graph refresh and updated timeline extraction.
