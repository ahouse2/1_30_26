from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional

from backend.app.services.document_service import DocumentService
from backend.app.api.documents import get_document_service # Reuse dependency
from backend.app.forensics.models import CryptoTracingResult
from backend.app.forensics.crypto_tracer import CryptoTracer, get_crypto_tracer
from backend.app.models.api import ForensicsResponse
from backend.app.services.forensics import ForensicsService, get_forensics_service

router = APIRouter()

@router.get(
    "/{case_id}/{doc_type}/{doc_id}/forensics",
    response_model=ForensicsResponse,
    summary="Retrieve forensic analysis results for a document"
)
async def get_forensic_analysis_results(
    case_id: str,
    doc_type: str,
    doc_id: str,
    version: Optional[str] = None,
    forensics_service: ForensicsService = Depends(get_forensics_service),
):
    if doc_type != "opposition_documents":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Forensic analysis is only available for opposition documents.")
    try:
        return forensics_service.get_document_forensics(doc_id)
    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Forensics report not found.")

@router.get(
    "/{case_id}/{doc_type}/{doc_id}/crypto-tracing",
    response_model=CryptoTracingResult,
    summary="Retrieve cryptocurrency tracing results for a document"
)
async def get_crypto_tracing_results(
    case_id: str,
    doc_type: str,
    doc_id: str,
    version: Optional[str] = None,
    document_service: DocumentService = Depends(get_document_service),
    crypto_tracer: CryptoTracer = Depends(get_crypto_tracer)
):
    if doc_type != "opposition_documents":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Crypto tracing is only available for opposition documents.")

    document_content = document_service.get_document(case_id, doc_type, doc_id, version)
    if not document_content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    if isinstance(document_content, bytes):
        text = document_content.decode("utf-8", errors="ignore")
    else:
        text = str(document_content)
    return crypto_tracer.trace_document_for_crypto(
        document_content=text,
        document_id=doc_id,
    )
