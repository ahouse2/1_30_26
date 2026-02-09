from backend.app.models.api import UploadStartResponse, FolderUploadStartResponse

def test_upload_models_have_required_fields():
    assert UploadStartResponse.model_fields.keys() >= {"upload_id", "chunk_size", "case_id"}
    assert FolderUploadStartResponse.model_fields.keys() >= {"folder_id", "case_id", "chunk_size"}
