from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field, HttpUrl, ConfigDict


class SourceType(str, Enum):
    FILE = "file"
    LOCAL = "local"
    REMOTE = "remote"
    URL = "url"


class IngestionSource(BaseModel):
    source_id: Optional[str] = None
    type: SourceType | str = Field(description="Source type identifier")
    path: Optional[str] = Field(default=None, description="Filesystem path for local sources")
    uri: Optional[str] = Field(default=None, description="URI for document sources")
    credRef: Optional[str] = Field(default=None, description="Credential reference for remote sources")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Optional source metadata")


class AutomationPreferences(BaseModel):
    auto_run: bool = Field(default=True)
    stages: List[str] = Field(default_factory=list)
    question: Optional[str] = None
    case_id: Optional[str] = None
    autonomy_level: str = Field(default="balanced")


class IngestionRequest(BaseModel):
    sources: List[IngestionSource]
    automation: Optional[AutomationPreferences] = None


class IngestionTextRequest(BaseModel):
    document_id: str
    text: str


class FolderUploadStartRequest(BaseModel):
    folder_name: str
    doc_type: Literal["my_documents", "opposition_documents"]


class FileUploadStartRequest(BaseModel):
    relative_path: str
    total_bytes: int


class StageRunRequest(BaseModel):
    resume_downstream: bool = Field(default=False)


class IngestionResponse(BaseModel):
    job_id: str = Field(description="Identifier tracking the ingestion operation")
    status: Literal["queued", "running", "succeeded", "failed", "cancelled"] = Field(
        description="Current job status"
    )


class UploadStartResponse(BaseModel):
    upload_id: str
    case_id: str
    chunk_size: int


class FileUploadStartResponse(BaseModel):
    upload_id: str
    chunk_size: int
    folder_id: str
    case_id: str | None = None
    relative_path: str


class FileUploadChunkResponse(BaseModel):
    upload_id: str
    chunk_index: int


class FileUploadCompleteResponse(BaseModel):
    upload_id: str
    relative_path: str
    final_path: str


class FolderUploadStartResponse(BaseModel):
    folder_id: str
    case_id: str
    chunk_size: int


class IngestionDocumentModel(BaseModel):
    id: str
    uri: Optional[HttpUrl | str] = None
    type: str
    title: str
    metadata: dict


class IngestionErrorModel(BaseModel):
    code: str
    message: str
    source: Optional[str] = None


class IngestionIngestionDetailsModel(BaseModel):
    documents: int
    skipped: List[dict] = Field(default_factory=list)


class IngestionTimelineDetailsModel(BaseModel):
    events: int


class IngestionForensicsArtifactModel(BaseModel):
    document_id: str
    type: str
    schema_version: str
    generated_at: datetime | None
    report_path: str
    fallback_applied: bool = False


class IngestionForensicsDetailsModel(BaseModel):
    artifacts: List[IngestionForensicsArtifactModel] = Field(default_factory=list)
    last_run_at: datetime | None = None


class IngestionGraphDetailsModel(BaseModel):
    nodes: int
    edges: int
    triples: int


class IngestionStageDetailModel(BaseModel):
    name: str
    status: str
    started_at: datetime | None = None
    completed_at: datetime | None = None
    warnings: List[str] = Field(default_factory=list)


class IngestionStatusDetailsModel(BaseModel):
    stages: List[IngestionStageDetailModel] = Field(default_factory=list)
    ingestion: IngestionIngestionDetailsModel
    timeline: IngestionTimelineDetailsModel
    forensics: IngestionForensicsDetailsModel
    graph: IngestionGraphDetailsModel


class IngestionStatusResponse(BaseModel):
    job_id: str
    status: Literal["queued", "running", "succeeded", "failed", "cancelled"]
    submitted_at: datetime
    updated_at: datetime
    documents: List[IngestionDocumentModel]
    errors: List[IngestionErrorModel] = Field(default_factory=list)
    status_details: IngestionStatusDetailsModel


class AutomationStageModel(BaseModel):
    name: str
    status: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    message: Optional[str] = None


class AutomationResultsModel(BaseModel):
    graph: Optional[Dict[str, Any]] = None
    forensics: Optional[Dict[str, Any]] = None
    legal_frameworks: List[Dict[str, Any]] = Field(default_factory=list)
    timeline: Optional[Dict[str, Any]] = None
    presentation: Optional[Dict[str, Any]] = None


