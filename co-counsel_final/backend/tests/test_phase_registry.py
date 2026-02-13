from backend.app.workflow.registry import get_phase_registry


def test_phase_registry_contains_ingestion():
    registry = get_phase_registry()
    assert "ingestion" in registry


def test_phase_registry_includes_all_phases():
    registry = get_phase_registry()
    for phase in [
        "ingestion",
        "preprocess",
        "forensics",
        "parsing_chunking",
        "indexing",
        "court_sync",
        "fact_extraction",
        "timeline",
        "legal_theories",
        "strategy",
        "drafting",
        "qa_review",
    ]:
        assert phase in registry
