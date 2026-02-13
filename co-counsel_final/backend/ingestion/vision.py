"""Vision model helper for image understanding in ingestion."""

from __future__ import annotations

import base64
import json
import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import httpx

from .settings import VisionConfig


@dataclass
class VisionResult:
    caption: str
    labels: List[str]
    categories: List[str]
    objects: List[str]
    confidence: Optional[float]
    raw: Dict[str, Any]


class VisionAnalyzer:
    """Calls a configured vision endpoint to classify and caption images."""

    def __init__(self, config: VisionConfig, logger: logging.Logger) -> None:
        self.config = config
        self.logger = logger

    def analyze(self, image_bytes: bytes, *, source: str | None = None) -> Optional[VisionResult]:
        if not self.config.endpoint:
            return None
        payload = {
            "model": self.config.model or "vision-large",
            "image": base64.b64encode(image_bytes).decode("ascii"),
            "prompt": self.config.prompt,
            "source": source,
        }
        headers = {"Content-Type": "application/json"}
        if self.config.api_key:
            headers["Authorization"] = f"Bearer {self.config.api_key}"
        try:
            with httpx.Client(timeout=45.0) as client:
                response = client.post(self.config.endpoint, headers=headers, content=json.dumps(payload))
                response.raise_for_status()
                data = response.json()
        except Exception as exc:  # pragma: no cover - network failures
            self.logger.warning("Vision analyzer failed", extra={"error": str(exc)})
            return None

        caption = _extract_caption(data)
        labels = _extract_list(data, "labels")
        categories = _extract_list(data, "categories")
        objects = _extract_list(data, "objects")
        confidence = _extract_confidence(data)
        return VisionResult(
            caption=caption,
            labels=labels,
            categories=categories,
            objects=objects,
            confidence=confidence,
            raw=data if isinstance(data, dict) else {"raw": data},
        )


def _extract_caption(data: Any) -> str:
    if isinstance(data, dict):
        for key in ("caption", "summary", "text", "description"):
            value = data.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    if isinstance(data, str):
        return data.strip()
    return ""


def _extract_list(data: Any, key: str) -> List[str]:
    if isinstance(data, dict):
        value = data.get(key)
        if isinstance(value, list):
            return [str(item) for item in value if str(item).strip()]
        if isinstance(value, str) and value.strip():
            return [item.strip() for item in value.split(",") if item.strip()]
    return []


def _extract_confidence(data: Any) -> Optional[float]:
    if isinstance(data, dict):
        value = data.get("confidence")
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None
    return None


__all__ = ["VisionAnalyzer", "VisionResult"]
