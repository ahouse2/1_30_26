from backend.app.models.workflow import WorkflowRunRequest


def test_workflow_models_accept_optional_case_id():
    payload = WorkflowRunRequest(case_id="case-1", phases=["ingestion"], auto_run=True)
    assert payload.case_id == "case-1"
