from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class CourtSearchRequest(BaseModel):
    provider: str = Field(default="courtlistener")
    query: str
    case_id: str | None = None
    jurisdiction: str | None = None
    limit: int = Field(default=8, ge=1, le=50)


@router.get("/courts/providers")
async def court_provider_status() -> dict[str, Any]:
    return {
        "providers": [
            {"provider_id": "courtlistener", "ready": True, "reason": None},
            {"provider_id": "caselaw", "ready": True, "reason": None},
            {"provider_id": "pacer", "ready": False, "reason": "API key required"},
            {"provider_id": "unicourt", "ready": False, "reason": "API key required"},
            {"provider_id": "lacs", "ready": False, "reason": "API key required"},
        ]
    }


@router.post("/courts/search")
async def search_courts(payload: CourtSearchRequest) -> dict[str, Any]:
    base_results = [
        {
            "provider": payload.provider,
            "title": "Sample ruling on evidentiary objection",
            "case_id": payload.case_id or "CASE-001",
            "case_name": "People v. Sample",
            "court": "Superior Court",
            "jurisdiction": payload.jurisdiction or "CA",
            "docket_number": "24-CV-0199",
            "date_filed": "2026-01-11",
            "excerpt": "The court addressed admissibility standards for digital exhibits.",
            "source_url": "https://example.org/court/sample-ruling",
            "metadata": {"mode": "compatibility"},
        }
    ]
    return {
        "query": payload.query,
        "provider": payload.provider,
        "results": base_results[: payload.limit],
    }


@router.get("/courts/sync/status")
async def court_sync_status(case_id: str, jurisdiction: str | None = None) -> dict[str, Any]:
    return {
        "case_id": case_id,
        "jurisdiction": jurisdiction or "CA",
        "status": "completed",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "payment_queue": {
            "pending": 0,
            "authorized": 0,
            "total": 0,
        },
        "cases": [
            {
                "provider": "courtlistener",
                "case_id": case_id,
                "documents_found": 3,
                "latest_filed_at": datetime.now(timezone.utc).isoformat(),
            }
        ],
    }
