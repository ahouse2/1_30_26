# Roadmap — Co-Counsel Spec Modernization (2025-10-27)

## Vision
### 1. Outcome Definition
#### 1.1 Statement
Ensure the Co-Counsel API spec communicates machine-validated schemas, lifecycle guarantees, and alignment with FastAPI Pydantic models.
#### 1.2 Success Criteria
1. Validation rules explicitly mirror pydantic constraints.
2. Asynchronous ingestion lifecycle is unambiguous, including status polling contract.
3. Query and timeline endpoints expose pagination and filtering semantics.
4. Spec references concrete `backend.app.models.api` classes to stay synchronized with code.

## Phase A — Reconnaissance
### A.1 Artifact Survey
#### A.1.a Source Enumeration
1. Inspect `docs/AgentsMD_PRPs_and_AgentMemory/PRPs/PRP_CoCounsel_MSAgents_LlamaIndex_Swarms_spec.md` for existing bullet structures.
2. Cross-reference implemented Pydantic models in `backend/app/models/api.py`.
#### A.1.b Gap Identification
1. Note absence of explicit pagination/filter documentation.
2. Confirm ingestion endpoint currently synchronous yet returns 202; plan to specify queued lifecycle and status polling endpoint expectation.

## Phase B — Schema Refactor Design
### B.1 Endpoint Catalog Transformation
#### B.1.a Structure Blueprint
1. Replace bullet lists with per-endpoint sections including:
   - `Endpoint Summary` table.
   - `Request Schema` table keyed by field with type, validation, required flags.
   - `Response Schema` table referencing model classes.
2. Embed canonical JSON request/response examples illustrating pagination, traces, and forensics payloads.
#### B.1.b Validation Rule Encoding
1. Define accepted enumerations (e.g., source types, job statuses).
2. Document constraints like non-empty arrays, ISO 8601 timestamps, UUID format for job_id.

### B.2 Lifecycle Narratives
#### B.2.a Asynchronous Ingestion
1. Describe 202 Accepted response semantics and `status` options.
2. Introduce `/ingest/{job_id}` polling contract with 200/202/303 expectations (documentation only).
3. Clarify job expiration, retry semantics, and error payload shape.
#### B.2.b Retrieval Pagination & Filtering
1. Extend `/query` spec to support `page`, `page_size`, `filter[source]`, and `rerank` toggles consistent with retrieval service capabilities.
2. Extend `/timeline` to cover `cursor`, `limit`, `from_ts`, `to_ts`, and `entity` filters.
3. Provide HTTP examples illustrating query param usage and paginated response metadata.

## Phase C — Documentation Authoring
### C.1 Drafting
#### C.1.a Markdown Rules
1. Convert previous bullet content into tables or definition lists without losing fidelity.
2. Keep headings consistent with existing PRP format (`## APIs`, etc.) while upgrading subsections.
#### C.1.b Model References
1. Add inline references to classes such as `backend.app.models.api.IngestionRequest`.
2. Note planned extensions (e.g., `IngestionStatusResponse`) with TODO anchors for implementation.

### C.2 Validation
#### C.2.a Consistency Pass
1. Verify JSON examples match described schema keys and types.
2. Ensure pagination metadata aligns with statuses enumerated earlier.
#### C.2.b Cross-check
1. Confirm no bullet lists remain in the modified sections unless semantically required elsewhere.
2. Ensure Markdown tables render correctly and keep line lengths manageable.

## Phase D — Repository Hygiene
### D.1 Logging
#### D.1.a Stewardship Entry
1. Append contribution details to root `AGENTS.md` chain of stewardship log.
#### D.1.b PR Preparation
1. Stage modified documentation and roadmap file.
2. Compose commit with descriptive message.
3. Use `make_pr` with summary reflecting schema overhaul.

## Phase E — Quality Assurance
### E.1 Review Loop
#### E.1.a Self-critique
1. Re-read spec ensuring clarity and absence of ambiguity.
2. Double-check references to Pydantic models exist for each endpoint.
3. Validate asynchronous lifecycle narrative uses precise HTTP status codes.
