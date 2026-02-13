from __future__ import annotations

from typing import Any, Dict, List, Optional

import httpx

from .base import CourtConnector, CourtDocument, CourtSearchResult, ConnectorNotConfigured


class PacerConnector(CourtConnector):
    provider_id = "pacer"

    def __init__(self, api_key: Optional[str], base_url: Optional[str]) -> None:
        self._api_key = api_key
        self._base_url = base_url or ""

    def ensure_ready(self) -> None:
        if not self._base_url:
            raise ConnectorNotConfigured("PACER endpoint is not configured")

    async def _request_json(self, path: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        self.ensure_ready()
        target = self._base_url.rstrip("/") + "/" + path.lstrip("/")
        headers: Dict[str, str] = {"Accept": "application/json", "User-Agent": "CoCounsel-PACER-Connector/1.0"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            response = await client.get(target, params=params or {}, headers=headers)
            response.raise_for_status()
            return response.json() if "json" in response.headers.get("content-type", "").lower() else {}

    @staticmethod
    def _payload_items(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        for key in ("results", "items", "data", "cases", "dockets"):
            value = payload.get(key)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]
        return []

    async def search(
        self,
        query: str,
        *,
        jurisdiction: Optional[str] = None,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[CourtSearchResult]:
        params: Dict[str, Any] = {"q": query, "query": query, "limit": limit}
        if jurisdiction:
            params["jurisdiction"] = jurisdiction
        params.update(filters or {})
        payload = {}
        for path in ("search", "cases/search", "dockets/search"):
            try:
                payload = await self._request_json(path, params=params)
                if payload:
                    break
            except Exception:
                continue

        results: List[CourtSearchResult] = []
        for idx, item in enumerate(self._payload_items(payload)):
            case_id = str(item.get("id") or item.get("case_id") or item.get("docket_id") or f"pacer-{idx + 1}")
            caption = str(item.get("caption") or item.get("case_name") or item.get("title") or f"PACER result {idx + 1}")
            results.append(
                CourtSearchResult(
                    provider=self.provider_id,
                    case_id=case_id,
                    docket_id=str(item.get("docket_id")) if item.get("docket_id") else None,
                    caption=caption,
                    court=item.get("court") or "Federal Court",
                    filed_date=item.get("date_filed") or item.get("filed_date"),
                    source_url=item.get("url") or item.get("source_url"),
                    metadata={
                        **item,
                        "authority_band": "binding",
                        "jurisdiction": jurisdiction or "federal",
                        "document_kind": "trial_docket",
                    },
                )
            )
            if len(results) >= limit:
                break
        return results

    async def fetch_case(self, case_id: str, *, docket_id: Optional[str] = None) -> Dict[str, Any]:
        payload = {}
        lookup = docket_id or case_id
        for path in (f"cases/{lookup}", f"dockets/{lookup}"):
            try:
                payload = await self._request_json(path)
                if payload:
                    break
            except Exception:
                continue
        docs = payload.get("documents") if isinstance(payload, dict) else None
        documents: List[Dict[str, Any]] = [item for item in docs if isinstance(item, dict)] if isinstance(docs, list) else []
        if not documents:
            fallback = await self.search(case_id, limit=8)
            documents = [
                {
                    "document_id": item.case_id,
                    "title": item.caption,
                    "source_url": item.source_url,
                    "filed_date": item.filed_date,
                    "metadata": dict(item.metadata),
                }
                for item in fallback
            ]
        return {
            "provider": self.provider_id,
            "case_id": case_id,
            "docket_id": docket_id,
            "documents": documents,
        }

    async def fetch_document(
        self,
        case_id: str,
        document_id: str,
        *,
        docket_id: Optional[str] = None,
    ) -> CourtDocument:
        self.ensure_ready()
        source_url = self._base_url.rstrip("/") + f"/documents/{document_id}"
        return CourtDocument(
            provider=self.provider_id,
            case_id=case_id,
            docket_id=docket_id,
            document_id=document_id,
            title="PACER Document",
            filed_date=None,
            source_url=source_url,
            content_type="application/pdf",
            metadata={
                "authority_band": "binding",
                "jurisdiction": "federal",
                "document_kind": "trial_filing",
                "payment_required": True,
            },
        )

    async def fetch_calendar(
        self,
        *,
        jurisdiction: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        params: Dict[str, Any] = {}
        if jurisdiction:
            params["jurisdiction"] = jurisdiction
        if start_date:
            params["start_date"] = start_date
        if end_date:
            params["end_date"] = end_date
        payload = {}
        for path in ("calendar", "events"):
            try:
                payload = await self._request_json(path, params=params)
                if payload:
                    break
            except Exception:
                continue
        events: List[Dict[str, Any]] = []
        for idx, item in enumerate(self._payload_items(payload)):
            title = str(item.get("title") or item.get("event") or item.get("description") or f"PACER event {idx + 1}")
            date_value = item.get("date") or item.get("event_date") or item.get("scheduled_at")
            events.append(
                {
                    "provider": self.provider_id,
                    "event_id": str(item.get("id") or f"pacer-event-{idx + 1}"),
                    "title": title,
                    "date": date_value,
                    "source_url": item.get("url"),
                }
            )
            if len(events) >= 20:
                break
        return events
