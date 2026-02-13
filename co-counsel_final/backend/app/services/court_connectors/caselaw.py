from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

import httpx

from .base import CourtConnector, CourtDocument, CourtSearchResult, ConnectorNotConfigured


class CaseLawConnector(CourtConnector):
    provider_id = "caselaw"

    def __init__(self, api_key: Optional[str], base_url: Optional[str]) -> None:
        self._api_key = api_key
        self._base_url = base_url or "https://api.case.law/v1/cases/"

    def ensure_ready(self) -> None:
        if not self._base_url:
            raise ConnectorNotConfigured("Case.law endpoint is not configured")

    async def _search_payload(self, params: Dict[str, Any]) -> Dict[str, Any]:
        self.ensure_ready()
        headers: Dict[str, str] = {"Accept": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Token {self._api_key}"
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            response = await client.get(self._base_url, headers=headers, params=params)
            response.raise_for_status()
            return response.json() if "json" in response.headers.get("content-type", "").lower() else {}

    async def search(
        self,
        query: str,
        *,
        jurisdiction: Optional[str] = None,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[CourtSearchResult]:
        params: Dict[str, Any] = {"search": query, "page_size": limit}
        if jurisdiction:
            params["jurisdiction"] = jurisdiction
        params.update(filters or {})
        payload = await self._search_payload(params)
        results: List[CourtSearchResult] = []
        for item in payload.get("results", []) if isinstance(payload, dict) else []:
            case_id = str(item.get("id") or item.get("case_id") or "")
            results.append(
                CourtSearchResult(
                    provider=self.provider_id,
                    case_id=case_id,
                    docket_id=str(item.get("docket_id")) if item.get("docket_id") else None,
                    caption=str(item.get("name") or item.get("case_name") or item.get("caseName") or ""),
                    court=item.get("court"),
                    filed_date=item.get("decision_date") or item.get("filed_date"),
                    source_url=item.get("frontend_url") or item.get("url"),
                    metadata={
                        **item,
                        "authority_band": "persuasive",
                        "document_kind": "case_law",
                        "jurisdiction": jurisdiction or item.get("jurisdiction"),
                    },
                )
            )
        return results

    async def fetch_case(self, case_id: str, *, docket_id: Optional[str] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {"id": case_id}
        if docket_id:
            params["docket_id"] = docket_id
        payload = await self._search_payload(params)
        documents: List[Dict[str, Any]] = []
        for idx, item in enumerate(payload.get("results", []) if isinstance(payload, dict) else []):
            doc_id = str(item.get("id") or item.get("case_id") or f"{case_id}-{idx + 1}")
            title = str(item.get("name") or item.get("case_name") or item.get("name_abbreviation") or f"Case {doc_id}")
            documents.append(
                {
                    "document_id": doc_id,
                    "title": title,
                    "source_url": item.get("frontend_url") or item.get("url"),
                    "filed_date": item.get("decision_date") or item.get("filed_date"),
                    "metadata": {
                        **item,
                        "authority_band": "persuasive",
                        "document_kind": "case_law",
                    },
                }
            )
        if not documents:
            # Fallback keeps a usable record even when providers only support free-text search.
            fallback = await self.search(case_id, limit=6)
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
        source_url = re.sub(r"/+$", "", self._base_url) + f"/{document_id}/"
        return CourtDocument(
            provider=self.provider_id,
            case_id=case_id,
            docket_id=docket_id,
            document_id=document_id,
            title="Case.law Document",
            filed_date=None,
            source_url=source_url,
            content_type="application/json",
            metadata={
                "authority_band": "persuasive",
                "document_kind": "case_law",
            },
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
