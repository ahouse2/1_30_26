# Forensics Suite Runbook

## UI Route
- `/forensics/:caseId/:docType/:docId`

## Primary APIs
- `GET /forensics/document`
- `GET /forensics/image`
- `GET /forensics/financial`
- `GET /forensics/{case_id}/{doc_type}/{doc_id}/history`
- `GET /forensics/{case_id}/{doc_type}/{doc_id}/audit`
- `POST /forensics/{case_id}/{doc_type}/{doc_id}/export`
- `GET /forensics/export/{export_id}`

## Operator Steps
1. Open target document in forensics view.
2. Review authenticity sections and metadata anomalies.
3. For crypto matters, review tracing and custody attribution leads.
4. Export report package for legal packeting (JSON/MD/HTML).
5. Review audit trail and prior versions before filing.

## Success Criteria
- Report includes chain-of-custody-relevant metadata.
- Crypto section includes wallet/linkage confidence where applicable.
- Export package downloads and reopens without corruption.

## Common Issues
- Empty crypto panel:
  - Confirm source document contains parseable wallet/tx data.
- Version history missing:
  - Validate report persistence path and write permissions.
