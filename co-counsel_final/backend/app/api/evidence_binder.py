from fastapi import APIRouter, Depends

from ..models.api import (
    ForensicsResponse,
)
from ..services.forensics import ForensicsService, get_forensics_service
from ..security.authz import Principal
from ..security.dependencies import (
    authorize_forensics_document,
    authorize_forensics_financial,
    authorize_forensics_image,
)
from ..evidence_binder import router as binder_router

router = APIRouter()
router.include_router(binder_router.router)

@router.get("/forensics/document", response_model=ForensicsResponse)
def get_document_forensics(
    id: str,
    _principal: Principal = Depends(authorize_forensics_document),
    service: ForensicsService = Depends(get_forensics_service),
) -> ForensicsResponse:
    return service.get_document_forensics(id, principal=_principal)


@router.get("/forensics/image", response_model=ForensicsResponse)
def get_image_forensics(
    id: str,
    _principal: Principal = Depends(authorize_forensics_image),
    service: ForensicsService = Depends(get_forensics_service),
) -> ForensicsResponse:
    return service.get_image_forensics(id, principal=_principal)


@router.get("/forensics/financial", response_model=ForensicsResponse)
def get_financial_forensics(
    id: str,
    _principal: Principal = Depends(authorize_forensics_financial),
    service: ForensicsService = Depends(get_forensics_service),
) -> ForensicsResponse:
    return service.get_financial_forensics(id, principal=_principal)
