from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Protocol


class ConnectorNotConfigured(ValueError):
    """Raised when a court connector is missing required credentials."""


@dataclass(frozen=True)
class CourtSearchResult:
    provider: str
    case_id: str
    docket_id: Optional[str]
    caption: str
    court: Optional[str]
    filed_date: Optional[str]
    source_url: Optional[str]
    metadata: Dict[str, Any]


@dataclass(frozen=True)
class CourtDocument:
    provider: str
    case_id: str
    docket_id: Optional[str]
    document_id: str
    title: str
    filed_date: Optional[str]
    source_url: Optional[str]
    content_type: Optional[str]
    metadata: Dict[str, Any]


class CourtConnector(Protocol):
    provider_id: str

    def ensure_ready(self) -> None:
        ...

    async def search(
        self,
        query: str,
        *,
        jurisdiction: Optional[str] = None,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[CourtSearchResult]:
        ...

    async def fetch_case(
        self,
        case_id: str,
        *,
        docket_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        ...

    async def fetch_document(
        self,
        case_id: str,
        document_id: str,
        *,
        docket_id: Optional[str] = None,
    ) -> CourtDocument:
        ...

    async def fetch_calendar(
        self,
        *,
        jurisdiction: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        ...