class AutomationPipelineResponse(BaseModel):
    job_id: str
    stages: List[AutomationStageModel]
    results: AutomationResultsModel


class AutomationPipelineRunRequest(BaseModel):
    stages: List[str] = Field(default_factory=list)
    question: Optional[str] = None
    case_id: Optional[str] = None
    autonomy_level: str = Field(default="balanced")
    force: bool = Field(default=False)


class CitationEntityModel(BaseModel):
    id: str
    label: str
    type: str


class CitationModel(BaseModel):
    docId: str
    span: str
    uri: Optional[HttpUrl | str] = None
    pageLabel: Optional[str] = None
    chunkIndex: Optional[int] = Field(default=None, ge=0)
    pageNumber: Optional[int] = Field(default=None, ge=1)
    title: Optional[str] = None
    sourceType: Optional[str] = None
    retrievers: List[str] = Field(default_factory=list)
    fusionScore: Optional[float] = None
    confidence: Optional[float] = None
    entities: List[CitationEntityModel] = Field(default_factory=list)


class TraceModel(BaseModel):
    vector: List[dict]
    graph: dict
    forensics: List[dict] = Field(default_factory=list)
    privilege: Optional[dict] = None


class QueryPaginationModel(BaseModel):
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=50)
    total_items: int = Field(ge=0)
    has_next: bool
    mode: Literal["precision", "recall"]
    reranker: str


class QueryResponse(BaseModel):
    answer: str
    citations: List[CitationModel]
    traces: TraceModel
    meta: QueryPaginationModel


class OutcomeProbabilityModel(BaseModel):
    label: str
    probability: float


class TimelineEventModel(BaseModel):
    id: str
    ts: datetime
    title: str
    summary: str
    citations: List[str]
    entity_highlights: List[dict] = Field(default_factory=list)
    relation_tags: List[dict] = Field(default_factory=list)
    confidence: float | None = None
    risk_score: float | None = None
    risk_band: str | None = None
    outcome_probabilities: List[OutcomeProbabilityModel] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
    motion_deadline: Optional[datetime] = None


class TimelineResponse(BaseModel):
    events: List[TimelineEventModel]
    meta: Optional["TimelinePaginationModel"] = None


class TimelinePaginationModel(BaseModel):
    cursor: Optional[str] = None
    limit: int
    has_more: bool


class TimelineExportRequestModel(BaseModel):
    format: Literal["md", "html", "pdf", "xlsx"]
    case_id: Optional[str] = None
    entity: Optional[str] = None
    topic: Optional[str] = None
    source: Optional[str] = None
    from_ts: Optional[datetime] = None
    to_ts: Optional[datetime] = None
    risk_band: Optional[str] = None
    motion_due_before: Optional[datetime] = None
    motion_due_after: Optional[datetime] = None
    storyboard: bool = False


class TimelineExportResponseModel(BaseModel):
    export_id: str
    format: str
    filename: str
    download_url: str
    created_at: datetime


class StoryboardSceneModel(BaseModel):
    id: str
    title: str
    narrative: str
    citations: List[str] = Field(default_factory=list)
    visual_prompt: Optional[str] = None


class StoryboardResponseModel(BaseModel):
    generated_at: str
    scenes: List[StoryboardSceneModel]


class TimelineMediaHookModel(BaseModel):
    hook_id: str
    event_id: str
    title: str
    media_type: Literal["image", "video"]
    prompt: str
    status: Literal["queued", "ready"]
    citations: List[str] = Field(default_factory=list)
    provider: Optional[str] = None
    model: Optional[str] = None


class TimelineMediaHooksResponseModel(BaseModel):
    generated_at: str
    hooks: List[TimelineMediaHookModel]


class GraphNodeModel(BaseModel):
    id: str
    type: str
    properties: dict


class GraphEdgeModel(BaseModel):
    source: str
    target: str
    type: str
    properties: dict


class GraphArgumentLinkModel(BaseModel):
    node: GraphNodeModel
    relation: str
    stance: Literal["support", "contradiction", "neutral"]
    documents: List[str] = Field(default_factory=list)
    weight: Optional[float] = None


class GraphArgumentEntryModel(BaseModel):
    node: GraphNodeModel
    supporting: List[GraphArgumentLinkModel] = Field(default_factory=list)
    opposing: List[GraphArgumentLinkModel] = Field(default_factory=list)
    neutral: List[GraphArgumentLinkModel] = Field(default_factory=list)
    documents: List[str] = Field(default_factory=list)


