from __future__ import annotations

import re
from typing import Any, Dict, List, Optional
from urllib.parse import urlencode, urljoin

import httpx
from .base import CourtConnector, CourtDocument, CourtSearchResult, ConnectorNotConfigured


class LacsConnector(CourtConnector):
    provider_id = "lacs"

    def __init__(self, api_key: Optional[str], base_url: Optional[str]) -> None:
        self._api_key = api_key
        self._base_url = base_url or ""

    def ensure_ready(self) -> None:
        if not self._base_url:
            raise ConnectorNotConfigured("LACS endpoint is not configured")

    async def _fetch_html(self, path: str, params: Optional[Dict[str, Any]] = None) -> str:
        self.ensure_ready()
        target = urljoin(self._base_url if self._base_url.endswith("/") else f"{self._base_url}/", path.lstrip("/"))
        headers: Dict[str, str] = {
            "User-Agent": "CoCounsel-LACS-Connector/1.0",
            "Accept": "text/html,application/xhtml+xml",
        }
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            response = await client.get(target, params=params or {}, headers=headers)
            response.raise_for_status()
            return response.text

    @staticmethod
    def _extract_rows(html: str, *, limit: int) -> List[Dict[str, Any]]:
        # Fallback parser: capture headline-like links and date snippets from generic court pages.
        entries: List[Dict[str, Any]] = []
        link_pattern = re.compile(
            r'<a[^>]+href=["\'](?P<href>[^"\']+)["\'][^>]*>(?P<label>.*?)</a>',
            re.IGNORECASE | re.DOTALL,
        )
        date_pattern = re.compile(r"\b(20\d{2}[-/]\d{1,2}[-/]\d{1,2})\b")
        for match in link_pattern.finditer(html):
            label = re.sub(r"<[^>]+>", " ", match.group("label"))
            label = re.sub(r"\s+", " ", label).strip()
            if not label or len(label) < 8:
                continue
            href = match.group("href").strip()
            if href.startswith("#") or href.lower().startswith("javascript:"):
                continue
            nearby = html[max(0, match.start() - 180): min(len(html), match.end() + 180)]
            date_match = date_pattern.search(nearby)
            entries.append(
                {
                    "caption": label[:240],
                    "href": href,
                    "filed_date": date_match.group(1) if date_match else None,
                }
            )
            if len(entries) >= limit:
                break
        return entries

    async def search(
        self,
        query: str,
        *,
        jurisdiction: Optional[str] = None,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[CourtSearchResult]:
        params: Dict[str, Any] = {
            "q": query,
            "query": query,
            "jurisdiction": jurisdiction or "",
            "limit": limit,
        }
        params.update(filters or {})

        html = await self._fetch_html("/search", params=params)
        rows = self._extract_rows(html, limit=limit)

        results: List[CourtSearchResult] = []
        for idx, row in enumerate(rows):
            href = row.get("href") or ""
            source_url = href if href.startswith("http") else urljoin(self._base_url, href)
            case_id = re.sub(r"[^a-zA-Z0-9_-]+", "-", row.get("caption", "").lower()).strip("-")[:40] or f"lacs-{idx + 1}"
            results.append(
                CourtSearchResult(
                    provider=self.provider_id,
                    case_id=case_id,
                    docket_id=None,
                    caption=row.get("caption", "LACS result"),
                    court="Los Angeles Superior Court",
                    filed_date=row.get("filed_date"),
                    source_url=source_url,
                    metadata={
                        "query": query,
                        "jurisdiction": jurisdiction,
                        "provider": self.provider_id,
                    },
                )
            )
        return results

    async def fetch_case(self, case_id: str, *, docket_id: Optional[str] = None) -> Dict[str, Any]:
        query = docket_id or case_id
        results = await self.search(query, limit=12)
        return {
            "provider": self.provider_id,
            "case_id": case_id,
            "docket_id": docket_id,
            "documents": [
                {
                    "document_id": f"lacs-doc-{idx + 1}",
                    "title": item.caption,
                    "source_url": item.source_url,
                    "filed_date": item.filed_date,
                }
                for idx, item in enumerate(results)
            ],
        }

    async def fetch_document(
        self,
        case_id: str,
        document_id: str,
        *,
        docket_id: Optional[str] = None,
    ) -> CourtDocument:
        self.ensure_ready()
        source_url = f"{self._base_url.rstrip('/')}/document?{urlencode({'case': case_id, 'doc': document_id})}"
        return CourtDocument(
            provider=self.provider_id,
            case_id=case_id,
            docket_id=docket_id,
            document_id=document_id,
            title="LACS Document",
            filed_date=None,
            source_url=source_url,
            content_type=None,
            metadata={"provider": self.provider_id},
        )

    async def fetch_calendar(
        self,
        *,
        jurisdiction: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        params = {
            "jurisdiction": jurisdiction or "",
            "start": start_date or "",
            "end": end_date or "",
        }
        html = await self._fetch_html("/calendar", params=params)
        rows = self._extract_rows(html, limit=25)
        events: List[Dict[str, Any]] = []
        for idx, row in enumerate(rows):
            events.append(
                {
                    "provider": self.provider_id,
                    "event_id": f"lacs-cal-{idx + 1}",
                    "title": row.get("caption"),
                    "date": row.get("filed_date"),
                    "source_url": row.get("href") if str(row.get("href", "")).startswith("http") else urljoin(self._base_url, str(row.get("href", ""))),
                }
            )
        return events
