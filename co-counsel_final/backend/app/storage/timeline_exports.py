from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from uuid import uuid4


@dataclass
class TimelineExportRecord:
    export_id: str
    format: str
    filename: str
    path: Path
    created_at: str
    case_id: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "export_id": self.export_id,
            "format": self.format,
            "filename": self.filename,
            "path": str(self.path),
            "created_at": self.created_at,
            "case_id": self.case_id,
        }

    @classmethod
    def from_dict(cls, payload: dict) -> "TimelineExportRecord":
        return cls(
            export_id=str(payload["export_id"]),
            format=str(payload["format"]),
            filename=str(payload["filename"]),
            path=Path(payload["path"]),
            created_at=str(payload["created_at"]),
            case_id=payload.get("case_id"),
        )


class TimelineExportStore:
    def __init__(self, base_path: Path) -> None:
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def save_export(
        self,
        case_id: Optional[str],
        export_format: str,
        content: bytes,
        filename: str,
    ) -> TimelineExportRecord:
        export_id = uuid4().hex
        export_dir = self.base_path / export_id
        export_dir.mkdir(parents=True, exist_ok=True)
        export_path = export_dir / filename
        export_path.write_bytes(content)
        record = TimelineExportRecord(
            export_id=export_id,
            format=export_format,
            filename=filename,
            path=export_path,
            created_at=datetime.now(timezone.utc).isoformat(),
            case_id=case_id,
        )
        (export_dir / "metadata.json").write_text(json.dumps(record.to_dict(), indent=2))
        return record

    def get_export(self, export_id: str) -> TimelineExportRecord:
        metadata_path = self.base_path / export_id / "metadata.json"
        if not metadata_path.exists():
            raise FileNotFoundError(f"Timeline export {export_id} not found")
        payload = json.loads(metadata_path.read_text())
        return TimelineExportRecord.from_dict(payload)