class GraphContradictionModel(BaseModel):
    source: GraphNodeModel
    target: GraphNodeModel
    relation: str
    documents: List[str] = Field(default_factory=list)
    weight: Optional[float] = None


class GraphLeveragePointModel(BaseModel):
    node: GraphNodeModel
    influence: float
    connections: int
    documents: List[str] = Field(default_factory=list)
    reason: str


class GraphStrategyBriefModel(BaseModel):
    generated_at: datetime
    summary: str
    focus_nodes: List[GraphNodeModel] = Field(default_factory=list)
    argument_map: List[GraphArgumentEntryModel] = Field(default_factory=list)
    contradictions: List[GraphContradictionModel] = Field(default_factory=list)
    leverage_points: List[GraphLeveragePointModel] = Field(default_factory=list)


class GraphStrategyBrief(GraphStrategyBriefModel):
    """Alias used by downstream services expecting GraphStrategyBrief."""
    pass


class LegalFrameworkModel(BaseModel):
    framework_id: str
    label: str
    strategy_brief: Dict[str, Any]
    source_documents: List[str]
    score: Optional[float] = None


class GraphNeighborResponse(BaseModel):
    nodes: List[GraphNodeModel]
    edges: List[GraphEdgeModel]


class GraphSearchResponse(BaseModel):
    nodes: List[GraphNodeModel]


class GraphFactModel(BaseModel):
    id: str
    claim: str
    relation: str
    source_id: str
    target_id: str
    citations: List[str] = Field(default_factory=list)
    confidence: float


class GraphFactExtractionResponse(BaseModel):
    generated_at: str
    case_id: Optional[str] = None
    total: int
    facts: List[GraphFactModel] = Field(default_factory=list)


class GraphSnapshotCreateRequest(BaseModel):
    case_id: Optional[str] = None
    limit: int = Field(default=250, ge=1, le=2000)
    notes: Optional[str] = None


class GraphSnapshotRecordModel(BaseModel):
    snapshot_id: str
    case_id: Optional[str] = None
    created_at: str
    node_count: int
    edge_count: int
    checksum: str
    notes: Optional[str] = None


class GraphSnapshotListResponse(BaseModel):
    snapshots: List[GraphSnapshotRecordModel] = Field(default_factory=list)


class GraphSnapshotDiffRequest(BaseModel):
    baseline_snapshot_id: str
    candidate_snapshot_id: str


class GraphSnapshotDiffSummaryModel(BaseModel):
    added_nodes: int
    removed_nodes: int
    modified_nodes: int
    added_edges: int
    removed_edges: int
    modified_edges: int


class GraphSnapshotDiffResponse(BaseModel):
    baseline_snapshot_id: str
    candidate_snapshot_id: str
    computed_at: str
    summary: GraphSnapshotDiffSummaryModel
    added_nodes: List[Dict[str, Any]] = Field(default_factory=list)
    removed_nodes: List[Dict[str, Any]] = Field(default_factory=list)
    modified_nodes: List[Dict[str, Any]] = Field(default_factory=list)
    added_edges: List[Dict[str, Any]] = Field(default_factory=list)
    removed_edges: List[Dict[str, Any]] = Field(default_factory=list)
    modified_edges: List[Dict[str, Any]] = Field(default_factory=list)


class ForensicsStageModel(BaseModel):
    name: str
    started_at: datetime
    completed_at: datetime
    status: str
    notes: List[str]


class ForensicsSignalModel(BaseModel):
    type: str
    level: Literal["info", "warning", "error"]
    detail: str
    data: Optional[dict] = None


class ForensicsResponse(BaseModel):
    summary: str
    data: dict
    metadata: dict
    signals: List[ForensicsSignalModel]
    stages: List[ForensicsStageModel]
    fallback_applied: bool
    schema_version: str
    generated_at: Optional[datetime] = None


class ForensicsReportVersionModel(BaseModel):
    version_id: str
    created_at: datetime
    source: Literal["current", "snapshot"]
    artifacts: List[str] = Field(default_factory=list)
    path: str


class ForensicsReportHistoryResponseModel(BaseModel):
    file_id: str
    versions: List[ForensicsReportVersionModel]


class ForensicsAuditEventModel(BaseModel):
    timestamp: Optional[datetime] = None
    event_type: str
    principal_id: str
    resource_id: str
    details: Dict[str, Any] = Field(default_factory=dict)


class ForensicsAuditResponseModel(BaseModel):
    file_id: str
    events: List[ForensicsAuditEventModel]


