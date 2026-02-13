from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, status

from ..models.api import (
    FolderUploadStartRequest,
    FolderUploadStartResponse,
    FileUploadStartRequest,
    FileUploadStartResponse,
    FileUploadChunkResponse,
    FileUploadCompleteResponse,
    IngestionResponse,
    IngestionRequest,
    IngestionSource,
    IngestionStatusResponse,
    IngestionTextRequest,
    StageRunRequest,
)
from ..services.ingestion import (
    IngestionService,
    get_ingestion_service,
)
from ..services.upload_service import UploadService
from ..config import Settings, get_settings
from ..security.authz import Principal
from ..security.dependencies import (
    authorize_ingest_enqueue,
    authorize_ingest_status,
)

router = APIRouter()


def get_upload_service(settings: Settings = Depends(get_settings)) -> UploadService:
    return UploadService(
        settings.upload_workspace_dir,
        chunk_size=settings.upload_chunk_size_bytes,
    )


@router.post("/ingestion/folder/start", response_model=FolderUploadStartResponse)
async def start_folder_upload(
    request: FolderUploadStartRequest,
    principal: Principal = Depends(authorize_ingest_enqueue),
    service: UploadService = Depends(get_upload_service),
) -> FolderUploadStartResponse:
    return service.start_folder_upload(request.folder_name, request.doc_type)


@router.post(
    "/ingestion/folder/{folder_id}/file/start",
    response_model=FileUploadStartResponse,
)
async def start_file_upload(
    folder_id: str,
    request: FileUploadStartRequest,
    principal: Principal = Depends(authorize_ingest_enqueue),
    service: UploadService = Depends(get_upload_service),
) -> FileUploadStartResponse:
    _ = principal
    try:
        return service.start_file_upload(
            folder_id,
            request.relative_path,
            request.total_bytes,
        )
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post(
    "/ingestion/file/{upload_id}/chunk",
    response_model=FileUploadChunkResponse,
)
async def append_file_chunk(
    upload_id: str,
    chunk_index: int = Form(...),
    chunk: UploadFile = File(...),
    principal: Principal = Depends(authorize_ingest_enqueue),
    service: UploadService = Depends(get_upload_service),
) -> FileUploadChunkResponse:
    _ = principal
    data = await chunk.read()
    service.append_chunk(upload_id, chunk_index, data)
    return FileUploadChunkResponse(upload_id=upload_id, chunk_index=chunk_index)


@router.post(
    "/ingestion/file/{upload_id}/complete",
    response_model=FileUploadCompleteResponse,
)
async def complete_file_upload(
    upload_id: str,
    principal: Principal = Depends(authorize_ingest_enqueue),
    service: UploadService = Depends(get_upload_service),
) -> FileUploadCompleteResponse:
    _ = principal
    try:
        return service.complete_file(upload_id)
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post("/ingestion/folder/{folder_id}/complete", response_model=IngestionResponse)
async def complete_folder_upload(
    folder_id: str,
    principal: Principal = Depends(authorize_ingest_enqueue),
    upload_service: UploadService = Depends(get_upload_service),
    ingestion_service: IngestionService = Depends(get_ingestion_service),
) -> IngestionResponse:
    try:
        payload = upload_service.get_folder_payload(folder_id)
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    files_dir = upload_service.get_folder_files_dir(folder_id)
    request = IngestionRequest(
        sources=[
            IngestionSource(
                type="local",
                path=str(files_dir),
                metadata={
                    "folder_id": folder_id,
                    "folder_name": payload.get("folder_name"),
                    "case_id": payload.get("case_id"),
                    "doc_type": payload.get("doc_type"),
                },
            )
        ]
    )
    job_id = ingestion_service.ingest(request, principal=principal, job_id=payload.get("case_id"))
    return IngestionResponse(job_id=job_id, status="queued")

@router.post("/ingestion/{job_id}/stage/{stage}/run", response_model=IngestionResponse)
async def run_ingestion_stage(
    job_id: str,
    stage: str,
    request: StageRunRequest,
    principal: Principal = Depends(authorize_ingest_enqueue),
    service: IngestionService = Depends(get_ingestion_service),
) -> IngestionResponse:
    return await service.run_stage(
        principal,
        job_id,
        stage,
        resume_downstream=request.resume_downstream,
    )

@router.post("/ingestion", response_model=IngestionResponse)
async def ingest_document(
    file: UploadFile = File(...),
    document_id: str = Form(...),
    principal: Principal = Depends(authorize_ingest_enqueue),
    service: IngestionService = Depends(get_ingestion_service),
) -> IngestionResponse:
    return await service.ingest_document(principal, document_id, file)


@router.post("/ingestion/text", response_model=IngestionResponse)
async def ingest_text(
    request: IngestionTextRequest,
    principal: Principal = Depends(authorize_ingest_enqueue),
    service: IngestionService = Depends(get_ingestion_service),
) -> IngestionResponse:
    return await service.ingest_text(principal, request.document_id, request.text)


@router.get("/ingestion/{document_id}/status", response_model=IngestionStatusResponse)
async def get_ingestion_status(
    document_id: str,
    principal: Principal = Depends(authorize_ingest_status),
    service: IngestionService = Depends(get_ingestion_service),
) -> IngestionStatusResponse:
    return await service.get_ingestion_status(principal, document_id)
