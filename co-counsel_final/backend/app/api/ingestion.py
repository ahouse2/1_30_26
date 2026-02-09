from fastapi import APIRouter, Depends, File, Form, UploadFile

from ..models.api import (
    FolderUploadStartRequest,
    FolderUploadStartResponse,
    IngestionResponse,
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
