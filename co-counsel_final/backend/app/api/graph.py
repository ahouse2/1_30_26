from fastapi import APIRouter, Depends, HTTPException, Query

from ..models.api import (
    GraphEdgeModel,
    GraphFactExtractionResponse,
    GraphFactModel,
    GraphNeighborResponse,
    GraphNodeModel,
    GraphSearchResponse,
    GraphSnapshotCreateRequest,
    GraphSnapshotDiffRequest,
    GraphSnapshotDiffResponse,
    GraphSnapshotListResponse,
    GraphSnapshotRecordModel,
)
from ..services.graph import GraphService, get_graph_service
from ..services.graph_snapshots import GraphSnapshotService, get_graph_snapshot_service
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


@router.get("/graph/facts", response_model=GraphFactExtractionResponse)
def extract_graph_facts(
    limit: int = Query(default=200, ge=1, le=2000),
    case_id: str | None = None,
    _principal: Principal = Depends(authorize_graph_read),
    service: GraphService = Depends(get_graph_service),
) -> GraphFactExtractionResponse:
    extraction = service.extract_facts(case_id=case_id, limit=limit)
    return GraphFactExtractionResponse(
        generated_at=extraction.generated_at,
        case_id=extraction.case_id,
        total=extraction.total,
        facts=[GraphFactModel(**fact.to_dict()) for fact in extraction.facts],
    )


@router.post("/graph/snapshots", response_model=GraphSnapshotRecordModel)
def create_graph_snapshot(
    payload: GraphSnapshotCreateRequest,
    _principal: Principal = Depends(authorize_graph_read),
    service: GraphSnapshotService = Depends(get_graph_snapshot_service),
) -> GraphSnapshotRecordModel:
    record = service.create_snapshot(case_id=payload.case_id, limit=payload.limit, notes=payload.notes)
    return GraphSnapshotRecordModel(**record.to_dict())


@router.get("/graph/snapshots", response_model=GraphSnapshotListResponse)
def list_graph_snapshots(
    case_id: str | None = None,
    _principal: Principal = Depends(authorize_graph_read),
    service: GraphSnapshotService = Depends(get_graph_snapshot_service),
) -> GraphSnapshotListResponse:
    records = service.list_snapshots(case_id=case_id)
    return GraphSnapshotListResponse(
        snapshots=[GraphSnapshotRecordModel(**record.to_dict()) for record in records]
    )


@router.get("/graph/snapshots/{snapshot_id}")
def get_graph_snapshot(
    snapshot_id: str,
    _principal: Principal = Depends(authorize_graph_read),
    service: GraphSnapshotService = Depends(get_graph_snapshot_service),
) -> dict:
    try:
        return service.get_snapshot(snapshot_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Snapshot not found") from exc


@router.post("/graph/snapshots/diff", response_model=GraphSnapshotDiffResponse)
def diff_graph_snapshots(
    payload: GraphSnapshotDiffRequest,
    _principal: Principal = Depends(authorize_graph_read),
    service: GraphSnapshotService = Depends(get_graph_snapshot_service),
) -> GraphSnapshotDiffResponse:
    try:
        diff = service.diff_snapshots(
            baseline_snapshot_id=payload.baseline_snapshot_id,
            candidate_snapshot_id=payload.candidate_snapshot_id,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="One or more snapshots not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return GraphSnapshotDiffResponse(**diff)
