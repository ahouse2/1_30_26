from backend.app.workflow import phases


def test_ingestion_phase_returns_summary():
    result = phases.run_ingestion(case_id="case-1", payload={})
    assert "summary" in result
