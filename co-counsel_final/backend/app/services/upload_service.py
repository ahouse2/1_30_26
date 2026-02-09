from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List
from uuid import uuid4

from backend.app.utils.storage import atomic_write_json, read_json, safe_path, sanitise_identifier


@dataclass
class FolderSession:
    folder_id: str
    case_id: str
    folder_name: str
    doc_type: str


class UploadService:
    def __init__(self, root: Path, *, chunk_size: int = 8 * 1024 * 1024) -> None:
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self.chunk_size = chunk_size
        self._folders_root = self.root / "folders"
        self._uploads_root = self.root / "uploads"
        self._folders_root.mkdir(parents=True, exist_ok=True)
        self._uploads_root.mkdir(parents=True, exist_ok=True)

    def start_folder_upload(self, folder_name: str, doc_type: str) -> Dict[str, Any]:
        folder_id = uuid4().hex
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        case_slug = sanitise_identifier(folder_name or "case")
        case_id = f"{case_slug}-{timestamp}"
        folder_dir = self._folder_dir(folder_id)
        (folder_dir / "files").mkdir(parents=True, exist_ok=True)
        (folder_dir / "chunks").mkdir(parents=True, exist_ok=True)
        payload = {
            "folder_id": folder_id,
            "case_id": case_id,
            "folder_name": folder_name,
            "doc_type": doc_type,
            "files": [],
        }
        atomic_write_json(folder_dir / "folder.json", payload)
        return {"folder_id": folder_id, "case_id": case_id, "chunk_size": self.chunk_size}

    def start_file_upload(self, folder_id: str, relative_path: str, total_bytes: int) -> Dict[str, Any]:
        folder_dir = self._folder_dir(folder_id)
        if not folder_dir.exists():
            raise FileNotFoundError(f"Folder session {folder_id} not found")
        folder_payload = self.get_folder_payload(folder_id)
        safe_relative = self._sanitize_relative_path(relative_path)
        upload_id = uuid4().hex
        chunk_dir = folder_dir / "chunks" / upload_id
        chunk_dir.mkdir(parents=True, exist_ok=True)
        final_path = folder_dir / "files" / safe_relative
        final_path.parent.mkdir(parents=True, exist_ok=True)
        session_payload = {
            "upload_id": upload_id,
            "folder_id": folder_id,
            "relative_path": str(safe_relative),
            "total_bytes": int(total_bytes),
            "chunk_dir": str(chunk_dir),
            "final_path": str(final_path),
            "received_chunks": [],
        }
        atomic_write_json(self._upload_session_path(upload_id), session_payload)
        return {
            "upload_id": upload_id,
            "chunk_size": self.chunk_size,
            "folder_id": folder_id,
            "case_id": folder_payload.get("case_id"),
            "relative_path": str(safe_relative),
        }

    def append_chunk(self, upload_id: str, chunk_index: int, data: bytes) -> None:
        session = self._read_upload_session(upload_id)
        chunk_dir = Path(session["chunk_dir"])
        chunk_file = chunk_dir / f"chunk_{int(chunk_index):06d}.part"
        chunk_file.write_bytes(data)
        received: List[int] = list({*session.get("received_chunks", []), int(chunk_index)})
        received.sort()
        session["received_chunks"] = received
        atomic_write_json(self._upload_session_path(upload_id), session)

    def complete_file(self, upload_id: str) -> Dict[str, Any]:
        session = self._read_upload_session(upload_id)
        chunk_dir = Path(session["chunk_dir"])
        final_path = Path(session["final_path"])
        chunks = sorted(chunk_dir.glob("chunk_*.part"))
        with final_path.open("wb") as handle:
            for chunk in chunks:
                handle.write(chunk.read_bytes())
        folder_id = session.get("folder_id")
        if folder_id:
            folder_payload = self.get_folder_payload(folder_id)
            folder_payload.setdefault("files", [])
            folder_payload["files"].append(
                {
                    "upload_id": upload_id,
                    "relative_path": session["relative_path"],
                    "final_path": str(final_path),
                    "total_bytes": session.get("total_bytes"),
                }
            )
            atomic_write_json(self._folder_dir(folder_id) / "folder.json", folder_payload)
        return {"upload_id": upload_id, "relative_path": session["relative_path"], "final_path": str(final_path)}

    def get_folder_payload(self, folder_id: str) -> Dict[str, Any]:
        folder_dir = self._folder_dir(folder_id)
        payload_path = folder_dir / "folder.json"
        if not payload_path.exists():
            raise FileNotFoundError(f"Folder session {folder_id} not found")
        return read_json(payload_path)

    def get_folder_files_dir(self, folder_id: str) -> Path:
        return self._folder_dir(folder_id) / "files"

    def _folder_dir(self, folder_id: str) -> Path:
        safe_folder = sanitise_identifier(folder_id)
        return self._folders_root / safe_folder

    def _upload_session_path(self, upload_id: str) -> Path:
        return safe_path(self._uploads_root, upload_id)

    def _read_upload_session(self, upload_id: str) -> Dict[str, Any]:
        return read_json(self._upload_session_path(upload_id))

    def _sanitize_relative_path(self, relative_path: str) -> Path:
        parts = Path(relative_path).parts
        safe_parts: List[str] = []
        for part in parts:
            if part in ("", ".", ".."):
                continue
            safe_parts.append(sanitise_identifier(part))
        if not safe_parts:
            safe_parts = [uuid4().hex]
        return Path(*safe_parts)
