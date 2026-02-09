from backend.app.models.api import IngestionStatusDetailsModel


def test_status_includes_stage_details() -> None:
    assert "stages" in IngestionStatusDetailsModel.model_fields
