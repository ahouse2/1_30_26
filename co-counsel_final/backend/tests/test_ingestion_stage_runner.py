from backend.ingestion.pipeline import run_ingestion_pipeline

def test_run_ingestion_pipeline_supports_stage_filter():
    assert "start_stage" in run_ingestion_pipeline.__code__.co_varnames
