from fastapi import FastAPI, HTTPException, status
from fastapi.testclient import TestClient

from backend.app.api import ingestion as ingestion_api
from backend.app.models.api import IngestionResponse
from backend.app.security.dependencies import authorize_ingest_enqueue


class StubIngestionService:
    def __init__(self) -> None:
        self.calls: list[tuple[str, str, bool]] = []

    async def run_stage(self, principal, job_id: str, stage: str, *, resume_downstream: bool = False) -> IngestionResponse:
        self.calls.append((job_id, stage, resume_downstream))
        return IngestionResponse(job_id=job_id, status="queued")


class NotFoundIngestionService:
    async def run_stage(self, principal, job_id: str, stage: str, *, resume_downstream: bool = False) -> IngestionResponse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ingestion job {job_id} not found",
        )


def _build_client(service) -> TestClient:
    app = FastAPI()
    app.include_router(ingestion_api.router, prefix="/api")
    app.dependency_overrides[authorize_ingest_enqueue] = lambda: None
    app.dependency_overrides[ingestion_api.get_ingestion_service] = lambda: service
    return TestClient(app)


def test_stage_run_endpoint_dispatches() -> None:
    stub = StubIngestionService()
    client = _build_client(stub)
    res = client.post(
        "/api/ingestion/job-123/stage/enrich/run",
        json={"resume_downstream": True},
    )
    assert res.status_code == 200
    assert res.json()["job_id"] == "job-123"
    assert stub.calls == [("job-123", "enrich", True)]


def test_stage_run_endpoint_404s_for_missing_job() -> None:
    client = _build_client(NotFoundIngestionService())
    res = client.post(
        "/api/ingestion/missing-job/stage/enrich/run",
        json={"resume_downstream": False},
    )
    assert res.status_code == 404
