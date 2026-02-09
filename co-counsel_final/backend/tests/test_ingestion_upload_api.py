from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.app.api import ingestion as ingestion_api
from backend.app.services.upload_service import UploadService
from backend.app.models.api import IngestionRequest
from backend.app.security.dependencies import authorize_ingest_enqueue

def test_folder_upload_start(tmp_path):
    app = FastAPI()
    app.include_router(ingestion_api.router, prefix="/api")
    app.dependency_overrides[authorize_ingest_enqueue] = lambda: None
    app.dependency_overrides[ingestion_api.get_upload_service] = lambda: UploadService(tmp_path)

    client = TestClient(app)
    res = client.post("/api/ingestion/folder/start", json={"folder_name": "Case A", "doc_type": "my_documents"})
    assert res.status_code == 200
    assert "folder_id" in res.json()


def test_file_upload_flow(tmp_path):
    service = UploadService(tmp_path)
    folder = service.start_folder_upload("Case A", "my_documents")

    app = FastAPI()
    app.include_router(ingestion_api.router, prefix="/api")
    app.dependency_overrides[authorize_ingest_enqueue] = lambda: None
    app.dependency_overrides[ingestion_api.get_upload_service] = lambda: service

    client = TestClient(app)
    res = client.post(
        f"/api/ingestion/folder/{folder['folder_id']}/file/start",
        json={"relative_path": "evidence/alpha.txt", "total_bytes": 5},
    )
    assert res.status_code == 200
    upload_id = res.json()["upload_id"]

    chunk_res = client.post(
        f"/api/ingestion/file/{upload_id}/chunk",
        data={"chunk_index": 0},
        files={"chunk": ("chunk.bin", b"hello")},
    )
    assert chunk_res.status_code == 200

    complete_res = client.post(f"/api/ingestion/file/{upload_id}/complete")
    assert complete_res.status_code == 200
    assert complete_res.json()["relative_path"].endswith("alpha.txt")


def test_folder_complete_triggers_ingestion(tmp_path):
    service = UploadService(tmp_path)
    folder = service.start_folder_upload("Case A", "my_documents")

    class StubIngestionService:
        def __init__(self):
            self.requests = []

        def ingest(self, request: IngestionRequest, principal=None, *, job_id=None):
            self.requests.append((request, job_id))
            return job_id or "job-1"

    stub = StubIngestionService()
    app = FastAPI()
    app.include_router(ingestion_api.router, prefix="/api")
    app.dependency_overrides[authorize_ingest_enqueue] = lambda: None
    app.dependency_overrides[ingestion_api.get_upload_service] = lambda: service
    app.dependency_overrides[ingestion_api.get_ingestion_service] = lambda: stub

    client = TestClient(app)
    res = client.post(f"/api/ingestion/folder/{folder['folder_id']}/complete")
    assert res.status_code == 200
    assert res.json()["job_id"] == folder["case_id"]
    assert stub.requests[0][0].sources[0].metadata["doc_type"] == "my_documents"