class ForensicsExportRequestModel(BaseModel):
    format: Literal["json", "md", "html"]
    artifact: Optional[Literal["document", "image", "financial"]] = None


class ForensicsExportResponseModel(BaseModel):
    export_id: str
    format: str
    filename: str
    download_url: str
    created_at: datetime


class PresentationExportItemModel(BaseModel):
    document_id: str
    name: str
    description: Optional[str] = None
    added_at: datetime
    citations: List[str] = Field(default_factory=list)


class PresentationExportRequestModel(BaseModel):
    format: Literal["md", "html", "pdf", "xlsx"]
    binder_id: Optional[str] = None
    binder_name: str
    binder_description: Optional[str] = None
    phase: Optional[str] = None
    presenter_notes: Optional[str] = None
    items: List[PresentationExportItemModel] = Field(default_factory=list)


class PresentationExportResponseModel(BaseModel):
    export_id: str
    format: str
    filename: str
    download_url: str
    created_at: datetime


class AgentRunRequest(BaseModel):
    case_id: str
    question: str
    top_k: Optional[int] = Field(default=None, ge=1, le=20)
    autonomy_level: Optional[Literal["low", "balanced", "high"]] = Field(default=None)
    max_turns: Optional[int] = Field(default=None, ge=5, le=40)


class AgentTurnModel(BaseModel):
    role: str
    action: str
    input: dict
    output: dict
    started_at: datetime
    completed_at: datetime
    metrics: dict


class AgentErrorModel(BaseModel):
    component: str
    code: str
    message: str
    severity: Literal["info", "warning", "error", "critical"]
    retryable: bool
    occurred_at: datetime
    attempt: int
    context: dict = Field(default_factory=dict)


class AgentRunResponse(BaseModel):
    thread_id: str
    case_id: str
    question: str
    created_at: datetime
    updated_at: datetime
    status: Literal["pending", "succeeded", "failed", "degraded"]
    final_answer: str
    citations: List[CitationModel]
    qa_scores: Dict[str, float]
    qa_notes: List[str]
    turns: List[AgentTurnModel]
    errors: List[AgentErrorModel]
    telemetry: dict
    memory: dict = Field(default_factory=dict)


class AgentThreadListResponse(BaseModel):
    threads: List[str]


class BillingPlanModel(BaseModel):
    plan_id: str
    label: str
    monthly_price_usd: float
    included_queries: int
    included_ingest_gb: float
    included_seats: int
    support_tier: str
    support_response_sla_hours: int
    support_contact: str
    overage_per_query_usd: float
    overage_per_gb_usd: float
    onboarding_sla_hours: int
    description: str


class BillingPlanListResponse(BaseModel):
    generated_at: datetime
    plans: List[BillingPlanModel]


class BillingUsageSnapshotModel(BaseModel):
    tenant_id: str
    plan_id: str
    plan_label: str
    support_tier: str
    support_sla_hours: int
    support_channel: str
    total_events: float
    success_rate: float
    usage_ratio: float
    health_score: float
    ingestion_jobs: float
    ingestion_gb: float
    query_count: float
    average_query_latency_ms: float
    timeline_requests: float
    agent_runs: float
    projected_monthly_cost: float
    seats_requested: int
    onboarding_completed: bool
    last_event_at: datetime
    metadata: dict


class BillingUsageResponse(BaseModel):
    generated_at: datetime
    tenants: List[BillingUsageSnapshotModel]


class OnboardingSubmission(BaseModel):
    tenant_id: str = Field(min_length=3, description="Unique tenant identifier or slug")
    organization: str = Field(min_length=2, description="Legal name of the organisation")
    contact_name: str = Field(min_length=2)
    contact_email: EmailStr
    seats: int = Field(ge=1, le=500)
    primary_use_case: str = Field(min_length=3)
    departments: List[str] = Field(default_factory=list)
    estimated_matters_per_month: int = Field(ge=0)
    roi_baseline_hours_per_matter: float = Field(ge=0.0)
    automation_target_percent: float = Field(default=0.25, ge=0.0, le=1.0)
    go_live_date: datetime | None = Field(default=None)
    notes: Optional[str] = Field(default=None)
    success_criteria: List[str] = Field(default_factory=list)


class OnboardingSubmissionResponse(BaseModel):
    tenant_id: str
    recommended_plan: str
    message: str
    received_at: datetime


