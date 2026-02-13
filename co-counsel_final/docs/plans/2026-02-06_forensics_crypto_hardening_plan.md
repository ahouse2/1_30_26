# Forensics + Crypto Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade crypto tracing to support EVM-first cross-chain analysis, ETH token clustering, custodial attribution workflows, and align forensics APIs/UI with the robust ForensicsService pipeline.

**Architecture:** Build a crypto tracing pipeline around typed models + heuristics registry, feed results into GraphService upserts, and expose normalized outputs via forensics APIs. Keep provenance on each heuristic and add bridge-aware transfer matching. Align frontend forensics views to the canonical endpoints and response models.

**Tech Stack:** FastAPI, Pydantic, Neo4j (GraphService), httpx, Swarms orchestration, optional web3/bitcoinlib, frontend React + TypeScript.

---

### Task 1: Define Crypto Models + Heuristics Registry

**Files:**
- Create: `backend/app/forensics/crypto_models.py`
- Create: `backend/app/forensics/crypto_heuristics.py`
- Test: `backend/tests/test_crypto_models.py`

**Step 1: Write the failing test**
```python
from backend.app.forensics.crypto_models import AddressRef, ChainRef, ClusterResult

def test_cluster_requires_provenance():
    chain = ChainRef(chain_id=1, name="ethereum", family="evm")
    addr = AddressRef(address="0xabc", chain=chain, labels=["seed"])
    result = ClusterResult(cluster_id="c1", addresses=[addr], provenance=[])
    assert result.provenance, "Cluster must include provenance entries"
```

**Step 2: Run test to verify it fails**
Run: `pytest backend/tests/test_crypto_models.py -v`  
Expected: FAIL (missing modules or validation)

**Step 3: Implement minimal models**
```python
class ProvenanceRecord(BaseModel):
    source: str
    method: str
    confidence: float

class ChainRef(BaseModel):
    chain_id: int
    name: str
    family: Literal["evm", "utxo", "solana", "tron"]

class AddressRef(BaseModel):
    address: str
    chain: ChainRef
    labels: list[str] = []
```

**Step 4: Run tests to verify they pass**
Run: `pytest backend/tests/test_crypto_models.py -v`  
Expected: PASS

**Step 5: Commit (optional)**
```bash
git add backend/app/forensics/crypto_models.py backend/app/forensics/crypto_heuristics.py backend/tests/test_crypto_models.py
git commit -m "feat: add crypto tracing models and provenance schema"
```

---

### Task 2: Bridge Registry + Cross-Chain Matching Heuristic

**Files:**
- Create: `backend/app/forensics/bridge_registry.py`
- Create: `backend/app/forensics/data/bridge_registry.json`
- Test: `backend/tests/test_bridge_matching.py`

**Step 1: Write the failing test**
```python
from backend.app.forensics.bridge_registry import BridgeRegistry
from backend.app.forensics.crypto_heuristics import match_bridge_transfers

def test_bridge_match_on_value_time_window(tmp_path):
    registry = BridgeRegistry({"example": {"source_chain": 1, "dest_chain": 42161}})
    matches = match_bridge_transfers(
        registry,
        source_transfers=[{"amount": 1.0, "token": "USDC", "timestamp": 1000}],
        dest_transfers=[{"amount": 1.0, "token": "USDC", "timestamp": 1050}],
        window_seconds=120,
    )
    assert matches, "Expected at least one bridge match"
```

**Step 2: Run test to verify it fails**
Run: `pytest backend/tests/test_bridge_matching.py -v`  
Expected: FAIL (missing registry or matcher)

**Step 3: Implement registry + matcher**
```python
class BridgeRegistry:
    def __init__(self, payload: dict) -> None:
        self.payload = payload

def match_bridge_transfers(registry, source_transfers, dest_transfers, window_seconds=600):
    # naive match by token + amount + time window
    matches = []
    for src in source_transfers:
        for dst in dest_transfers:
            if src["token"] == dst["token"] and abs(src["amount"] - dst["amount"]) <= 0.01:
                if abs(src["timestamp"] - dst["timestamp"]) <= window_seconds:
                    matches.append({"source": src, "dest": dst})
    return matches
```

**Step 4: Run tests to verify they pass**
Run: `pytest backend/tests/test_bridge_matching.py -v`  
Expected: PASS

**Step 5: Commit (optional)**
```bash
git add backend/app/forensics/bridge_registry.py backend/app/forensics/data/bridge_registry.json backend/tests/test_bridge_matching.py
git commit -m "feat: add bridge registry and matching heuristic"
```

---

### Task 3: Upgrade CryptoTracer Pipeline + Graph Upserts

**Files:**
- Modify: `backend/app/forensics/crypto_tracer.py`
- Modify: `backend/app/services/blockchain_service.py`
- Modify: `backend/app/services/graph.py` (if new helper needed)
- Test: `backend/tests/test_crypto_tracer.py`

