# Drift Guardrails — Scope/Context Alignment

Non‑Negotiables (North Star)
- End result: production‑ready legal co‑counsel, worth $1000/mo, with stellar UX and explainable answers (citations + graph paths).
- Stack alignment: MS Agents Framework + LlamaIndex/LlamaHub + Swarms; Neo4j + Qdrant/Chroma; React UI; Whisper/Coqui.
- Cite‑or‑silence policy; strong observability and audit trails.
- Forensics suite is not stubbed: real hashing, metadata, structure, and authenticity/manipulation analysis for documents/images/media; financial forensics (basic first pass) included.
- Ingestion uses both OCR and a Vision‑LLM agent for classification, tagging, and scanned‑document understanding.
- LLM provider policy: default Google Gemini‑2.5‑Flash (multimodal), with OpenAI GPT‑5.0 as a selectable option; provider abstraction required.

Success Metrics (checkpointed every phase)
- Answer citation coverage ≥ 90%; timeline correctness
- Median chat response < 3s on laptop‑scale corpora (MVP)
- Compose up green; reproducible runs; telemetry present
- Forensics: 100% of ingested files have recorded hash + metadata + structure checks; image/PDF authenticity pipeline runs where applicable; financial docs produce a forensics summary.

Out‑of‑Scope (for MVP only)
- Polished installers; enterprise SSO; advanced forensics depth (stubs allowed)

Review Cadence
- At phase boundaries, run ACE trio review, update rubric scores, and append a brief “re‑centering” note capturing intent and next outcomes.

Documentation Discipline
- Update PRPs and build_logs daily; ensure AGENTS.md log is appended for each non‑trivial change.
