from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path
from threading import Lock
from typing import Any, Dict, Optional

_GENESIS_HASH = "0" * 64


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _normalise(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc).isoformat()
    if isinstance(value, dict):
        return {str(key): _normalise(val) for key, val in value.items()}
    if isinstance(value, (list, tuple)):
        return [_normalise(item) for item in value]
    if isinstance(value, set):
        return [_normalise(item) for item in sorted(value)]
    return value


def _canonical_payload(payload: Dict[str, Any]) -> str:
    return json.dumps(payload, separators=(",", ":"), sort_keys=True)


@dataclass(frozen=True)
class PaymentEvent:
    provider: str
    case_id: str
    docket_id: Optional[str]
    document_id: Optional[str]
    event_type: str
    amount_estimate: Optional[float] = None
    amount_actual: Optional[float] = None
    currency: str = "USD"
    requested_by: str = "unknown"
    authorized_by: Optional[str] = None
    status: str = "pending"
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=_utc_now)

    def to_payload(self) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "version": 1,
            "timestamp": _normalise(self.created_at),
            "provider": self.provider,
            "case_id": self.case_id,
            "docket_id": self.docket_id,
            "document_id": self.document_id,
            "event_type": self.event_type,
            "amount_estimate": self.amount_estimate,
            "amount_actual": self.amount_actual,
            "currency": self.currency,
            "requested_by": self.requested_by,
            "authorized_by": self.authorized_by,
            "status": self.status,
            "metadata": _normalise(self.metadata),
        }
        return payload


class CourtPaymentLedger:
    """Append-only JSONL ledger with hash chaining for paid court retrievals."""

    def __init__(self, path: Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()
        self._last_hash = self._load_last_hash()

    def _load_last_hash(self) -> str:
        if not self.path.exists():
            return _GENESIS_HASH
        last_hash = _GENESIS_HASH
        with self.path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    continue
                candidate = record.get("hash")
                if isinstance(candidate, str) and len(candidate) == 64:
                    last_hash = candidate
        return last_hash or _GENESIS_HASH

    def append(self, event: PaymentEvent) -> str:
        payload = event.to_payload()
        canonical = _canonical_payload(payload)
        with self._lock:
            prev_hash = self._last_hash or _GENESIS_HASH
            event_hash = sha256(f"{prev_hash}:{canonical}".encode("utf-8")).hexdigest()
            record = dict(payload)
            record["prev_hash"] = prev_hash
            record["hash"] = event_hash
            with self.path.open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(record, sort_keys=True) + "\n")
            self._last_hash = event_hash
        return event_hash

    def verify(self) -> bool:
        prev_hash = _GENESIS_HASH
        if not self.path.exists():
            return True
        with self.path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                record = json.loads(line)
                expected_prev = record.get("prev_hash") or _GENESIS_HASH
                if expected_prev != prev_hash:
                    return False
                record_hash = record.get("hash")
                payload = {key: value for key, value in record.items() if key not in {"hash", "prev_hash"}}
                canonical = _canonical_payload(payload)
                computed = sha256(f"{prev_hash}:{canonical}".encode("utf-8")).hexdigest()
                if record_hash != computed:
                    return False
                prev_hash = record_hash
        return True
