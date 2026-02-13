from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict, Iterable, List, Sequence

from .crypto_models import ProvenanceRecord
from .bridge_registry import BridgeRegistry


@dataclass(frozen=True)
class HeuristicMatch:
    source: str
    target: str
    confidence: float
    provenance: ProvenanceRecord


class HeuristicRegistry:
    def __init__(self) -> None:
        self._registry: Dict[str, Callable[..., Sequence[HeuristicMatch]]] = {}

    def register(self, name: str, func: Callable[..., Sequence[HeuristicMatch]]) -> None:
        self._registry[name] = func

    def run(self, name: str, *args: object, **kwargs: object) -> List[HeuristicMatch]:
        if name not in self._registry:
            raise KeyError(f"Unknown heuristic: {name}")
        results = self._registry[name](*args, **kwargs)
        return list(results)

    def available(self) -> Iterable[str]:
        return sorted(self._registry.keys())


def match_bridge_transfers(
    registry: BridgeRegistry,
    *,
    source_transfers: Sequence[dict],
    dest_transfers: Sequence[dict],
    window_seconds: int = 600,
    amount_tolerance: float = 0.01,
) -> List[dict]:
    matches: List[dict] = []
    bridge_names = list(registry.list())
    bridge_name = bridge_names[0] if bridge_names else None
    for src in source_transfers:
        for dst in dest_transfers:
            if src.get("token") != dst.get("token"):
                continue
            if abs(float(src.get("amount", 0)) - float(dst.get("amount", 0))) > amount_tolerance:
                continue
            if abs(int(src.get("timestamp", 0)) - int(dst.get("timestamp", 0))) > window_seconds:
                continue
            matches.append(
                {
                    "bridge": bridge_name,
                    "source": src,
                    "destination": dst,
                }
            )
    return matches
