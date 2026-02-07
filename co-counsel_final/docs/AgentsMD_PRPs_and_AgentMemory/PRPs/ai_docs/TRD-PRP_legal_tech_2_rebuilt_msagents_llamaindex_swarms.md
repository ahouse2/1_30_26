# TRD/PRP — Legal Tech Co-Counsel (Swarms-First)

This TRD/PRP supersedes earlier drafts and aligns implementation to Swarms orchestration + LlamaIndex ingestion. Swarms is the sole authoritative runtime.

## Core Objectives
- Automated ingestion to drafted outputs with citations.
- Hybrid vector + graph retrieval with continuous refinement.
- Interactive UI for manual phase control.

## Architecture Summary
- Ingestion: LlamaIndex + OCR/vision
- Orchestration: Swarms phases (ingestion, facts, legal theory, strategy, drafting, QA, forensics)
- Storage: Neo4j + Qdrant/Chroma
- UI: timeline, war room, evidence binder, drafting

## Risks
- Advanced forensics require specialized libraries and GPU capacity.
- Court integrations require compliance and payment workflows.
