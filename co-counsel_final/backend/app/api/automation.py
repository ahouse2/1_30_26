from __future__ import annotations

from pathlib import Path
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from ..config import get_settings
from ..models.api import (
    AutomationPipelineResponse,
    AutomationPipelineRunRequest,
    AutomationPreferences,
    AutomationResultsModel,
    AutomationStageModel,
    IngestionRequest,
    IngestionSource,
)
from ..security.authz import Principal
from ..security.dependencies import authorize_ingest_enqueue, authorize_ingest_status
from ..services.automation_pipeline import (
    AUTOMATION_STAGES,
    AutomationPipelineService,
    get_automation_pipeline_service,
)
from ..services.ingestion import IngestionService, get_ingestion_service

router = APIRouter()


def _build_pipeline_response(job_id: str, automation: dict) -> AutomationPipelineResponse:
    stages_payload: List[AutomationStageModel] = []
    stage_map = automation.get("stages", {}) if automation else {}
    for stage in AUTOMATION_STAGES:
        state = stage_map.get(stage, {"status": "pending"})
        stages_payload.append(
            AutomationStageModel(
                name=stage,
                status=state.get("status", "pending"),
                started_at=state.get("started_at"),
                completed_at=state.get("completed_at"),
                message=state.get("message"),
            )
        )
    results = AutomationResultsModel(**automation.get("results", {})) if automation else AutomationResultsModel()
    return AutomationPipelineResponse(job_id=job_id, stages=stages_payload, results=results)


@router.post("/automation/ingest-folder", response_model=AutomationPipelineResponse)
async def ingest_folder(
    files: List[UploadFile] = File(..., description="Folder contents to ingest."),
    relative_paths: List[str] = Form(...),
    stages: List[str] = Form(default_factory=list),
    auto_run: bool = Form(default=True),
    question: Optional[str] = Form(default=None),
    case_id: Optional[str] = Form(default=None),
    autonomy_level: str = Form(default="balanced"),
    principal: Principal = Depends(authorize_ingest_enqueue),
    service: IngestionService = Depends(get_ingestion_service),
) -> AutomationPipelineResponse:
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Folder ingestion requires at least one file.",
        )
    if len(files) != len(relative_paths):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Folder ingestion requires a relative path for each file.",
        )

    settings = get_settings()
    extraction_id = uuid4().hex
    extraction_root = settings.ingestion_workspace_dir / "uploads" / extraction_id
    extraction_root.mkdir(parents=True, exist_ok=True)

    extraction_root = extraction_root.resolve()
    for upload, relative in zip(files, relative_paths):
        relative = relative.strip().lstrip("/\\")
        if not relative:
            relative = upload.filename or "uploaded_file"
        target = (extraction_root / relative).resolve()
        if not str(target).startswith(str(extraction_root)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Folder upload contains invalid paths.",
            )
        target.parent.mkdir(parents=True, exist_ok=True)
        content = await upload.read()
        target.write_bytes(content)

    automation = AutomationPreferences(
        auto_run=auto_run,
        stages=stages or list(AUTOMATION_STAGES),
        question=question,
        case_id=case_id,
        autonomy_level=autonomy_level,
    )
    request = IngestionRequest(
        sources=[IngestionSource(type="local", path=str(extraction_root))],
        automation=automation,
    )
    job_id = service.ingest(request, principal)
    record = service.get_job(job_id)
    automation_payload = record.get("status_details", {}).get("automation", {})
    return _build_pipeline_response(job_id, automation_payload)


@router.get("/automation/pipeline/{job_id}", response_model=AutomationPipelineResponse)
def get_pipeline_status(
    job_id: str,
    _principal: Principal = Depends(authorize_ingest_status),
    pipeline_service: AutomationPipelineService = Depends(get_automation_pipeline_service),
) -> AutomationPipelineResponse:
    record = pipeline_service.job_store.read_job(job_id)
    automation_payload = record.get("status_details", {}).get("automation", {})
    return _build_pipeline_response(job_id, automation_payload)


@router.post("/automation/pipeline/{job_id}/run", response_model=AutomationPipelineResponse)
def run_pipeline_stage(
    job_id: str,
    request: AutomationPipelineRunRequest,
    _principal: Principal = Depends(authorize_ingest_status),
    pipeline_service: AutomationPipelineService = Depends(get_automation_pipeline_service),
) -> AutomationPipelineResponse:
    automation_payload = pipeline_service.run_stages(
        job_id,
        request.stages,
        question=request.question,
        case_id=request.case_id,
        autonomy_level=request.autonomy_level,
        force=request.force,
    )
    return _build_pipeline_response(job_id, automation_payload)
