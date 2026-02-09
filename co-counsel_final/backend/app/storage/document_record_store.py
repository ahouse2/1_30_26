from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List

from ..utils.storage import atomic_write_json, read_json, safe_path


class DocumentRecordStore:
    """Persist document metadata records keyed by document id."""

    def __init__(self, root: Path) -> None:
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, doc_id: str) -> Path:
        return safe_path(self.root, doc_id)

    def write_document(self, doc_id: str, payload: Dict[str, Any]) -> None:
        path = self._path(doc_id)
        atomic_write_json(path, payload)

    def read_document(self, doc_id: str) -> Dict[str, Any]:
        path = self._path(doc_id)
        if not path.exists():
            raise FileNotFoundError(f"Document record {doc_id} not found")
        return read_json(path)

    def list_documents(self) -> List[Dict[str, Any]]:
        documents: List[Dict[str, Any]] = []
        for path in sorted(self.root.glob("*.json")):
            try:
                documents.append(read_json(path))
            except (OSError, ValueError):
                continue
        return documents

    def remove(self, doc_id: str) -> None:
        path = self._path(doc_id)
        if not path.exists():
            raise FileNotFoundError(f"Document record {doc_id} not found")
        path.unlink()

    def clear(self) -> None:
        for path in self.root.glob("*.json"):
            path.unlink(missing_ok=True)