**Step 1: Write failing tests**
```python
from backend.app.forensics.crypto_tracer import CryptoTracer

def test_crypto_tracer_emits_cluster_and_bridge_matches(tmp_path):
    tracer = CryptoTracer()
    result = tracer.trace_document_for_crypto("0xabc", document_id="doc-1")
    assert result.details
```

**Step 2: Run test to verify it fails**
Run: `pytest backend/tests/test_crypto_tracer.py -v`  
Expected: FAIL (missing cluster fields / adapters)

**Step 3: Implement pipeline**
```python
class CryptoTracer:
    def trace_document_for_crypto(self, document_content: str, document_id: str):
        wallets = self._extract_wallet_addresses(document_content)
        txs = self._perform_on_chain_analysis(wallets)
        clusters = self._cluster_evm_wallets(wallets, txs)
        self._upsert_graph(document_id, wallets, txs, clusters)
        return CryptoTracingResult(...)
```

**Step 4: Run tests to verify they pass**
Run: `pytest backend/tests/test_crypto_tracer.py -v`  
Expected: PASS

**Step 5: Commit (optional)**
```bash
git add backend/app/forensics/crypto_tracer.py backend/app/services/blockchain_service.py backend/tests/test_crypto_tracer.py
git commit -m "feat: upgrade crypto tracer with clustering and graph upserts"
```

---

### Task 4: Align Forensics API + Frontend

**Files:**
- Modify: `backend/app/api/forensics.py`
- Modify: `frontend/src/services/forensics_api.ts`
- Modify: `frontend/src/pages/ForensicsReportPage.tsx`
- Test: `backend/tests/test_api.py::test_ingest_document_pipeline`

**Step 1: Write failing test (if needed)**
```python
def test_forensics_endpoints_respond_with_report(client, auth_headers_factory):
    headers = auth_headers_factory()
    response = client.get("/forensics/document", params={"id": "missing"}, headers=headers)
    assert response.status_code in {200, 404}
```

**Step 2: Run test to verify it fails**
Run: `pytest backend/tests/test_api.py::test_ingest_document_pipeline -v`  
Expected: FAIL if endpoint mismatch persists

**Step 3: Implement endpoint alignment**
```python
@router.get("/document")
def get_doc_forensics(id: str, service: ForensicsService = Depends(...)):
    return service.get_document_forensics(id)
```

**Step 4: Update frontend service + page**
- Move API base to match backend routes.
- Adjust types to use `ForensicsResponse` and new crypto tracing payloads.

**Step 5: Run tests**
Run: `pytest backend/tests/test_api.py::test_ingest_document_pipeline -v`  
Expected: PASS

**Step 6: Commit (optional)**
```bash
git add backend/app/api/forensics.py frontend/src/services/forensics_api.ts frontend/src/pages/ForensicsReportPage.tsx
git commit -m "feat: align forensics APIs and UI"
```

---

### Task 5: Crypto Provenance + Legal Process Hooks

**Files:**
- Create: `backend/app/forensics/custodial_attribution.py`
- Modify: `backend/app/models/api.py` (if new response model needed)
- Test: `backend/tests/test_custodial_attribution.py`

**Step 1: Write failing test**
```python
from backend.app.forensics.custodial_attribution import build_legal_process_record

def test_legal_process_record_requires_target():
    record = build_legal_process_record(exchange="coinbase", case_id="case-1")
    assert record["exchange"] == "coinbase"
    assert record["status"] == "pending"
```

**Step 2: Run test to verify it fails**
Run: `pytest backend/tests/test_custodial_attribution.py -v`  
Expected: FAIL (missing module)

**Step 3: Implement minimal workflow record generator**
```python
def build_legal_process_record(exchange: str, case_id: str) -> dict:
    return {"exchange": exchange, "case_id": case_id, "status": "pending"}
```

**Step 4: Run tests**
Run: `pytest backend/tests/test_custodial_attribution.py -v`  
Expected: PASS

**Step 5: Commit (optional)**
```bash
git add backend/app/forensics/custodial_attribution.py backend/tests/test_custodial_attribution.py
git commit -m "feat: add custodial attribution workflow hooks"
```

---

### Task 6: Update Docs + Repro Log

**Files:**
- Modify: `docs/runbooks/FORENSICS.md`
- Modify: `docs/architecture/agentic_systems.md`
- Modify: `docs/roadmaps/2026-02-06_swarms_roadmap_milestones.md`
- Modify: `docs/logs/reproducibility.md`

**Step 1: Document new tracing pipeline + legal process notes**
**Step 2: Add reproducibility log entry**
**Step 3: Commit (optional)**
```bash
git add docs/runbooks/FORENSICS.md docs/architecture/agentic_systems.md docs/roadmaps/2026-02-06_swarms_roadmap_milestones.md docs/logs/reproducibility.md
git commit -m "docs: update forensics + crypto tracing guidance"
```

---

## Execution Choice
Plan complete. Two execution options:
1. Subagent-Driven (this session)
2. Parallel Session (separate)