class KnowledgeMediaModel(BaseModel):
    type: str
    title: str
    url: HttpUrl | str
    provider: Optional[str] = None


class KnowledgeProgressModel(BaseModel):
    completed_sections: List[str] = Field(default_factory=list)
    total_sections: int = Field(ge=0)
    percent_complete: float = Field(ge=0.0, le=1.0)
    last_viewed_at: Optional[datetime] = None


class KnowledgeLessonSectionModel(BaseModel):
    id: str
    title: str
    content: str
    completed: bool = False


class KnowledgeLessonSummaryModel(BaseModel):
    lesson_id: str
    title: str
    summary: str
    tags: List[str]
    difficulty: str
    estimated_minutes: int = Field(ge=0)
    jurisdictions: List[str]
    media: List[KnowledgeMediaModel]
    progress: KnowledgeProgressModel
    bookmarked: bool = False


class KnowledgeLessonListResponse(BaseModel):
    lessons: List[KnowledgeLessonSummaryModel]
    filters: Dict[str, List[str]]


class KnowledgeLessonDetailResponse(BaseModel):
    lesson_id: str
    title: str
    summary: str
    tags: List[str]
    difficulty: str
    estimated_minutes: int
    jurisdictions: List[str]
    media: List[KnowledgeMediaModel]
    sections: List[KnowledgeLessonSectionModel]
    progress: KnowledgeProgressModel
    bookmarked: bool
    strategy_brief: Optional[GraphStrategyBriefModel] = None


class KnowledgeSearchFiltersModel(BaseModel):
    tags: Optional[List[str]] = None
    difficulty: Optional[List[str]] = None
    media_types: Optional[List[str]] = None


class KnowledgeSearchRequest(BaseModel):
    query: str
    limit: int = Field(default=10, ge=1, le=50)
    filters: Optional[KnowledgeSearchFiltersModel] = None


class KnowledgeSearchResultModel(BaseModel):
    lesson_id: str
    lesson_title: str
    section_id: str
    section_title: str
    snippet: str
    score: float
    tags: List[str]
    difficulty: str
    media: List[KnowledgeMediaModel]


class KnowledgeSearchResponse(BaseModel):
    results: List[KnowledgeSearchResultModel]
    elapsed_ms: float
    applied_filters: Dict[str, List[str]] = Field(default_factory=dict)


class KnowledgeProgressUpdateRequest(BaseModel):
    section_id: str
    completed: bool = True


class KnowledgeProgressUpdateResponse(BaseModel):
    lesson_id: str
    section_id: str
    completed_sections: List[str]
    total_sections: int
    percent_complete: float
    last_viewed_at: Optional[datetime] = None


class CostSummaryMetricModel(BaseModel):
    total: float
    unit: str
    breakdown: Dict[str, float]
    average: Optional[float] = None


class CostSummaryResponse(BaseModel):
    generated_at: datetime
    window_hours: float
    tenant_id: Optional[str] = None
    api_calls: CostSummaryMetricModel
    model_loads: CostSummaryMetricModel
    gpu_utilisation: CostSummaryMetricModel


class CostEventModel(BaseModel):
    event_id: str
    timestamp: datetime
    tenant_id: Optional[str]
    category: Literal["api", "model", "gpu"]
    name: str
    amount: float
    unit: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class KnowledgeBookmarkRequest(BaseModel):
    bookmarked: bool = True


class KnowledgeBookmarkResponse(BaseModel):
    lesson_id: str
    bookmarked: bool
    bookmarks: List[str]


class SandboxCommandRequestModel(BaseModel):
    command: List[str]


class SandboxCommandResultModel(BaseModel):
    command: List[str]
    return_code: int
    stdout: str
    stderr: str
    duration_ms: float


class SandboxExecutionModel(BaseModel):
    success: bool
    workspace_id: str
    commands: List[SandboxCommandResultModel]


class DevAgentProposalModel(BaseModel):
    proposal_id: str
    task_id: str
    feature_request_id: str
    title: str
    summary: str
    diff: str
    status: str
    created_at: datetime
    created_by: Dict[str, Any]
    validation: Dict[str, Any]
    approvals: List[Dict[str, Any]] = Field(default_factory=list)
    rationale: List[str] = Field(default_factory=list)
    validated_at: datetime | None = None
    governance: Dict[str, Any] = Field(default_factory=dict)


