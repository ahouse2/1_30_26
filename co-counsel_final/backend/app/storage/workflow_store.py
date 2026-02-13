from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict
from uuid import uuid4


class WorkflowStore:
    def __init__(self, base_path: Path) -> None:
        self.base_path = base_path
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _case_dir(self, case_id: str) -> Path:
        path = self.base_path / case_id
        path.mkdir(parents=True, exist_ok=True)
        return path

    def save_phase_run(self, case_id: str, phase: str, payload: Dict[str, Any]) -> str:
        run_id = uuid4().hex
        record = {
            "run_id": run_id,
            "phase": phase,
            "payload": payload,
            "created_at": datetime.utcnow().isoformat(),
        }
        path = self._case_dir(case_id) / f"phase_{run_id}.json"
        path.write_text(json.dumps(record, indent=2))
        return run_id


    def save_artifacts(self, case_id: str, run_id: str, payload: Dict[str, Any]) -> list[Dict[str, str]]:
        artifacts_dir = self._case_dir(case_id) / "artifacts"
        artifacts_dir.mkdir(parents=True, exist_ok=True)
        json_path = artifacts_dir / f"{run_id}.json"
        md_path = artifacts_dir / f"{run_id}.md"
        json_path.write_text(json.dumps(payload, indent=2))
        md_path.write_text(self._render_markdown(payload))
        return [
            {"artifact_id": run_id, "format": "json", "path": str(json_path)},
            {"artifact_id": run_id, "format": "md", "path": str(md_path)},
        ]

    def _render_markdown(self, payload: Dict[str, Any]) -> str:
        lines = ["# Phase Output", "", "## Summary", ""]
        for key, value in payload.items():
            lines.append(f"- **{key}**: {value}")
        lines.append("")
        return "\n".join(lines)

    def get_phase_run(self, case_id: str, run_id: str) -> Dict[str, Any]:
        path = self._case_dir(case_id) / f"phase_{run_id}.json"
        return json.loads(path.read_text())
