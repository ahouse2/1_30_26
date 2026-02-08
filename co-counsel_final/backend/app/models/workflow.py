from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


PhaseName = Literal[
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


class WorkflowRunRequest(BaseModel):
    case_id: Optional[str] = None
    phases: List[PhaseName] = Field(default_factory=list)
    auto_run: bool = True


class PhaseRunRequest(BaseModel):
    case_id: str
    phases: List[PhaseName]
    override_model: Optional[str] = None


class WorkflowRunCreateRequest(BaseModel):
    case_id: str
    phases: List[PhaseName] = Field(default_factory=list)


class WorkflowRunControlRequest(BaseModel):
    phase: Optional[PhaseName] = None


class PhaseArtifactRef(BaseModel):
    artifact_id: str
    format: Literal["json", "md"]
    path: str
    created_at: datetime


class PhaseRunResponse(BaseModel):
    run_id: str
    case_id: str
    phase: PhaseName
    status: Literal["queued", "running", "succeeded", "failed"]
    artifacts: List[PhaseArtifactRef] = Field(default_factory=list)


class WorkflowRunPhaseState(BaseModel):
    phase: PhaseName
    status: Literal["queued", "running", "succeeded", "failed"]
    run_id: Optional[str] = None
    artifacts: List[PhaseArtifactRef] = Field(default_factory=list)
    summary: dict = Field(default_factory=dict)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None


class WorkflowRunState(BaseModel):
    run_id: str
    case_id: str
    requested_phases: List[PhaseName]
    status: Literal["queued", "running", "paused", "stopped", "failed", "succeeded"]
    control: dict = Field(default_factory=dict)
    current_phase: Optional[PhaseName] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    phases: List[WorkflowRunPhaseState] = Field(default_factory=list)
