from __future__ import annotations

from dataclasses import asdict
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

from ..models.api import (
    CourtDocumentFetchRequest,
    CourtDocumentFetchResponse,
    CourtPaymentAuthorizeRequest,
    CourtPaymentAuthorizeResponse,
    CourtProviderStatusEntry,
    CourtProviderStatusResponse,
    CourtSearchRequest,
    CourtSearchResponse,
)
from ..services.court_connectors import ConnectorNotConfigured
from ..services.court_integration import CourtIntegrationService

router = APIRouter(tags=["Courts"])


@router.get("/courts/providers", response_model=CourtProviderStatusResponse)
def provider_status() -> CourtProviderStatusResponse:
    service = CourtIntegrationService()
    status = service.provider_status()
    providers = [
        CourtProviderStatusEntry(provider_id=provider_id, ready=entry["ready"], reason=entry.get("reason"))
        for provider_id, entry in status.items()
    ]
    return CourtProviderStatusResponse(providers=providers)


@router.post("/courts/search", response_model=CourtSearchResponse)
async def search(payload: CourtSearchRequest) -> CourtSearchResponse:
    service = CourtIntegrationService()
    try:
        results = await service.search(
            payload.provider_id,
            payload.query,
            jurisdiction=payload.jurisdiction,
            limit=payload.limit,
            filters=payload.filters,
        )
    except ConnectorNotConfigured as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    serialised: List[Dict[str, Any]] = []
    for item in results:
        if hasattr(item, "__dataclass_fields__"):
            serialised.append(asdict(item))
        elif isinstance(item, dict):
            serialised.append(item)
    return CourtSearchResponse(results=serialised)


@router.post("/courts/documents/fetch", response_model=CourtDocumentFetchResponse)
async def fetch_document(payload: CourtDocumentFetchRequest) -> CourtDocumentFetchResponse:
    service = CourtIntegrationService()
    if payload.paid:
        ledger_id = service.record_payment_intent(
            provider=payload.provider_id,
            case_id=payload.case_id,
            docket_id=payload.docket_id,
            document_id=payload.document_id,
            amount_estimate=payload.amount_estimate,
            currency=payload.currency,
            requested_by=payload.requested_by or "user",
        )
        return CourtDocumentFetchResponse(status="pending_authorization", ledger_id=ledger_id)

    try:
        document = await service.fetch_document(
            payload.provider_id,
            payload.case_id,
            payload.document_id,
            docket_id=payload.docket_id,
        )
    except ConnectorNotConfigured as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    data: Dict[str, Any]
    if hasattr(document, "__dataclass_fields__"):
        data = asdict(document)
    elif isinstance(document, dict):
        data = document
    else:
        data = {"document": str(document)}
    return CourtDocumentFetchResponse(status="fetched", document=data)


@router.post("/courts/payments/authorize", response_model=CourtPaymentAuthorizeResponse)
def authorize_payment(payload: CourtPaymentAuthorizeRequest) -> CourtPaymentAuthorizeResponse:
    service = CourtIntegrationService()
    service.record_payment_authorization(
        provider=payload.provider_id,
        case_id=payload.case_id,
        docket_id=payload.docket_id,
        document_id=payload.document_id,
        amount_actual=payload.amount_actual,
        currency=payload.currency,
        authorized_by=payload.authorized_by,
        metadata={"ledger_id": payload.ledger_id} if payload.ledger_id else {},
    )
    return CourtPaymentAuthorizeResponse(status="authorized")


@router.get("/courts/sync/status")
async def sync_status(case_id: str, jurisdiction: str | None = None) -> Dict[str, Any]:
    service = CourtIntegrationService()
    return await service.sync_status(case_id=case_id, jurisdiction=jurisdiction)
