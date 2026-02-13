from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List

from ..storage.workflow_store import WorkflowStore
from ..workflow.registry import get_phase_registry
from .graph import GraphService


@dataclass
class PhaseRunResult:
    run_id: str
    phase: str
    payload: Dict[str, Any]
    artifacts: List[Dict[str, str]]


class CaseWorkflowService:
    def __init__(self, storage_path: Path) -> None:
        self.store = WorkflowStore(storage_path)
        self.registry = get_phase_registry()
        self.graph_service = GraphService()

    def run_phases(self, case_id: str, phases: List[str], payload: Dict[str, Any]) -> List[PhaseRunResult]:
        results: List[PhaseRunResult] = []
        for phase in phases:
            definition = self.registry[phase]
            output = definition.handler(case_id=case_id, payload=payload)
            if isinstance(output, dict) and ("entities" in output or "triples" in output):
                graph_delta = self.graph_service.apply_extraction_payload(output)
                output.setdefault("graph_delta", graph_delta)
            run_id = self.store.save_phase_run(case_id, phase, output)
            artifacts = self.store.save_artifacts(case_id, run_id, output)
            llama_nodes = output.get("llama_nodes") if isinstance(output, dict) else None
            if llama_nodes:
                self.graph_service.upsert_llama_nodes(llama_nodes)
            self.graph_service.upsert_payload(output, phase=phase, run_id=run_id, case_id=case_id)
            results.append(PhaseRunResult(run_id=run_id, phase=phase, payload=output, artifacts=artifacts))
        return results
