from __future__ import annotations

import re
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus, urljoin

import httpx

from .base import CourtConnector, CourtDocument, CourtSearchResult, ConnectorNotConfigured


class LegInfoConnector(CourtConnector):
    provider_id = "leginfo"

    def __init__(self, api_key: Optional[str], base_url: Optional[str]) -> None:
        self._api_key = api_key
        self._base_url = base_url or "https://leginfo.legislature.ca.gov"

    def ensure_ready(self) -> None:
        if not self._base_url:
            raise ConnectorNotConfigured("LegInfo endpoint is not configured")

    async def _fetch_html(self, path: str) -> str:
        self.ensure_ready()
        target = urljoin(self._base_url if self._base_url.endswith("/") else f"{self._base_url}/", path.lstrip("/"))
        headers: Dict[str, str] = {
            "User-Agent": "CoCounsel-LegInfo-Connector/1.0",
            "Accept": "text/html,application/xhtml+xml",
        }
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            response = await client.get(target, headers=headers)
            response.raise_for_status()
            return response.text

    async def search(
        self,
        query: str,
        *,
        jurisdiction: Optional[str] = None,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[CourtSearchResult]:
        _ = jurisdiction, filters
        html = await self._fetch_html("/faces/codes.xhtml")
        link_pattern = re.compile(
            r'<a[^>]+href=["\'](?P<href>[^"\']+)["\'][^>]*>(?P<label>.*?)</a>',
            re.IGNORECASE | re.DOTALL,
        )
        query_l = query.lower().strip()
        results: List[CourtSearchResult] = []
        for match in link_pattern.finditer(html):
            href = match.group("href").strip()
            label = re.sub(r"<[^>]+>", " ", match.group("label"))
            label = re.sub(r"\s+", " ", label).strip()
            if len(label) < 4:
                continue
            if query_l and query_l not in label.lower():
                continue
            source_url = href if href.startswith("http") else urljoin(self._base_url, href)
            case_id = f"ca-statute-{quote_plus(label.lower())[:64]}"
            results.append(
                CourtSearchResult(
                    provider=self.provider_id,
                    case_id=case_id,
                    docket_id=None,
                    caption=label,
                    court="California Legislature",
                    filed_date=None,
                    source_url=source_url,
                    metadata={
                        "authority_band": "binding",
                        "jurisdiction": "CA",
                        "document_kind": "statute",
                    },
                )
            )
            if len(results) >= limit:
                break
        return results

    async def fetch_case(self, case_id: str, *, docket_id: Optional[str] = None) -> Dict[str, Any]:
        _ = docket_id
        rows = await self.search(case_id, limit=8)
        return {
            "provider": self.provider_id,
            "case_id": case_id,
            "docket_id": None,
            "documents": [
                {
                    "document_id": f"leginfo-{idx + 1}",
                    "title": row.caption,
                    "source_url": row.source_url,
                    "filed_date": row.filed_date,
                    "metadata": row.metadata,
                }
                for idx, row in enumerate(rows)
            ],
        }

    async def fetch_document(
        self,
        case_id: str,
        document_id: str,
        *,
        docket_id: Optional[str] = None,
    ) -> CourtDocument:
        _ = docket_id
        source_url = f"{self._base_url.rstrip('/')}/faces/codes.xhtml"
        return CourtDocument(
            provider=self.provider_id,
            case_id=case_id,
            docket_id=None,
            document_id=document_id,
            title="California Statute",
            filed_date=None,
            source_url=source_url,
            content_type="text/html",
            metadata={
                "authority_band": "binding",
                "jurisdiction": "CA",
                "document_kind": "statute",
            },
        )

    async def fetch_calendar(
        self,
        *,
        jurisdiction: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        _ = jurisdiction, start_date, end_date
        return []

