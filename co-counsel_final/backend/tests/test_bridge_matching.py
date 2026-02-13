from __future__ import annotations

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.app.forensics.bridge_registry import BridgeRegistry
from backend.app.forensics.crypto_heuristics import match_bridge_transfers


def test_bridge_match_on_value_time_window() -> None:
    registry = BridgeRegistry({"example": {"source_chain": 1, "dest_chain": 42161}})
    matches = match_bridge_transfers(
        registry,
        source_transfers=[{"amount": 1.0, "token": "USDC", "timestamp": 1000}],
        dest_transfers=[{"amount": 1.0, "token": "USDC", "timestamp": 1050}],
        window_seconds=120,
    )
    assert matches, "Expected at least one bridge match"
