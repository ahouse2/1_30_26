from __future__ import annotations

import base64

from fastapi import APIRouter, Depends, HTTPException, status

from ..models.api import (
    ScenarioDefinitionModel,
    ScenarioListResponse,
    ScenarioMetadataModel,
    ScenarioRunRequestModel,
    ScenarioRunResponseModel,
    ScenarioRunTurnModel,
    TextToSpeechRequest,
    TextToSpeechResponse,
)
from ..security.authz import Principal
from ..security.dependencies import authorize_agents_read, authorize_agents_run
from ..services.errors import WorkflowAbort, WorkflowException, http_status_for_error
from ..services.scenarios import ScenarioEvidenceBinding, ScenarioRunOptions, get_scenario_engine
from ..services.tts import get_tts_service

router = APIRouter()


def _raise_workflow_exception(exc: WorkflowException) -> None:
    status_code = exc.status_code or http_status_for_error(exc.error)
    raise HTTPException(status_code=status_code, detail=exc.error.to_dict()) from exc


@router.get("/scenarios", response_model=ScenarioListResponse)
def scenarios_list(
    engine=Depends(get_scenario_engine),
    principal: Principal = Depends(authorize_agents_read),
) -> ScenarioListResponse:
    _ = principal
    metadata = engine.list_metadata()
    return ScenarioListResponse(
        scenarios=[ScenarioMetadataModel.model_validate(item) for item in metadata]
    )


@router.get("/scenarios/{scenario_id}", response_model=ScenarioDefinitionModel)
def scenarios_detail(
    scenario_id: str,
    engine=Depends(get_scenario_engine),
    principal: Principal = Depends(authorize_agents_read),
) -> ScenarioDefinitionModel:
    _ = principal
    try:
        definition = engine.get(scenario_id)
    except WorkflowException as exc:
        _raise_workflow_exception(exc)
    return ScenarioDefinitionModel.model_validate(definition.model_dump(mode="json"))


@router.post("/scenarios/run", response_model=ScenarioRunResponseModel)
def scenarios_run(
    payload: ScenarioRunRequestModel,
    engine=Depends(get_scenario_engine),
    principal: Principal = Depends(authorize_agents_run),
) -> ScenarioRunResponseModel:
    options = ScenarioRunOptions(
        scenario_id=payload.scenario_id,
        case_id=payload.case_id,
        variables=dict(payload.variables),
        participants=list(payload.participants),
        use_tts=payload.use_tts,
        evidence={
            slot: ScenarioEvidenceBinding(
                value=binding.value,
                document_id=binding.document_id,
            )
            for slot, binding in payload.evidence.items()
        },
        top_k=payload.top_k,
        director_overrides=dict(payload.director_overrides),
    )
    try:
        result = engine.run(options, principal=principal)
    except WorkflowException as exc:
        _raise_workflow_exception(exc)

    scenario_payload = result.get("scenario", {})
    transcript_payload = result.get("transcript", [])
    return ScenarioRunResponseModel(
        run_id=str(result.get("run_id")),
        scenario=ScenarioDefinitionModel.model_validate(scenario_payload),
        transcript=[ScenarioRunTurnModel.model_validate(turn) for turn in transcript_payload],
        telemetry=dict(result.get("telemetry", {})),
    )


def _tts_service_dependency():
    service = get_tts_service(optional=True)
    if service is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="TTS service not configured",
        )
    return service


@router.post("/tts/speak", response_model=TextToSpeechResponse)
def tts_speak(
    payload: TextToSpeechRequest,
    service=Depends(_tts_service_dependency),
    principal: Principal = Depends(authorize_agents_run),
) -> TextToSpeechResponse:
    _ = principal
    try:
        result = service.synthesise(text=payload.text, voice=payload.voice)
    except WorkflowAbort as exc:
        _raise_workflow_exception(exc)
    except WorkflowException as exc:
        _raise_workflow_exception(exc)

    return TextToSpeechResponse(
        voice=result.voice,
        mime_type=result.content_type,
        base64=base64.b64encode(result.audio_bytes).decode("ascii"),
        cache_hit=result.cache_hit,
        sha256=result.sha256,
    )
