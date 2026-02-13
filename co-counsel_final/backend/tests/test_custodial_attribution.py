from __future__ import annotations

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.app.forensics.custodial_attribution import build_legal_process_record


def test_legal_process_record_requires_target() -> None:
    record = build_legal_process_record(exchange="coinbase", case_id="case-1")
    assert record["exchange"] == "coinbase"
    assert record["status"] == "pending"