class DevAgentTaskModel(BaseModel):
    task_id: str
    feature_request_id: str
    title: str
    description: str
    priority: str
    status: str
    created_at: datetime
    updated_at: datetime
    planner_notes: List[str] = Field(default_factory=list)
    risk_score: float | None = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    proposals: List[DevAgentProposalModel] = Field(default_factory=list)


class DevAgentMetricsModel(BaseModel):
    generated_at: datetime
    total_tasks: int
    triaged_tasks: int
    rollout_pending: int
    validated_proposals: int
    quality_gate_pass_rate: float
    velocity_per_day: float
    active_rollouts: int
    ci_workflows: List[str]
    feature_toggles: List[Dict[str, Any]] = Field(default_factory=list)


class DevAgentProposalListResponse(BaseModel):
    backlog: List[DevAgentTaskModel]
    metrics: DevAgentMetricsModel


class DevAgentApplyRequest(BaseModel):
    proposal_id: str


class DevAgentApplyResponse(BaseModel):
    proposal: DevAgentProposalModel
    task: DevAgentTaskModel
    execution: SandboxExecutionModel
    metrics: DevAgentMetricsModel


class ScenarioParticipantModel(BaseModel):
    id: str
    name: str
    role: str
    description: str
    sprite: str
    accent_color: str
    voice: Optional[str] = None
    default: bool = True
    optional: bool = False


class ScenarioVariableModel(BaseModel):
    name: str
    description: str
    required: bool = False
    default: Optional[str] = None


class ScenarioEvidenceSpecModel(BaseModel):
    id: str
    label: str
    description: Optional[str] = None
    required: bool = False
    type: str = "document"
    document_id: Optional[str] = None


class ScenarioDirectorMotionModel(BaseModel):
    direction: Literal["none", "left", "right", "forward", "back"]
    intensity: float
    tempo: float


class ScenarioDirectorLightingModel(BaseModel):
    preset: str
    palette: List[str]
    intensity: float
    focus: float
    ambient: float


class ScenarioDirectorPersonaModel(BaseModel):
    expression: str
    vocal_register: str
    confidence: float


class ScenarioDirectorBeatModel(BaseModel):
    beat_id: str
    emotional_tone: str
    counter_argument: Optional[str] = None
    lighting: ScenarioDirectorLightingModel
    motion: ScenarioDirectorMotionModel
    persona: ScenarioDirectorPersonaModel


class ScenarioDirectorManifestModel(BaseModel):
    version: str
    beats: Dict[str, ScenarioDirectorBeatModel]


class ScenarioBeatSpecModel(BaseModel):
    id: str
    kind: Literal["scripted", "dynamic"]
    speaker: str
    stage_direction: Optional[str] = None
    emphasis: Optional[str] = None
    duration_ms: Optional[int] = None
    fallback_text: Optional[str] = None
    delegate: Optional[str] = None
    top_k: Optional[int] = None


class ScenarioDefinitionModel(BaseModel):
    scenario_id: str
    title: str
    description: str
    category: str
    difficulty: str
    tags: List[str]
    participants: List[ScenarioParticipantModel]
    variables: Dict[str, ScenarioVariableModel]
    evidence: List[ScenarioEvidenceSpecModel]
    beats: List[ScenarioBeatSpecModel]
    director: ScenarioDirectorManifestModel


class ScenarioMetadataModel(BaseModel):
    scenario_id: str
    title: str
    description: str
    category: str
    difficulty: str
    tags: List[str]
    participants: List[str]


class ScenarioListResponse(BaseModel):
    scenarios: List[ScenarioMetadataModel]


class ScenarioEvidenceBindingModel(BaseModel):
    value: str
    document_id: Optional[str] = None
    type: Optional[str] = None


class ScenarioRunRequestModel(BaseModel):
    scenario_id: str
    case_id: str
    participants: List[str] = Field(default_factory=list)
    variables: Dict[str, str] = Field(default_factory=dict)
    evidence: Dict[str, ScenarioEvidenceBindingModel] = Field(default_factory=dict)
    enable_tts: bool = False
    director_overrides: Dict[str, Dict[str, Any]] = Field(default_factory=dict)


class ScenarioRunAudioModel(BaseModel):
    voice: str
    mime_type: str
    base64: str
    cache_hit: bool
    sha256: str


class ScenarioRunTurnModel(BaseModel):
    beat_id: str
    speaker_id: str
    speaker: ScenarioParticipantModel
    text: str
    kind: str
    stage_direction: Optional[str]
    emphasis: Optional[str]
    duration_ms: Optional[float]
    thread_id: Optional[str]
    audio: Optional[ScenarioRunAudioModel] = None
    director: Optional[ScenarioDirectorBeatModel] = None


