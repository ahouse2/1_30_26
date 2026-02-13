# Timeline Builder Runbook

## UI Route
- `/timeline`

## Primary APIs
- `GET /timeline`
- `GET /timeline/storyboard`
- `POST /timeline/export`
- `GET /timeline/export/{export_id}`
- `GET /timeline/media-hooks`

## Operator Steps
1. Load timeline and apply filters by source/topic.
2. Validate key events against documents and citations.
3. Generate storyboard narrative for litigation sequence.
4. Export in required format (MD/HTML/PDF/XLSX).
5. Run media hooks for visual aids where needed.

## Success Criteria
- Critical dates and hearing events align with filing records.
- Exports are downloadable and include citation-bearing context.

## Common Issues
- Missing events:
  - Re-run ingest stage for extraction and timeline rebuild.
- Export unavailable:
  - Retry export and verify storage path permissions.
