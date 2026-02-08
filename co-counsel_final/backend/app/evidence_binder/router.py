from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from ..config import get_settings
from ..storage.evidence_binder_store import EvidenceBinderStore


class EvidenceItem(BaseModel):
    document_id: str
    name: str
    description: Optional[str] = None
    added_at: datetime = Field(default_factory=datetime.now)


class EvidenceBinder(BaseModel):
    id: str = Field(default_factory=lambda: uuid4().hex)
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    items: List[EvidenceItem] = Field(default_factory=list)


class EvidenceBinderCreate(BaseModel):
    name: str
    description: Optional[str] = None


class EvidenceBinderUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


router = APIRouter()
settings = get_settings()
store = EvidenceBinderStore(settings.evidence_binder_path)


@router.post("/evidence-binders", response_model=EvidenceBinder, status_code=status.HTTP_201_CREATED)
async def create_evidence_binder(binder_data: EvidenceBinderCreate):
    record = store.create_binder(name=binder_data.name, description=binder_data.description)
    return EvidenceBinder(**record)


@router.get("/evidence-binders", response_model=List[EvidenceBinder])
async def get_all_evidence_binders():
    return [EvidenceBinder(**record) for record in store.list_binders()]


@router.get("/evidence-binders/{binder_id}", response_model=EvidenceBinder)
async def get_evidence_binder(binder_id: str):
    try:
        record = store.get_binder(binder_id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence binder not found") from exc
    return EvidenceBinder(**record)


@router.put("/evidence-binders/{binder_id}", response_model=EvidenceBinder)
async def update_evidence_binder(binder_id: str, binder_data: EvidenceBinderUpdate):
    try:
        record = store.update_binder(
            binder_id,
            name=binder_data.name,
            description=binder_data.description,
        )
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence binder not found") from exc
    return EvidenceBinder(**record)


@router.delete("/evidence-binders/{binder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_evidence_binder(binder_id: str):
    try:
        store.delete_binder(binder_id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence binder not found") from exc
    return


@router.post("/evidence-binders/{binder_id}/items", response_model=EvidenceBinder)
async def add_item_to_binder(binder_id: str, item: EvidenceItem):
    try:
        record = store.add_item(binder_id, item.model_dump())
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence binder not found") from exc
    return EvidenceBinder(**record)
