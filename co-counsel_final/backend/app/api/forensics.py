from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from typing import Optional

from backend.app.services.document_service import DocumentService
from backend.app.api.documents import get_document_service # Reuse dependency
from backend.app.forensics.models import CryptoTracingResult
from backend.app.forensics.crypto_tracer import CryptoTracer, get_crypto_tracer
from backend.app.models.api import (
    ForensicsAuditResponseModel,
    ForensicsExportRequestModel,
    ForensicsExportResponseModel,
    ForensicsReportHistoryResponseModel,
    ForensicsResponse,
)
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
    "/{case_id}/{doc_type}/{doc_id}/image-forensics",
    response_model=ForensicsResponse,
    summary="Retrieve image authenticity results for a document"
)
async def get_image_forensics_results(
    case_id: str,
    doc_type: str,
    doc_id: str,
    version: Optional[str] = None,
    forensics_service: ForensicsService = Depends(get_forensics_service),
):
    _ = case_id, doc_type, version
    try:
        return forensics_service.get_image_forensics(doc_id)
    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image forensics report not found.")


@router.get(
    "/{case_id}/{doc_type}/{doc_id}/financial-forensics",
    response_model=ForensicsResponse,
    summary="Retrieve financial authenticity results for a document"
)
async def get_financial_forensics_results(
    case_id: str,
    doc_type: str,
    doc_id: str,
    version: Optional[str] = None,
    forensics_service: ForensicsService = Depends(get_forensics_service),
):
    _ = case_id, doc_type, version
    try:
        return forensics_service.get_financial_forensics(doc_id)
    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Financial forensics report not found.")


@router.get(
    "/{case_id}/{doc_type}/{doc_id}/history",
    response_model=ForensicsReportHistoryResponseModel,
    summary="Retrieve forensics report version history"
)
async def get_forensics_history(
    case_id: str,
    doc_type: str,
    doc_id: str,
    limit: int = 20,
    forensics_service: ForensicsService = Depends(get_forensics_service),
):
    _ = case_id, doc_type
    versions = forensics_service.list_report_versions(doc_id, limit=limit)
    return ForensicsReportHistoryResponseModel(file_id=doc_id, versions=versions)


@router.get(
    "/{case_id}/{doc_type}/{doc_id}/audit",
    response_model=ForensicsAuditResponseModel,
    summary="Retrieve forensics audit events"
)
async def get_forensics_audit(
    case_id: str,
    doc_type: str,
    doc_id: str,
    limit: int = 100,
    forensics_service: ForensicsService = Depends(get_forensics_service),
):
    _ = case_id, doc_type
    events = forensics_service.list_audit_events(doc_id, limit=limit)
    return ForensicsAuditResponseModel(file_id=doc_id, events=events)


@router.post(
    "/{case_id}/{doc_type}/{doc_id}/export",
    response_model=ForensicsExportResponseModel,
    summary="Export forensics report payload"
)
async def export_forensics_report(
    case_id: str,
    doc_type: str,
    doc_id: str,
    payload: ForensicsExportRequestModel,
    forensics_service: ForensicsService = Depends(get_forensics_service),
):
    _ = case_id, doc_type
    record = forensics_service.export_report(
        file_id=doc_id,
        export_format=payload.format,
        artifact=payload.artifact,
    )
    return ForensicsExportResponseModel(
        export_id=record.export_id,
        format=record.format,
        filename=record.filename,
        download_url=f"/forensics/export/{record.export_id}",
        created_at=record.created_at,
    )


@router.get("/export/{export_id}", summary="Download forensics export package")
async def download_forensics_export(
    export_id: str,
    forensics_service: ForensicsService = Depends(get_forensics_service),
) -> FileResponse:
    record = forensics_service.export_store.get_export(export_id)
    return FileResponse(record.path, filename=record.filename)

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
