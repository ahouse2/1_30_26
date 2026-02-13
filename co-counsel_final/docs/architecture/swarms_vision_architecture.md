# Swarms Vision and Architecture

## Vision
Co-Counsel is a Swarms-first legal intelligence platform that runs an automated, end-to-end case pipeline after evidence ingestion, with user-triggered re-runs of any phase. The system ingests large evidence corpora, extracts facts and entities, builds timelines and narratives, proposes legal theories and strategy, and drafts outputs up to the point of document generation. It must stay comprehensive, robust, and explainable, with citations and provenance for every extracted or synthesized artifact.

The user experience is split into two modes: an autonomous pipeline that executes the full workflow by default, and an interactive mode where users can run individual Swarms or tools, inspect sources, and iteratively refine outputs. The platform must provide “mission control” visibility and control for every phase, plus a timeline builder and evidence presentation tooling that directly support litigation readiness.

## Architecture Principles
- Swarms orchestration is the standard agent runtime. Legacy swarms references are deprecated.
- LlamaIndex is the canonical ingestion, parsing, chunking, and indexing substrate.
- Knowledge graph upserts are applied throughout the pipeline, with a background refinement loop that discovers new entities, clusters, and relationships until it reaches a defined stagnation threshold.
- Every artifact is traceable to source documents, citations, and audit logs.
- The pipeline is safe by default: deterministic phase boundaries, resumable workflows, and guardrails for privileged content.

## System Overview
1. Ingestion and Preprocessing
- LlamaIndex connectors, OCR/vision, chunking, embeddings.
- Hybrid index (vector + graph) and source-of-truth document store.
- Evidence manifests and normalized metadata for later chain-of-custody.

2. Swarms Orchestration Layer
- Core Swarms for ingestion, facts, legal theory, strategy, drafting, QA, and forensics.
- A supervisory Swarm assigns tasks, collects artifacts, and produces phase outputs.
- User can re-run any phase or sub-team from the UI.

3. Knowledge Graph and Retrieval
- Graph upserts on every phase output.
- Graph refinement worker continually enriches schema and relationships.
- Retrieval combines vector, graph, and citation-aware ranking.

4. Timeline and Narrative Engine
- Autonomous timeline builder with citations, document inspector, filters, and export.
- Narrative generation and storyboard mode for case presentation.

5. Presentation and Trial Readiness
- Exhibit binder builder and trial presentation assistant Swarms.
- Motion and brief drafting with structured templates.

6. Platform Services
- QA team for validation of claims, citation integrity, and artifact completeness.
- Dev team Swarm for incremental maintenance and improvements.
- Observability, audit logging, and reproducibility logs.

## Current State (Summary)
- Swarms workflow phases wired with ingestion, fact extraction, legal theory, strategy, drafting, QA, and forensics.
- Knowledge graph refinement worker integrated.
- LlamaIndex ingestion and indexing integrated.
- Forensics and crypto tracing exist but advanced methods are currently limited or stubbed and require hardening and external integrations.

## Target State
- Full-featured pipeline with comprehensive forensics, crypto tracing, timeline, and trial presentation modules.
- Interactive UI dashboards: Swarm orchestration view, 3D graph explorer, timeline builder, and “war room” control center.
- Court integrations for docketing and filings, with payments and compliance for paid document retrieval.

## Key Interfaces
- REST APIs for ingestion, workflows, forensics, timeline, evidence binder, and graph.
- UI paths for autonomous pipeline management and interactive tools.
- Secure integrations for court data providers and document access.
