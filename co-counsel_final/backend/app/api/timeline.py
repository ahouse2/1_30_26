from datetime import datetime
from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse

from ..models.api import (
    TimelineEventModel,
    TimelineExportRequestModel,
    TimelineExportResponseModel,
    TimelinePaginationModel,
    TimelineResponse,
    StoryboardResponseModel,
    StoryboardSceneModel,
    TimelineMediaHookModel,
    TimelineMediaHooksResponseModel,
)
from ..services.timeline import TimelineService, get_timeline_service
from ..security.authz import Principal
from ..security.dependencies import (
    authorize_timeline,
)

router = APIRouter()

@router.get("/timeline", response_model=TimelineResponse)
def get_timeline(
    _principal: Principal = Depends(authorize_timeline),
    service: TimelineService = Depends(get_timeline_service),
    cursor: str | None = Query(default=None),
    limit: int = Query(20, ge=1, le=100),
    from_ts: str | None = Query(default=None),
    to_ts: str | None = Query(default=None),
    entity: str | None = Query(default=None),
    topic: str | None = Query(default=None),
    source: str | None = Query(default=None),
    risk_band: str | None = Query(default=None),
    motion_due_before: str | None = Query(default=None),
    motion_due_after: str | None = Query(default=None),
) -> TimelineResponse:
    def parse_dt(value: str | None) -> datetime | None:
        if value is None:
            return None
        return datetime.fromisoformat(value)
    result = service.list_events(
        cursor=cursor,
        limit=limit,
        from_ts=parse_dt(from_ts),
        to_ts=parse_dt(to_ts),
        entity=entity,
        topic=topic,
        source=source,
        risk_band=risk_band,
        motion_due_before=parse_dt(motion_due_before),
        motion_due_after=parse_dt(motion_due_after),
    )
    return TimelineResponse(
        events=[TimelineEventModel.model_validate(event) for event in result.events],
        meta=TimelinePaginationModel(
            cursor=result.next_cursor, limit=result.limit, has_more=result.has_more
        ),
    )


@router.post("/timeline/export", response_model=TimelineExportResponseModel)
def export_timeline(
    payload: TimelineExportRequestModel,
    _principal: Principal = Depends(authorize_timeline),
    service: TimelineService = Depends(get_timeline_service),
) -> TimelineExportResponseModel:
    record = service.export_timeline(
        export_format=payload.format,
        case_id=payload.case_id,
        entity=payload.entity,
        topic=payload.topic,
        source=payload.source,
        from_ts=payload.from_ts,
        to_ts=payload.to_ts,
        risk_band=payload.risk_band,
        motion_due_before=payload.motion_due_before,
        motion_due_after=payload.motion_due_after,
        storyboard=payload.storyboard,
    )
    return TimelineExportResponseModel(
        export_id=record.export_id,
        format=record.format,
        filename=record.filename,
        download_url=f"/timeline/export/{record.export_id}",
        created_at=record.created_at,
    )


@router.get("/timeline/export/{export_id}")
def download_timeline_export(
    export_id: str,
    _principal: Principal = Depends(authorize_timeline),
    service: TimelineService = Depends(get_timeline_service),
) -> FileResponse:
    record = service.export_store.get_export(export_id)
    return FileResponse(record.path, filename=record.filename)


@router.get("/timeline/storyboard", response_model=StoryboardResponseModel)
def get_timeline_storyboard(
    _principal: Principal = Depends(authorize_timeline),
    service: TimelineService = Depends(get_timeline_service),
    cursor: str | None = Query(default=None),
    limit: int = Query(50, ge=1, le=200),
    entity: str | None = Query(default=None),
    topic: str | None = Query(default=None),
    source: str | None = Query(default=None),
    risk_band: str | None = Query(default=None),
) -> StoryboardResponseModel:
    result = service.list_events(
        cursor=cursor,
        limit=limit,
        entity=entity,
        topic=topic,
        source=source,
        risk_band=risk_band,
    )
    scenes = [
        StoryboardSceneModel(
            id=scene["id"],
            title=scene["title"],
            narrative=scene["narrative"],
            citations=scene.get("citations", []),
            visual_prompt=scene.get("visual_prompt"),
        )
        for scene in service.build_storyboard(result.events)
    ]
    return StoryboardResponseModel(
        generated_at=datetime.utcnow().isoformat(),
        scenes=scenes,
    )


@router.get("/timeline/media-hooks", response_model=TimelineMediaHooksResponseModel)
def get_timeline_media_hooks(
    _principal: Principal = Depends(authorize_timeline),
    service: TimelineService = Depends(get_timeline_service),
    cursor: str | None = Query(default=None),
    limit: int = Query(30, ge=1, le=100),
    entity: str | None = Query(default=None),
    topic: str | None = Query(default=None),
    source: str | None = Query(default=None),
    risk_band: str | None = Query(default=None),
) -> TimelineMediaHooksResponseModel:
    result = service.list_events(
        cursor=cursor,
        limit=limit,
        entity=entity,
        topic=topic,
        source=source,
        risk_band=risk_band,
    )
    hooks = [TimelineMediaHookModel.model_validate(item) for item in service.build_media_hooks(result.events)]
    return TimelineMediaHooksResponseModel(
        generated_at=datetime.utcnow().isoformat(),
        hooks=hooks,
    )
