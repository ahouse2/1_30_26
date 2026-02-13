from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse

from ..models.api import (
    PresentationExportRequestModel,
    PresentationExportResponseModel,
)
from ..services.presentation_exports import PresentationExportService
from ..security.authz import Principal
from ..security.dependencies import authorize_timeline

router = APIRouter()


def get_presentation_export_service() -> PresentationExportService:
    return PresentationExportService()


@router.post("/presentation/export", response_model=PresentationExportResponseModel)
def export_presentation_binder(
    payload: PresentationExportRequestModel,
    _principal: Principal = Depends(authorize_timeline),
    service: PresentationExportService = Depends(get_presentation_export_service),
) -> PresentationExportResponseModel:
    record = service.export_binder(
        export_format=payload.format,
        binder_id=payload.binder_id,
        binder_name=payload.binder_name,
        binder_description=payload.binder_description,
        phase=payload.phase,
        presenter_notes=payload.presenter_notes,
        items=payload.items,
    )
    return PresentationExportResponseModel(
        export_id=record.export_id,
        format=record.format,
        filename=record.filename,
        download_url=f"/presentation/export/{record.export_id}",
        created_at=record.created_at,
    )


@router.get("/presentation/export/{export_id}")
def download_presentation_export(
    export_id: str,
    _principal: Principal = Depends(authorize_timeline),
    service: PresentationExportService = Depends(get_presentation_export_service),
) -> FileResponse:
    record = service.export_store.get_export(export_id)
    return FileResponse(record.path, filename=record.filename)
