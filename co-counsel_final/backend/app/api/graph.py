from fastapi import APIRouter, Depends, Query

from ..models.api import (
    GraphEdgeModel,
    GraphNeighborResponse,
    GraphNodeModel,
    GraphSearchResponse,
)
from ..services.graph import GraphService, get_graph_service
from ..security.authz import Principal
from ..security.dependencies import (
    authorize_graph_read,
)

router = APIRouter()


def _build_neighbor_response(nodes, edges) -> GraphNeighborResponse:
    return GraphNeighborResponse(
        nodes=[
            GraphNodeModel(id=node.id, type=node.type, properties=dict(node.properties))
            for node in nodes
        ],
        edges=[
            GraphEdgeModel(
                source=edge.source,
                target=edge.target,
                type=edge.type,
                properties=dict(edge.properties),
            )
            for edge in edges
        ],
    )


@router.get("/graph/neighbors/{node_id}", response_model=GraphNeighborResponse)
def get_graph_neighbors(
    node_id: str,
    _principal: Principal = Depends(authorize_graph_read),
    service: GraphService = Depends(get_graph_service),
) -> GraphNeighborResponse:
    nodes, edges = service.neighbors(node_id)
    return _build_neighbor_response(nodes, edges)


@router.get("/graph/overview", response_model=GraphNeighborResponse)
def get_graph_overview(
    limit: int = Query(default=120, ge=1, le=500),
    case_id: str | None = None,
    _principal: Principal = Depends(authorize_graph_read),
    service: GraphService = Depends(get_graph_service),
) -> GraphNeighborResponse:
    subgraph = service.overview(limit=limit, case_id=case_id)
    return _build_neighbor_response(subgraph.nodes.values(), subgraph.edges.values())


@router.get("/graph/search", response_model=GraphSearchResponse)
def search_graph_nodes(
    query: str,
    limit: int = Query(default=8, ge=1, le=50),
    case_id: str | None = None,
    _principal: Principal = Depends(authorize_graph_read),
    service: GraphService = Depends(get_graph_service),
) -> GraphSearchResponse:
    nodes = service.search_entities(query, limit=limit, case_id=case_id)
    return GraphSearchResponse(
        nodes=[GraphNodeModel(id=node.id, type=node.type, properties=dict(node.properties)) for node in nodes]
    )
