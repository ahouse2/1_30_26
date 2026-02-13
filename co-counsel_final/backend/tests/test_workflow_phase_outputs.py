from backend.app.workflow import phases


def test_legal_theories_phase_output():
    result = phases.run_legal_theories(case_id="case-1", payload={})
    assert "theories" in result
