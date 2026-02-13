from fastapi import APIRouter, Depends

from ..config import get_settings
from fastapi import HTTPException, Query, status

from ..models.workflow import (
    PhaseRunRequest,
    WorkflowRunControlRequest,
    WorkflowRunCreateRequest,
    WorkflowRunRequest,
)
from ..services.workflow import CaseWorkflowService
from ..services.workflow_runner import get_workflow_runner

router = APIRouter()


def get_workflow_service() -> CaseWorkflowService:
    settings = get_settings()
    return CaseWorkflowService(settings.workflow_storage_path)


def get_runner_service():
    settings = get_settings()
    return get_workflow_runner(settings.workflow_storage_path)


@router.post("/workflow/run")
async def run_workflow(
    req: WorkflowRunRequest,
    service: CaseWorkflowService = Depends(get_workflow_service),
):
    phases = req.phases or [
        "ingestion",
        "preprocess",
        "forensics",
        "parsing_chunking",
        "indexing",
        "fact_extraction",
        "timeline",
        "legal_theories",
        "strategy",
        "drafting",
        "qa_review",
    ]
    results = service.run_phases(case_id=req.case_id or "default", phases=phases, payload={})
    return {"runs": [r.__dict__ for r in results]}


@router.post("/workflow/phase")
async def run_phase(
    req: PhaseRunRequest,
    service: CaseWorkflowService = Depends(get_workflow_service),
):
    results = service.run_phases(case_id=req.case_id, phases=req.phases, payload={})
    return {"runs": [r.__dict__ for r in results]}


@router.post("/workflow/runs")
async def create_workflow_run(
    req: WorkflowRunCreateRequest,
    runner=Depends(get_runner_service),
):
    phases = req.phases or [
        "ingestion",
        "preprocess",
        "forensics",
        "parsing_chunking",
        "indexing",
        "fact_extraction",
        "timeline",
        "legal_theories",
        "strategy",
        "drafting",
        "qa_review",
    ]
    run = runner.start_run(case_id=req.case_id, phases=phases)
    return run


@router.get("/workflow/runs/{run_id}")
async def get_workflow_run(
    run_id: str,
    case_id: str = Query(...),
    runner=Depends(get_runner_service),
):
    store = runner.run_store
    try:
        return store.get_run(case_id, run_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found") from exc


@router.get("/workflow/runs/{run_id}/events")
async def get_workflow_run_events(
    run_id: str,
    case_id: str = Query(...),
    since: int = Query(0, ge=0),
    runner=Depends(get_runner_service),
):
    events, cursor = runner.run_store.read_events(case_id, run_id, since=since)
    return {"events": events, "cursor": cursor}


@router.post("/workflow/runs/{run_id}/pause")
async def pause_workflow_run(
    run_id: str,
    case_id: str = Query(...),
    runner=Depends(get_runner_service),
):
    return runner.pause_run(case_id, run_id)


@router.post("/workflow/runs/{run_id}/resume")
async def resume_workflow_run(
    run_id: str,
    case_id: str = Query(...),
    runner=Depends(get_runner_service),
):
    return runner.resume_run(case_id, run_id)


@router.post("/workflow/runs/{run_id}/stop")
async def stop_workflow_run(
    run_id: str,
    case_id: str = Query(...),
    runner=Depends(get_runner_service),
):
    return runner.stop_run(case_id, run_id)


@router.post("/workflow/runs/{run_id}/retry")
async def retry_workflow_phase(
    run_id: str,
    req: WorkflowRunControlRequest,
    case_id: str = Query(...),
    runner=Depends(get_runner_service),
):
    return runner.retry_phase(case_id, run_id, phase=req.phase)
