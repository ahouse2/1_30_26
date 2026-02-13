# 3D Graph Explorer Design

**Date:** 2026-02-06

## Goals
- Deliver a production-grade 3D knowledge graph explorer.
- Use the same knowledge graph that autonomous swarms continuously update.
- Default to a case-specific view when a case ID is available, otherwise fall back to global overview.
- Preserve a cinematic UI consistent with the rest of the product.

## Non-Goals
- Rewriting graph storage or agent orchestration.
- Introducing a new graph database or separate graph index.

## Architecture Summary
- Backend graph data is served via `backend/app/api/graph.py` and `GraphService`.
- New endpoints:
  - `GET /graph/overview?limit=120&case_id=` returns a `GraphNeighborResponse` snapshot.
  - `GET /graph/search?query=...&limit=8&case_id=` returns graph nodes that match the query.
- Existing `GET /graph/neighbors/{node_id}` endpoint is used for expansion.
- Frontend uses `Graph3DScene` with a deterministic orbital layout to compute 3D positions.
- Graph explorer page provides search, focus, and overview controls plus node detail card.

## Data Flow
1. UI loads `/graph/overview` (case-specific if case_id available).
2. Results are laid out in 3D and rendered by `Graph3DScene`.
3. Search queries hit `/graph/search` and select a node.
4. Expanding a node calls `/graph/neighbors/{node_id}` and merges graph data.
5. Clicking a node reveals metadata, linked documents, and swarm updates.

## UX Direction
- Cinematic orbital UI with neon cyan/violet highlights and dark atmosphere.
- Cluster-aware node coloring and size weighting by degree.
- Controls remain minimal and fast: search, focus, overview, density toggle.

## Risks
- Large graphs can overwhelm layout; mitigated by limit + expansion-based exploration.
- Missing case_id context; fallback to global overview.

## Validation
- `/graph/overview` responds with nodes/edges and respects case_id.
- `/graph/search` returns cross-type nodes.
- 3D view renders nodes/edges and handles focus + expansion.
