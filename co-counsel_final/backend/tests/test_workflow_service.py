from backend.app.services.workflow import CaseWorkflowService


def test_run_single_phase(tmp_path):
    service = CaseWorkflowService(storage_path=tmp_path)
    result = service.run_phases(case_id="case-1", phases=["ingestion"], payload={})
    assert result[0].phase == "ingestion"
