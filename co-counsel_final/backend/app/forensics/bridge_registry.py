from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Iterable, Any


class BridgeRegistry:
    def __init__(self, payload: Dict[str, Any] | None = None, *, registry_path: Path | None = None) -> None:
        if payload is None:
            registry_path = registry_path or self._default_registry_path()
            payload = self._load_registry(registry_path)
        self._bridges: Dict[str, Any] = dict(payload)

    def list(self) -> Iterable[str]:
        return sorted(self._bridges.keys())

    def get(self, name: str) -> Dict[str, Any] | None:
        entry = self._bridges.get(name)
        return dict(entry) if isinstance(entry, dict) else None

    def _load_registry(self, path: Path) -> Dict[str, Any]:
        if not path.exists():
            return {}
        payload = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(payload, dict):
            return {}
        return payload

    @staticmethod
    def _default_registry_path() -> Path:
        return Path(__file__).resolve().parent / "data" / "bridge_registry.json"
