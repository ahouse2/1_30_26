# Cross-Chain Tracing + ETH Clustering Design Addendum

> **Context:** Adds cross-chain tracing and ETH token clustering with custodial attribution workflows, for the Swarms-first architecture.

## 1) Architecture Overview
- Build a chain-agnostic tracing core that normalizes on-chain activity into event records and graph deltas.
- Add bridge-aware adapters for EVM bridges to emit standardized cross-chain transfer edges.
- Use a heuristics registry to attach confidence scores and provenance to every cluster or attribution.
- Persist graph updates per phase, so downstream swarms can iterate on the same durable state.

## 2) Data Sources and Custodial Attribution
- Ingest raw on-chain events via RPC/indexers per chain family (EVM first).
- Seed clusters with public labels and declared entity tags, keeping public vs private tags separate.
- Maintain a legal-process workflow for custodial attribution when public declarations do not exist.
- Track evidence provenance at every step to support auditability and defensible reporting.

## 3) Operational Flow and Refinement Swarm
- Pipeline phases: Ingest -> Normalize -> Chain Decode -> Bridge Link -> Cluster -> Graph Upsert -> Retrieval/Reporting.
- Add a background Graph Refinement Swarm that re-applies heuristics on new deltas.
- Enforce diminishing-returns cutoff (for example: N runs in a row produce < K new edges).
- Expose run yields and confidence in the UI and logs for transparency.
