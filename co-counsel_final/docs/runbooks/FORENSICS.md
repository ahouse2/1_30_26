# Forensics Runbook (Core)

Scope
- Ensure per-file forensic artifacts are generated and retrievable via API, and routed through the Swarms forensics team.
- Ensure crypto tracing outputs (wallets, clusters, bridge matches) are captured with provenance and auditable logs.

Artifacts (per file)
- hash.json, metadata.json, structure.json, authenticity.json, financial.json (as applicable)
- crypto tracing payloads: wallet extractions, transaction traces, cluster provenance, bridge matches
- Location: ./storage/forensics/{fileId}/

Operations
- Re-run forensics: trigger reprocess endpoint (to be added) or CLI
- Verify artifacts: check presence and basic schema
- Crypto tracing: validate address extraction, token transfer coverage, and cluster provenance
- Custodial attribution: log legal-process workflow records for any custodial wallet targets

Troubleshooting
- Missing authenticity: advanced checks (ELA, clone/splicing, font/object analysis) are currently stubbed and require integration with specialized libraries or services
- Financial parsing issues: validate file structure (CSV/XLSX/PDF), fall back to OCR+Vision classification
- Crypto tracing gaps: ensure Etherscan API key present for ETH + token transfers, and confirm bridge registry is populated for cross-chain matching

Security
- Preserve originals; never mutate ingested files
- Log access to forensic artifacts for audit
- Treat custodial attribution as legal-process dependent unless public declarations exist
