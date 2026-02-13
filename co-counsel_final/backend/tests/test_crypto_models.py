from __future__ import annotations

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import pytest

from backend.app.forensics.crypto_models import AddressRef, ChainRef, ClusterResult


def test_cluster_requires_provenance() -> None:
    chain = ChainRef(chain_id=1, name="ethereum", family="evm")
    addr = AddressRef(address="0xabc", chain=chain, labels=["seed"])
    with pytest.raises(ValueError):
        ClusterResult(cluster_id="c1", addresses=[addr], provenance=[])
