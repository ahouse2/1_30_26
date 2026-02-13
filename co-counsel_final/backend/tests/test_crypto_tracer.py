from __future__ import annotations

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.app.forensics.crypto_tracer import CryptoTracer, Transaction, WalletAddress


def test_crypto_tracer_clusters_from_transactions(monkeypatch) -> None:
    tracer = CryptoTracer(graph_service=None, enable_graph=False)
    wallets = [
        WalletAddress(address="0xabc0000000000000000000000000000000000000", blockchain="Ethereum", currency="ETH", is_valid=True),
        WalletAddress(address="0xdef0000000000000000000000000000000000000", blockchain="Ethereum", currency="ETH", is_valid=True),
    ]
    txs = [
        Transaction(
            tx_id="tx1",
            sender=wallets[0].address,
            receiver=wallets[1].address,
            amount=1.0,
            currency="ETH",
            timestamp="2024-01-01T00:00:00",
            blockchain="Ethereum",
        )
    ]
    monkeypatch.setattr(tracer, "_extract_wallet_addresses", lambda _: wallets)
    monkeypatch.setattr(tracer, "_perform_on_chain_analysis", lambda _: txs)

    result = tracer.trace_document_for_crypto("dummy", document_id="doc-1")

    assert result.clusters, "Expected cluster results"
    assert result.clusters[0].provenance, "Clusters must carry provenance"
