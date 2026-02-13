from __future__ import annotations

from typing import Dict, List, Literal

from pydantic import BaseModel, Field


class ProvenanceRecord(BaseModel):
    source: str
    method: str
    confidence: float = Field(ge=0.0, le=1.0)
    details: Dict[str, object] = Field(default_factory=dict)


class ChainRef(BaseModel):
    chain_id: int
    name: str
    family: Literal["evm", "utxo", "solana", "tron"]


class AddressRef(BaseModel):
    address: str
    chain: ChainRef
    labels: List[str] = Field(default_factory=list)


class ClusterResult(BaseModel):
    cluster_id: str
    addresses: List[AddressRef] = Field(min_length=1)
    provenance: List[ProvenanceRecord] = Field(min_length=1)
