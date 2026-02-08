# Agent & Tool Registry (Swarms)

Purpose: Central map of agents, tools, state transitions, and observability contracts governing the Swarms workflow.

## Canonical State Glossary
- `idle` → awaiting work
- `pending` → validation/config pre-flight
- `active` → primary workload running
- `waiting` → blocked on upstream signals or rate limits
- `succeeded` → job complete; downstream notified
- `soft_failed` → transient fault; retries allowed
- `hard_failed` → unrecoverable error; escalate to human review
- `cancelled` → request aborted intentionally

## Swarms Team Registry
- Ingestion Swarm
- Facts Swarm
- Legal Theory Swarm
- Strategy Swarm
- Drafting Swarm
- QA Swarm
- Forensics Swarm

## Tool Registry (Seed)
- LlamaIndex ingestion + LlamaHub connectors
- OCR + vision classification
- Vector store adapters (Qdrant/Chroma)
- Neo4j graph upserts and refinement worker
- Timeline builder tools
- Forensics tools (hashing, metadata, authenticity)
- Crypto tracing tools (wallet extraction, on-chain queries)

## Observability Contracts
- Each phase emits a workflow artifact (JSON + Markdown)
- Each tool emits latency and error metrics
- QA phase emits citation counts and artifact coverage