class ScenarioRunResponseModel(BaseModel):
    run_id: str
    scenario: ScenarioDefinitionModel
    transcript: List[ScenarioRunTurnModel]
    telemetry: Dict[str, Any]


class TextToSpeechRequest(BaseModel):
    text: str
    voice: Optional[str] = None


class TextToSpeechResponse(BaseModel):
    voice: str
    mime_type: str
    base64: str
    cache_hit: bool
    sha256: str
class VoicePersonaModel(BaseModel):
    persona_id: str
    label: str
    description: str | None = None
    speaker_id: str | None = None


class VoiceSentimentModel(BaseModel):
    label: Literal["positive", "negative", "neutral"]
    score: float = Field(ge=0.0, le=1.0)
    pace: float = Field(gt=0.0, le=2.5)


class VoiceSegmentModel(BaseModel):
    start: float = Field(ge=0.0)
    end: float = Field(ge=0.0)
    text: str
    confidence: float


class VoicePersonaDirectiveModel(BaseModel):
    persona_id: str
    speaker_id: str | None = None
    tone: str
    language: str
    pace: float = Field(gt=0.0, le=2.5)
    glossary: Dict[str, str] = Field(default_factory=dict)
    rationale: str


class VoiceSentimentArcPointModel(BaseModel):
    offset: float = Field(ge=0.0)
    score: float = Field(ge=0.0, le=1.0)
    label: Literal["positive", "negative", "neutral"]


class VoicePersonaShiftModel(BaseModel):
    at: float = Field(ge=0.0)
    persona_id: str
    tone: str
    language: str
    pace: float = Field(gt=0.0, le=2.5)
    trigger: str


class VoiceTranslationModel(BaseModel):
    source_language: str
    target_language: str
    translated_text: str
    bilingual_text: str
    glossary: Dict[str, str] = Field(default_factory=dict)


class VoiceSessionModel(BaseModel):
    session_id: str
    thread_id: str
    case_id: str
    persona_id: str
    transcript: str
    sentiment: VoiceSentimentModel
    persona_directive: VoicePersonaDirectiveModel
    sentiment_arc: List[VoiceSentimentArcPointModel]
    persona_shifts: List[VoicePersonaShiftModel]
    translation: VoiceTranslationModel
    segments: List[VoiceSegmentModel]
    created_at: datetime
    updated_at: datetime


class VoiceSessionCreateResponse(VoiceSessionModel):
    assistant_text: str
    audio_url: str


class VoiceSessionDetailResponse(VoiceSessionModel):
    voice_memory: Dict[str, Any] = Field(default_factory=dict)


class VoicePersonaListResponse(BaseModel):
    personas: List[VoicePersonaModel]


class ProviderModelInfoModel(BaseModel):
    model_id: str
    display_name: str
    context_window: int
    modalities: List[str]
    capabilities: List[str]
    availability: str


class ProviderCatalogEntryModel(BaseModel):
    provider_id: str
    display_name: str
    capabilities: List[str]
    models: List[ProviderModelInfoModel]


class ModelCatalogResponse(BaseModel):
    providers: List[ProviderCatalogEntryModel]


class ProviderSettingsSnapshotModel(BaseModel):
    primary: str
    secondary: Optional[str]
    defaults: Dict[str, str]
    api_base_urls: Dict[str, str]
    local_runtime_paths: Dict[str, str]
    available: List[ProviderCatalogEntryModel]
    module_overrides: Dict[str, "ModuleModelOverrideModel"] = Field(default_factory=dict)


class CredentialStatusModel(BaseModel):
    provider_id: str
    has_api_key: bool


class CredentialsSnapshotModel(BaseModel):
    providers: List[CredentialStatusModel]
    services: Dict[str, bool]


class CourtProviderStatusEntry(BaseModel):
    provider_id: str
    ready: bool
    reason: Optional[str] = None


class CourtProviderStatusResponse(BaseModel):
    providers: List[CourtProviderStatusEntry]


class CourtSearchRequest(BaseModel):
    provider_id: str
    query: str
    jurisdiction: Optional[str] = None
    limit: int = Field(default=10, ge=1, le=200)
    filters: Optional[Dict[str, Any]] = None


class CourtSearchResponse(BaseModel):
    results: List[Dict[str, Any]]


