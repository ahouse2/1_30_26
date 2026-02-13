from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from typing import Any, Dict, List, Tuple
from uuid import uuid4

from ..config import get_settings
from .graph import GraphService


@dataclass(slots=True)
class GraphSnapshotRecord:
    snapshot_id: str
    case_id: str | None
    created_at: str
    node_count: int
    edge_count: int
    checksum: str
    notes: str | None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "snapshot_id": self.snapshot_id,
            "case_id": self.case_id,
            "created_at": self.created_at,
            "node_count": self.node_count,
            "edge_count": self.edge_count,
            "checksum": self.checksum,
            "notes": self.notes,
        }


class GraphSnapshotService:
    def __init__(self, graph_service: GraphService, root: Path | None = None) -> None:
        settings = get_settings()
        self._graph_service = graph_service
        self._root = root or (settings.workflow_storage_path / "graph_snapshots")
        self._root.mkdir(parents=True, exist_ok=True)

    def create_snapshot(self, *, case_id: str | None, limit: int = 250, notes: str | None = None) -> GraphSnapshotRecord:
        subgraph = self._graph_service.overview(limit=max(1, limit), case_id=case_id)
        payload = subgraph.to_payload()
        created_at = datetime.now(timezone.utc).isoformat()
        checksum = hashlib.sha256(
            json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
        ).hexdigest()
        snapshot_id = f"gsnap-{uuid4().hex[:12]}"
        record = GraphSnapshotRecord(
            snapshot_id=snapshot_id,
            case_id=case_id,
            created_at=created_at,
            node_count=len(payload["nodes"]),
            edge_count=len(payload["edges"]),
            checksum=checksum,
            notes=notes,
        )
        content = {
            "meta": record.to_dict(),
            "graph": payload,
        }
        self._path(snapshot_id).write_text(json.dumps(content, indent=2, sort_keys=True), encoding="utf-8")
        return record

    def list_snapshots(self, *, case_id: str | None = None) -> List[GraphSnapshotRecord]:
        records: List[GraphSnapshotRecord] = []
        for path in sorted(self._root.glob("*.json")):
            try:
                payload = json.loads(path.read_text(encoding="utf-8"))
            except Exception:
                continue
            meta = payload.get("meta")
            if not isinstance(meta, dict):
                continue
            record = self._to_record(meta)
            if case_id and record.case_id != case_id:
                continue
            records.append(record)
        records.sort(key=lambda item: item.created_at, reverse=True)
        return records

    def get_snapshot(self, snapshot_id: str) -> Dict[str, Any]:
        path = self._path(snapshot_id)
        if not path.exists():
            raise KeyError(snapshot_id)
        payload = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(payload, dict):
            raise KeyError(snapshot_id)
        return payload

    def diff_snapshots(self, *, baseline_snapshot_id: str, candidate_snapshot_id: str) -> Dict[str, Any]:
        baseline = self.get_snapshot(baseline_snapshot_id)
        candidate = self.get_snapshot(candidate_snapshot_id)

        baseline_graph = baseline.get("graph") if isinstance(baseline, dict) else None
        candidate_graph = candidate.get("graph") if isinstance(candidate, dict) else None
        if not isinstance(baseline_graph, dict) or not isinstance(candidate_graph, dict):
            raise ValueError("Snapshot payload missing graph section")

        baseline_nodes = {
            str(node.get("id")): node
            for node in baseline_graph.get("nodes", [])
            if isinstance(node, dict) and node.get("id")
        }
        candidate_nodes = {
            str(node.get("id")): node
            for node in candidate_graph.get("nodes", [])
            if isinstance(node, dict) and node.get("id")
        }

        baseline_edges = self._edge_map(baseline_graph.get("edges", []))
        candidate_edges = self._edge_map(candidate_graph.get("edges", []))

        added_nodes = [candidate_nodes[node_id] for node_id in sorted(set(candidate_nodes) - set(baseline_nodes))]
        removed_nodes = [baseline_nodes[node_id] for node_id in sorted(set(baseline_nodes) - set(candidate_nodes))]

        modified_nodes: List[Dict[str, Any]] = []
        for node_id in sorted(set(baseline_nodes) & set(candidate_nodes)):
            if baseline_nodes[node_id] != candidate_nodes[node_id]:
                modified_nodes.append(
                    {
                        "id": node_id,
                        "before": baseline_nodes[node_id],
                        "after": candidate_nodes[node_id],
                    }
                )

        added_edges = [candidate_edges[key] for key in sorted(set(candidate_edges) - set(baseline_edges))]
        removed_edges = [baseline_edges[key] for key in sorted(set(baseline_edges) - set(candidate_edges))]

        modified_edges: List[Dict[str, Any]] = []
        for key in sorted(set(baseline_edges) & set(candidate_edges)):
            if baseline_edges[key] != candidate_edges[key]:
                modified_edges.append(
                    {
                        "id": key,
                        "before": baseline_edges[key],
                        "after": candidate_edges[key],
                    }
                )

        return {
            "baseline_snapshot_id": baseline_snapshot_id,
            "candidate_snapshot_id": candidate_snapshot_id,
            "computed_at": datetime.now(timezone.utc).isoformat(),
            "summary": {
                "added_nodes": len(added_nodes),
                "removed_nodes": len(removed_nodes),
                "modified_nodes": len(modified_nodes),
                "added_edges": len(added_edges),
                "removed_edges": len(removed_edges),
                "modified_edges": len(modified_edges),
            },
            "added_nodes": added_nodes,
            "removed_nodes": removed_nodes,
            "modified_nodes": modified_nodes,
            "added_edges": added_edges,
            "removed_edges": removed_edges,
            "modified_edges": modified_edges,
        }

    def _path(self, snapshot_id: str) -> Path:
        safe = "".join(ch for ch in snapshot_id if ch.isalnum() or ch in {"-", "_"}).strip()
        if not safe:
            safe = "invalid"
        return self._root / f"{safe}.json"

    @staticmethod
    def _edge_key(edge: Dict[str, Any]) -> str:
        source = str(edge.get("source") or "")
        rel_type = str(edge.get("type") or "")
        target = str(edge.get("target") or "")
        return f"{source}::{rel_type}::{target}"

    def _edge_map(self, edges: Any) -> Dict[str, Dict[str, Any]]:
        edge_map: Dict[str, Dict[str, Any]] = {}
        if not isinstance(edges, list):
            return edge_map
        for edge in edges:
            if not isinstance(edge, dict):
                continue
            key = self._edge_key(edge)
            if key == "::::":
                continue
            edge_map[key] = edge
        return edge_map

    @staticmethod
    def _to_record(meta: Dict[str, Any]) -> GraphSnapshotRecord:
        return GraphSnapshotRecord(
            snapshot_id=str(meta.get("snapshot_id") or ""),
            case_id=(str(meta.get("case_id")) if meta.get("case_id") is not None else None),
            created_at=str(meta.get("created_at") or ""),
            node_count=int(meta.get("node_count") or 0),
            edge_count=int(meta.get("edge_count") or 0),
            checksum=str(meta.get("checksum") or ""),
            notes=(str(meta.get("notes")) if meta.get("notes") is not None else None),
        )


_snapshot_service: GraphSnapshotService | None = None


def get_graph_snapshot_service() -> GraphSnapshotService:
    global _snapshot_service
    if _snapshot_service is None:
        _snapshot_service = GraphSnapshotService(GraphService())
    return _snapshot_service
