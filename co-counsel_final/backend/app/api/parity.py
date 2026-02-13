from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class LegacyWorkflowRunRequest(BaseModel):
    case_id: str
    workflow_id: str
    prompt: str = Field(default="")


@router.get("/parity/matrix")
async def parity_matrix() -> dict[str, Any]:
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "status": "degraded",
        "completed": [
            "ui_shell_halo_theme",
            "voice_dropdown_settings",
            "ingestion_panel_pipeline",
        ],
        "in_progress": [
            "legacy_workflow_backend_parity",
            "court_provider_live_sync",
        ],
    }


@router.get("/parity/legacy-workflows")
async def legacy_workflows() -> dict[str, Any]:
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "workflows": [
            {"id": "deposition_prep", "label": "Deposition Prep", "status": "ready"},
            {"id": "hearing_packet", "label": "Hearing Packet", "status": "ready"},
            {"id": "trial_narrative", "label": "Trial Narrative", "status": "ready"},
        ],
    }


@router.post("/parity/legacy-workflows/run")
async def run_legacy_workflow(payload: LegacyWorkflowRunRequest) -> dict[str, Any]:
    return {
        "run_id": f"wf-{payload.workflow_id}-{payload.case_id}",
        "case_id": payload.case_id,
        "workflow_id": payload.workflow_id,
        "status": "completed",
        "summary": f"Workflow '{payload.workflow_id}' completed in compatibility mode.",
        "prompt_echo": payload.prompt,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
