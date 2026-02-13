from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple
from uuid import uuid4


class WorkflowRunStore:
    def __init__(self, base_path: Path) -> None:
        self.base_path = base_path
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _case_dir(self, case_id: str) -> Path:
        path = self.base_path / case_id
        path.mkdir(parents=True, exist_ok=True)
        return path

    def _run_path(self, case_id: str, run_id: str) -> Path:
        return self._case_dir(case_id) / f"run_{run_id}.json"

    def _events_path(self, case_id: str, run_id: str) -> Path:
        return self._case_dir(case_id) / f"run_{run_id}_events.jsonl"

    def create_run(self, case_id: str, phases: List[str]) -> Dict[str, Any]:
        now = self._now_iso()
        run_id = uuid4().hex
        phase_states = [
            {
                "phase": phase,
                "status": "queued",
                "run_id": None,
                "artifacts": [],
                "summary": {},
                "started_at": None,
                "completed_at": None,
                "error": None,
            }
            for phase in phases
        ]
        record = {
            "run_id": run_id,
            "case_id": case_id,
            "requested_phases": list(phases),
            "status": "queued",
            "control": {"pause": False, "stop": False},
            "current_phase": None,
            "created_at": now,
            "updated_at": now,
            "completed_at": None,
            "phases": phase_states,
        }
        self._run_path(case_id, run_id).write_text(json.dumps(record, indent=2))
        return record

    def get_run(self, case_id: str, run_id: str) -> Dict[str, Any]:
        return json.loads(self._run_path(case_id, run_id).read_text())

    def write_run(self, case_id: str, run: Dict[str, Any]) -> None:
        run["updated_at"] = self._now_iso()
        self._run_path(case_id, run["run_id"]).write_text(json.dumps(run, indent=2))

    def update_status(self, case_id: str, run_id: str, status: str, *, current_phase: str | None = None) -> Dict[str, Any]:
        run = self.get_run(case_id, run_id)
        run["status"] = status
        run["current_phase"] = current_phase
        if status in {"succeeded", "failed", "stopped"}:
            run["completed_at"] = self._now_iso()
        self.write_run(case_id, run)
        return run

    def set_control(self, case_id: str, run_id: str, *, pause: bool | None = None, stop: bool | None = None) -> Dict[str, Any]:
        run = self.get_run(case_id, run_id)
        control = run.get("control", {})
        if pause is not None:
            control["pause"] = pause
        if stop is not None:
            control["stop"] = stop
        run["control"] = control
        self.write_run(case_id, run)
        return run

    def update_phase(self, case_id: str, run_id: str, phase: str, **updates: Any) -> Dict[str, Any]:
        run = self.get_run(case_id, run_id)
        for entry in run.get("phases", []):
            if entry.get("phase") == phase:
                entry.update(updates)
                break
        self.write_run(case_id, run)
        return run

    def append_event(self, case_id: str, run_id: str, event_type: str, payload: Dict[str, Any]) -> None:
        record = {
            "event": event_type,
            "timestamp": self._now_iso(),
            "payload": payload,
        }
        path = self._events_path(case_id, run_id)
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record))
            handle.write("\n")

    def read_events(self, case_id: str, run_id: str, *, since: int = 0) -> Tuple[List[Dict[str, Any]], int]:
        path = self._events_path(case_id, run_id)
        if not path.exists():
            return [], since
        lines = path.read_text().splitlines()
        sliced = lines[since:]
        events = [json.loads(line) for line in sliced if line.strip()]
        return events, len(lines)

    def find_phase_index(self, run: Dict[str, Any], phase: str) -> int:
        for idx, entry in enumerate(run.get("phases", [])):
            if entry.get("phase") == phase:
                return idx
        return -1

    def next_queued_phase_index(self, run: Dict[str, Any]) -> int:
        for idx, entry in enumerate(run.get("phases", [])):
            if entry.get("status") == "queued":
                return idx
        return -1

    @staticmethod
    def _now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()
