from __future__ import annotations

from pathlib import Path
from typing import Any, Dict
from uuid import uuid4

from backend.app.utils.storage import atomic_write_json, read_json, safe_path


class UploadSessionStore:
    def __init__(self, root: Path) -> None:
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def create_folder_session(self, folder_name: str, doc_type: str) -> Dict[str, Any]:
        folder_id = uuid4().hex
        payload = {
            "folder_id": folder_id,
            "folder_name": folder_name,
            "doc_type": doc_type,
            "files": [],
        }
        atomic_write_json(safe_path(self.root, folder_id), payload)
        return payload

    def read_folder_session(self, folder_id: str) -> Dict[str, Any]:
        return read_json(safe_path(self.root, folder_id))
