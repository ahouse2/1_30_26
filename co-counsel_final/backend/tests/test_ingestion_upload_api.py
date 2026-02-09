from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.app.api import ingestion as ingestion_api
from backend.app.services.upload_service import UploadService
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
