from __future__ import annotations

from typing import Any, Dict, List, Optional

from ..api_clients.courtlistener_client import CourtListenerClient
from .base import CourtConnector, CourtDocument, CourtSearchResult, ConnectorNotConfigured


class CourtListenerConnector(CourtConnector):
    provider_id = "courtlistener"

    def __init__(self, token: Optional[str], base_url: Optional[str]) -> None:
        self._token = token
        self._base_url = base_url or ""

    def ensure_ready(self) -> None:
        if not self._token:
            raise ConnectorNotConfigured("CourtListener token is not configured")
        if not self._base_url:
            raise ConnectorNotConfigured("CourtListener endpoint is not configured")

    async def search(
        self,
        query: str,
        *,
        jurisdiction: Optional[str] = None,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[CourtSearchResult]:
        self.ensure_ready()
        client = CourtListenerClient(self._token)
        payload = await client.search_opinions(query, page_size=limit, court=jurisdiction, **(filters or {}))
        results: List[CourtSearchResult] = []
        for item in payload.get("results", []) if isinstance(payload, dict) else []:
            case_id = str(item.get("id") or item.get("case_id") or item.get("cluster_id") or "")
            results.append(
                CourtSearchResult(
                    provider=self.provider_id,
                    case_id=case_id,
                    docket_id=str(item.get("docket_id")) if item.get("docket_id") else None,
                    caption=str(item.get("case_name") or item.get("caseName") or item.get("title") or ""),
                    court=item.get("court"),
                    filed_date=item.get("date_filed") or item.get("date_created"),
                    source_url=item.get("absolute_url") or item.get("url"),
                    metadata=item,
                )
            )
        return results

    async def fetch_case(self, case_id: str, *, docket_id: Optional[str] = None) -> Dict[str, Any]:
        self.ensure_ready()
        return {
            "provider": self.provider_id,
            "case_id": case_id,
            "docket_id": docket_id,
            "documents": [],
        }

    async def fetch_document(
        self,
        case_id: str,
        document_id: str,
        *,
        docket_id: Optional[str] = None,
    ) -> CourtDocument:
        self.ensure_ready()
        return CourtDocument(
            provider=self.provider_id,
            case_id=case_id,
            docket_id=docket_id,
            document_id=document_id,
            title="CourtListener Document",
            filed_date=None,
            source_url=None,
            content_type=None,
            metadata={},
        )

    async def fetch_calendar(
        self,
        *,
        jurisdiction: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        self.ensure_ready()
        return []
