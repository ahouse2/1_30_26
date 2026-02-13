from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ..services.parity_ops import ParityOpsService

router = APIRouter()


class TaskCreateRequest(BaseModel):
    case_id: str = Field(default="default")
    title: str
    owner: str = Field(default="Unassigned")
    priority: str = Field(default="medium")
    due_date: str | None = None
    notes: str = Field(default="")


class TaskUpdateRequest(BaseModel):
    title: str | None = None
    owner: str | None = None
    priority: str | None = None
    status: str | None = None
    due_date: str | None = None
    notes: str | None = None


class DraftRequest(BaseModel):
    case_id: str = Field(default="default")
    document_type: str = Field(default="motion")
    instructions: str = Field(default="")


class RiskAnalysisRequest(BaseModel):
    claim_text: str
    evidence_text: str


class PrivilegeBatesRequest(BaseModel):
    document_text: str
    bates_prefix: str = Field(default="EXH")
    start_number: int = Field(default=1, ge=1)


class LegacyWorkflowRunRequest(BaseModel):
    case_id: str = Field(default="default")
    workflow_id: str
    prompt: str = Field(default="")


def get_parity_ops_service() -> ParityOpsService:
    return ParityOpsService()


@router.get("/parity/tasks")
def list_tasks(
    case_id: str = "default",
    service: ParityOpsService = Depends(get_parity_ops_service),
) -> Dict[str, Any]:
    return {"tasks": service.list_tasks(case_id)}


@router.post("/parity/tasks")
def create_task(
    request: TaskCreateRequest,
    service: ParityOpsService = Depends(get_parity_ops_service),
) -> Dict[str, Any]:
    task = service.create_task(
        case_id=request.case_id,
        title=request.title,
        owner=request.owner,
        priority=request.priority,
        due_date=request.due_date,
        notes=request.notes,
    )
    return {"task": task}


@router.patch("/parity/tasks/{task_id}")
def update_task(
    task_id: str,
    case_id: str = "default",
    request: TaskUpdateRequest | None = None,
    service: ParityOpsService = Depends(get_parity_ops_service),
) -> Dict[str, Any]:
    patch = request.model_dump(exclude_none=True) if request else {}
    try:
        task = service.update_task(case_id, task_id, patch)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return {"task": task}


@router.post("/parity/draft")
def generate_draft(
    request: DraftRequest,
    service: ParityOpsService = Depends(get_parity_ops_service),
) -> Dict[str, Any]:
    return service.generate_draft(
        case_id=request.case_id,
        document_type=request.document_type,
        instructions=request.instructions,
    )


@router.post("/parity/analyze")
def analyze_discrepancy_and_sanctions(
    request: RiskAnalysisRequest,
    service: ParityOpsService = Depends(get_parity_ops_service),
) -> Dict[str, Any]:
    return service.analyze_discrepancy_and_sanctions(
        claim_text=request.claim_text,
        evidence_text=request.evidence_text,
    )


@router.post("/parity/privilege-bates")
def privilege_bates_pass(
    request: PrivilegeBatesRequest,
    service: ParityOpsService = Depends(get_parity_ops_service),
) -> Dict[str, Any]:
    return service.privilege_bates_pass(
        document_text=request.document_text,
        bates_prefix=request.bates_prefix,
        start_number=request.start_number,
    )


@router.get("/parity/matrix")
def parity_matrix(
    service: ParityOpsService = Depends(get_parity_ops_service),
) -> Dict[str, Any]:
    return service.get_parity_matrix()


@router.get("/parity/legacy-workflows")
def list_legacy_workflows(
    service: ParityOpsService = Depends(get_parity_ops_service),
) -> Dict[str, Any]:
    return {"workflows": service.list_legacy_workflows()}


@router.post("/parity/legacy-workflows/run")
def run_legacy_workflow(
    request: LegacyWorkflowRunRequest,
    service: ParityOpsService = Depends(get_parity_ops_service),
) -> Dict[str, Any]:
    try:
        return service.run_legacy_workflow(
            case_id=request.case_id,
            workflow_id=request.workflow_id,
            prompt=request.prompt,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