class CourtDocumentFetchRequest(BaseModel):
    provider_id: str
    case_id: str
    document_id: str
    docket_id: Optional[str] = None
    paid: bool = False
    amount_estimate: Optional[float] = None
    currency: str = Field(default="USD")
    requested_by: Optional[str] = None


class CourtDocumentFetchResponse(BaseModel):
    status: str
    ledger_id: Optional[str] = None
    document: Optional[Dict[str, Any]] = None


class CourtPaymentAuthorizeRequest(BaseModel):
    provider_id: str
    case_id: str
    docket_id: Optional[str] = None
    document_id: Optional[str] = None
    amount_actual: float
    currency: str = Field(default="USD")
    authorized_by: str
    ledger_id: Optional[str] = None


class CourtPaymentAuthorizeResponse(BaseModel):
    status: str


class AppearanceSettingsSnapshotModel(BaseModel):
    theme: Literal["system", "light", "dark"]


class AgentsPolicySettingsSnapshotModel(BaseModel):
    enabled: bool
    initial_trust: float
    trust_threshold: float
    decay: float
    success_reward: float
    failure_penalty: float
    exploration_probability: float
    seed: Optional[int]
    observable_roles: List[str]
    suppressible_roles: List[str]


class GraphRefinementSettingsSnapshotModel(BaseModel):
    enabled: bool
    interval_seconds: float
    idle_limit: int
    min_new_edges: int


class SettingsResponse(BaseModel):
    providers: ProviderSettingsSnapshotModel
    credentials: CredentialsSnapshotModel
    appearance: AppearanceSettingsSnapshotModel
    agents_policy: AgentsPolicySettingsSnapshotModel
    graph_refinement: GraphRefinementSettingsSnapshotModel
    module_catalog: List["ModuleCatalogEntryModel"] = Field(default_factory=list)
    updated_at: Optional[datetime]


class ProviderSettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    primary: Optional[str] = None
    secondary: Optional[str] = None
    defaults: Optional[Dict[str, str]] = None
    api_base_urls: Optional[Dict[str, str]] = None
    local_runtime_paths: Optional[Dict[str, str]] = None
    module_overrides: Optional[Dict[str, "ModuleModelOverrideUpdateModel"]] = None


class ModuleModelOverrideModel(BaseModel):
    provider_id: Optional[str] = None
    chat_model: Optional[str] = None
    embedding_model: Optional[str] = None
    vision_model: Optional[str] = None


class ModuleModelOverrideUpdateModel(BaseModel):
    provider_id: Optional[str] = None
    chat_model: Optional[str] = None
    embedding_model: Optional[str] = None
    vision_model: Optional[str] = None


class ModuleCatalogEntryModel(BaseModel):
    module_id: str
    label: str
    source: Literal["core", "team"]


class CredentialSettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    provider_api_keys: Optional[Dict[str, Optional[str]]] = None
    courtlistener_token: Optional[str] = None
    pacer_api_key: Optional[str] = None
    unicourt_api_key: Optional[str] = None
    lacs_api_key: Optional[str] = None
    caselaw_api_key: Optional[str] = None
    leginfo_api_key: Optional[str] = None
    research_browser_api_key: Optional[str] = None


class AppearanceSettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    theme: Optional[Literal["system", "light", "dark"]] = None


class AgentsPolicySettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    enabled: Optional[bool] = None
    initial_trust: Optional[float] = Field(default=None, ge=0.0, le=2.0)
    trust_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.5)
    decay: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    success_reward: Optional[float] = Field(default=None, ge=0.0, le=1.5)
    failure_penalty: Optional[float] = Field(default=None, ge=0.0, le=2.0)
    exploration_probability: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    seed: Optional[int] = None
    observable_roles: Optional[List[str]] = None
    suppressible_roles: Optional[List[str]] = None


class GraphRefinementSettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    enabled: Optional[bool] = None
    interval_seconds: Optional[float] = Field(default=None, ge=60.0)
    idle_limit: Optional[int] = Field(default=None, ge=1)
    min_new_edges: Optional[int] = Field(default=None, ge=0)


class SettingsUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    providers: Optional[ProviderSettingsUpdate] = None
    credentials: Optional[CredentialSettingsUpdate] = None
    appearance: Optional[AppearanceSettingsUpdate] = None
    agents_policy: Optional[AgentsPolicySettingsUpdate] = None
    graph_refinement: Optional[GraphRefinementSettingsUpdate] = None


class SettingsModelRefreshRequest(BaseModel):
    provider_id: str
