from pathlib import Path
from backend.app.storage.upload_session_store import UploadSessionStore

def test_upload_session_store_roundtrip(tmp_path: Path):
    store = UploadSessionStore(tmp_path)
    session = store.create_folder_session(folder_name="Case A", doc_type="my_documents")
    loaded = store.read_folder_session(session["folder_id"])
    assert loaded["folder_name"] == "Case A"
