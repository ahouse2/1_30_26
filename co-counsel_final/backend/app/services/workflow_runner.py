from __future__ import annotations

import json
import threading
import time
from typing import Callable, Dict, List, Optional

from ..services.workflow import CaseWorkflowService
from ..storage.workflow_run_store import WorkflowRunStore


class WorkflowRunner:
    def __init__(
        self,
        *,
        run_store: WorkflowRunStore,
        workflow_service_factory: Callable[[], CaseWorkflowService],
        poll_interval: float = 1.0,
    ) -> None:
        self.run_store = run_store
        self.workflow_service_factory = workflow_service_factory
        self.poll_interval = poll_interval
        self._threads: Dict[str, threading.Thread] = {}
        self._lock = threading.Lock()

    def create_run(self, case_id: str, phases: List[str]) -> Dict[str, object]:
        run = self.run_store.create_run(case_id=case_id, phases=phases)
        self.run_store.append_event(case_id, run["run_id"], "run_created", {"phases": phases})
        return run

    def start_run(self, case_id: str, phases: List[str]) -> Dict[str, object]:
        run = self.create_run(case_id, phases)
        self._start_thread(case_id, run["run_id"], start_index=0)
        return run

    def resume_run(self, case_id: str, run_id: str) -> Dict[str, object]:
        run = self.run_store.set_control(case_id, run_id, pause=False)
        if run.get("status") == "paused":
            start_index = self.run_store.next_queued_phase_index(run)
            if start_index == -1:
                return self.run_store.update_status(case_id, run_id, "succeeded")
            self._start_thread(case_id, run_id, start_index=start_index)
        return run

    def pause_run(self, case_id: str, run_id: str) -> Dict[str, object]:
        run = self.run_store.set_control(case_id, run_id, pause=True)
        self.run_store.append_event(case_id, run_id, "run_pause_requested", {})
        return run

    def stop_run(self, case_id: str, run_id: str) -> Dict[str, object]:
        run = self.run_store.set_control(case_id, run_id, stop=True)
        self.run_store.append_event(case_id, run_id, "run_stop_requested", {})
        return run

    def retry_phase(self, case_id: str, run_id: str, phase: str | None = None) -> Dict[str, object]:
        run = self.run_store.get_run(case_id, run_id)
        target_phase = phase or self._first_failed_phase(run)
        if not target_phase:
            return run
        self.run_store.update_phase(
            case_id,
            run_id,
            target_phase,
            status="queued",
            error=None,
            run_id=None,
            artifacts=[],
            summary={},
            started_at=None,
            completed_at=None,
        )
        self.run_store.update_status(case_id, run_id, "running", current_phase=None)
        self.run_store.append_event(case_id, run_id, "phase_retry_requested", {"phase": target_phase})
        run = self.run_store.get_run(case_id, run_id)
        start_index = self.run_store.find_phase_index(run, target_phase)
        self._start_thread(case_id, run_id, start_index=start_index)
        return run

    def execute_run(self, run_id: str) -> None:
        run = self._get_run_by_id(run_id)
        if run:
            self._execute(run["case_id"], run_id, start_index=0)

    def _start_thread(self, case_id: str, run_id: str, *, start_index: int) -> None:
        with self._lock:
            existing = self._threads.get(run_id)
            if existing and existing.is_alive():
                return
            thread = threading.Thread(
                target=self._execute,
                args=(case_id, run_id, start_index),
                daemon=True,
            )
            self._threads[run_id] = thread
            thread.start()

    def _execute(self, case_id: str, run_id: str, start_index: int) -> None:
        service = self.workflow_service_factory()
        run = self.run_store.update_status(case_id, run_id, "running")
        self.run_store.append_event(case_id, run_id, "run_started", {"start_index": start_index})
        phases = run.get("phases", [])
        for idx in range(start_index, len(phases)):
            run = self.run_store.get_run(case_id, run_id)
            if run.get("control", {}).get("stop"):
                self.run_store.update_status(case_id, run_id, "stopped")
                self.run_store.append_event(case_id, run_id, "run_stopped", {})
                return
            if run.get("control", {}).get("pause"):
                self.run_store.update_status(case_id, run_id, "paused")
                self.run_store.append_event(case_id, run_id, "run_paused", {})
                if not self._wait_for_resume(case_id, run_id):
                    return
            phase_name = phases[idx].get("phase")
            if not phase_name:
                continue
            self.run_store.update_status(case_id, run_id, "running", current_phase=phase_name)
            self.run_store.update_phase(
                case_id,
                run_id,
                phase_name,
                status="running",
                started_at=self.run_store._now_iso(),
            )
            self.run_store.append_event(case_id, run_id, "phase_started", {"phase": phase_name})
            try:
                results = service.run_phases(case_id=case_id, phases=[phase_name], payload={})
                phase_run = results[0]
                summary = self._build_summary(phase_run.payload)
                self.run_store.update_phase(
                    case_id,
                    run_id,
                    phase_name,
                    status="succeeded",
                    run_id=phase_run.run_id,
                    artifacts=phase_run.artifacts,
                    summary=summary,
                    completed_at=self.run_store._now_iso(),
                )
                self.run_store.append_event(
                    case_id,
                    run_id,
                    "phase_completed",
                    {"phase": phase_name, "summary": summary},
                )
            except Exception as exc:  # pragma: no cover - defensive guard
                self.run_store.update_phase(
                    case_id,
                    run_id,
                    phase_name,
                    status="failed",
                    error=str(exc),
                    completed_at=self.run_store._now_iso(),
                )
                self.run_store.update_status(case_id, run_id, "failed", current_phase=phase_name)
                self.run_store.append_event(case_id, run_id, "phase_failed", {"phase": phase_name, "error": str(exc)})
                return
        self.run_store.update_status(case_id, run_id, "succeeded")
        self.run_store.append_event(case_id, run_id, "run_completed", {})

    def _wait_for_resume(self, case_id: str, run_id: str) -> bool:
        while True:
            run = self.run_store.get_run(case_id, run_id)
            if run.get("control", {}).get("stop"):
                self.run_store.update_status(case_id, run_id, "stopped")
                self.run_store.append_event(case_id, run_id, "run_stopped", {})
                return False
            if not run.get("control", {}).get("pause"):
                self.run_store.update_status(case_id, run_id, "running")
                self.run_store.append_event(case_id, run_id, "run_resumed", {})
                return True
            time.sleep(self.poll_interval)

    def _build_summary(self, payload: Dict[str, object]) -> Dict[str, object]:
        summary: Dict[str, object] = {}
        if isinstance(payload, dict):
            graph_delta = payload.get("graph_delta")
            if isinstance(graph_delta, dict):
                summary.update(graph_delta)
            events = payload.get("events")
            if isinstance(events, list):
                summary["timeline_events"] = len(events)
            citations = payload.get("citations")
            if isinstance(citations, list):
                summary["citations"] = len(citations)
            forensics = payload.get("forensics")
            if isinstance(forensics, dict):
                summary["forensics_artifacts"] = len(forensics.get("artifacts", []) or [])
        return summary

    def _first_failed_phase(self, run: Dict[str, object]) -> Optional[str]:
        for entry in run.get("phases", []):
            if entry.get("status") == "failed":
                return entry.get("phase")
        return None

    def _get_run_by_id(self, run_id: str) -> Optional[Dict[str, object]]:
        for case_dir in self.run_store.base_path.iterdir():
            if not case_dir.is_dir():
                continue
            candidate = case_dir / f"run_{run_id}.json"
            if candidate.exists():
                payload = json.loads(candidate.read_text())
                return {"case_id": case_dir.name, **payload}
        return None


_RUNNER: WorkflowRunner | None = None
_RUNNER_LOCK = threading.Lock()


def get_workflow_runner(storage_path: Path) -> WorkflowRunner:
    global _RUNNER
    with _RUNNER_LOCK:
        if _RUNNER is None:
            store = WorkflowRunStore(storage_path)
            _RUNNER = WorkflowRunner(
                run_store=store,
                workflow_service_factory=lambda: CaseWorkflowService(storage_path),
            )
        return _RUNNER
