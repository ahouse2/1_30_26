# Presentation Studio Runbook

## UI Route
- `/in-court-presentation`

## Primary APIs
- `POST /presentation/export`
- `GET /presentation/export/{export_id}`

## Operator Steps
1. Build exhibit sequence and validate document ordering.
2. Confirm each exhibit has source/citation references.
3. Export binder package in requested format (HTML/PDF/XLSX/MD).
4. Open exported artifact and verify courtroom readability.

## Success Criteria
- Exported package includes all selected exhibits.
- Format-specific outputs render correctly (especially PDF/XLSX).

## Common Issues
- Missing exhibits in export:
  - Reopen builder selection and regenerate export.
- Download fails:
  - Verify export id exists and storage backend is writable.
