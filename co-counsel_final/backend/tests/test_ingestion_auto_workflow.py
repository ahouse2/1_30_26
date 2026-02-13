import logging

import backend.app.services.automation_pipeline as automation_pipeline
from backend.app.models.api import AutomationPreferences, IngestionRequest, IngestionSource
from backend.app.services.ingestion import IngestionService


class _ImmediateExecutor:
    def __init__(self) -> None:
        self.submitted = []

    def submit(self, fn, *args, **kwargs):
        self.submitted.append((fn, args, kwargs))
        fn(*args, **kwargs)

        class _Future:
            def result(self):
                return None

        return _Future()


def test_ingestion_auto_run_triggers_pipeline(monkeypatch):
    called = {"count": 0}

    class _FakePipeline:
        def __init__(self, job_store=None):
            self.job_store = job_store

        def run_stages(self, *_args, **_kwargs):
            called["count"] += 1

    monkeypatch.setattr(automation_pipeline, "AutomationPipelineService", _FakePipeline)
    monkeypatch.setattr(automation_pipeline, "AUTOMATION_STAGES", ("graph",))

    service = IngestionService.__new__(IngestionService)
    service.executor = _ImmediateExecutor()
    service.logger = logging.getLogger("test.ingestion")
    service.job_store = object()

    request = IngestionRequest(
        sources=[IngestionSource(type="local", path="/tmp")],
        automation=AutomationPreferences(auto_run=True, stages=["graph"]),
    )
    job_record = {"automation": request.automation.model_dump(exclude_none=True)}

    service._maybe_trigger_automation("job-1", request, job_record)
    assert called["count"] == 1


def test_ingestion_auto_run_respects_disabled(monkeypatch):
    called = {"count": 0}

    class _FakePipeline:
        def __init__(self, job_store=None):
            self.job_store = job_store

        def run_stages(self, *_args, **_kwargs):
            called["count"] += 1

    monkeypatch.setattr(automation_pipeline, "AutomationPipelineService", _FakePipeline)
    monkeypatch.setattr(automation_pipeline, "AUTOMATION_STAGES", ("graph",))

    service = IngestionService.__new__(IngestionService)
    service.executor = _ImmediateExecutor()
    service.logger = logging.getLogger("test.ingestion")
    service.job_store = object()

    request = IngestionRequest(
        sources=[IngestionSource(type="local", path="/tmp")],
        automation=AutomationPreferences(auto_run=False, stages=["graph"]),
    )
    job_record = {"automation": request.automation.model_dump(exclude_none=True)}

    service._maybe_trigger_automation("job-1", request, job_record)
    assert called["count"] == 0
