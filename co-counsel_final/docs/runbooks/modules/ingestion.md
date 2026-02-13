# Ingestion Module Runbook

## UI Route
- `/upload`

## Primary APIs
- `POST /ingestion/folder/start`
- `POST /ingestion/folder/{folder_id}/file/start`
- `POST /ingestion/file/{upload_id}/chunk`
- `POST /ingestion/file/{upload_id}/complete`
- `POST /ingestion/folder/{folder_id}/complete`
- `GET /ingestion/{document_id}/status`
- `POST /ingestion/{job_id}/stage/{stage}/run`
- `POST /automation/ingest-folder`

## Operator Steps
1. Open `/upload` and choose the case workspace.
2. Start folder ingest and verify each file receives an upload id.
3. Complete folder ingestion and capture returned `job_id`.
4. Poll job status until all stages are complete.
5. If any stage fails, re-run only the failed stage with stage run endpoint.

## Success Criteria
- Every intended file appears in ingestion results.
- No skipped files unless intentionally filtered.
- Job stages complete with no terminal errors.

## Common Issues
- Missing files:
  - Re-open folder structure and confirm paths were preserved.
- OCR-heavy docs fail:
  - Retry with stage run and confirm OCR provider credentials.
- Queue delay:
  - Verify `ingestion_worker_concurrency` and system load.
