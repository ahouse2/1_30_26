from pathlib import Path
from backend.app.services.upload_service import UploadService

def test_chunked_upload_complete(tmp_path: Path):
    service = UploadService(tmp_path)
    folder = service.start_folder_upload("Case A", "my_documents")
    file_session = service.start_file_upload(folder["folder_id"], "evidence/alpha.txt", total_bytes=5)
    service.append_chunk(file_session["upload_id"], 0, b"hello")
    result = service.complete_file(file_session["upload_id"])
    assert result["relative_path"].endswith("alpha.txt")
