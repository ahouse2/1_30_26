from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, Optional


def build_legal_process_record(exchange: str, case_id: str, notes: Optional[str] = None) -> Dict[str, object]:
    return {
        "exchange": exchange,
        "case_id": case_id,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "notes": notes or "",
    }
