from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

from ..utils.storage import atomic_write_json, safe_path


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class EvidenceBinderStore:
    def __init__(self, base_path: Path) -> None:
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _binder_path(self, binder_id: str) -> Path:
        return safe_path(self.base_path, binder_id, suffix=".json")

    def list_binders(self) -> List[Dict[str, Any]]:
        binders: List[Dict[str, Any]] = []
        for path in sorted(self.base_path.glob("*.json")):
            try:
                binders.append(json.loads(path.read_text()))
            except json.JSONDecodeError:
                continue
        return binders

    def create_binder(self, *, name: str, description: Optional[str] = None) -> Dict[str, Any]:
        binder_id = uuid4().hex
        record = {
            "id": binder_id,
            "name": name,
            "description": description,
            "created_at": _utc_now(),
            "updated_at": _utc_now(),
            "items": [],
        }
        atomic_write_json(self._binder_path(binder_id), record)
        return record

    def get_binder(self, binder_id: str) -> Dict[str, Any]:
        path = self._binder_path(binder_id)
        if not path.exists():
            raise KeyError("Evidence binder not found")
        return json.loads(path.read_text())

    def update_binder(self, binder_id: str, *, name: Optional[str], description: Optional[str]) -> Dict[str, Any]:
        record = self.get_binder(binder_id)
        if name is not None:
            record["name"] = name
        if description is not None:
            record["description"] = description
        record["updated_at"] = _utc_now()
        atomic_write_json(self._binder_path(binder_id), record)
        return record

    def delete_binder(self, binder_id: str) -> None:
        path = self._binder_path(binder_id)
        if not path.exists():
            raise KeyError("Evidence binder not found")
        path.unlink()

    def add_item(self, binder_id: str, item: Dict[str, Any]) -> Dict[str, Any]:
        record = self.get_binder(binder_id)
        record.setdefault("items", []).append(item)
        record["updated_at"] = _utc_now()
        atomic_write_json(self._binder_path(binder_id), record)
        return record
