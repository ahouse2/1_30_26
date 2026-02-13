from __future__ import annotations

import importlib.metadata
import sys
import types
import unittest
from unittest.mock import MagicMock

if "email_validator" not in sys.modules:
    stub = types.ModuleType("email_validator")

    class EmailNotValidError(ValueError):
        pass

    def validate_email(email, *args, **kwargs):
        return {"email": email, "local": email.split("@")[0] if "@" in email else email}

    stub.EmailNotValidError = EmailNotValidError
    stub.validate_email = validate_email
    sys.modules["email_validator"] = stub

_real_version = importlib.metadata.version


def _patched_version(name: str) -> str:
    if name == "email-validator":
        return "2.0.0"
    return _real_version(name)


importlib.metadata.version = _patched_version

if "opentelemetry" not in sys.modules:
    otel = types.ModuleType("opentelemetry")
    otel.metrics = types.ModuleType("opentelemetry.metrics")
    otel.trace = types.ModuleType("opentelemetry.trace")

    class _StatusCode:
        OK = 0
        ERROR = 1

    class _Status:
        def __init__(self, status_code=None, description=None):
            self.status_code = status_code
            self.description = description

    class _StubCounter:
        def add(self, *args, **kwargs):
            return None

    class _StubHistogram:
        def record(self, *args, **kwargs):
            return None

    class _StubMeter:
        def create_counter(self, *args, **kwargs):
            return _StubCounter()

        def create_histogram(self, *args, **kwargs):
            return _StubHistogram()

    class _StubSpan:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def set_attribute(self, *args, **kwargs):
            return None

        def set_status(self, *args, **kwargs):
            return None

    class _StubTracer:
        def start_as_current_span(self, *args, **kwargs):
            return _StubSpan()

    def _get_meter(*args, **kwargs):
        return _StubMeter()

    def _get_tracer(*args, **kwargs):
        return _StubTracer()

    otel.metrics.get_meter = _get_meter
    otel.trace.get_tracer = _get_tracer
    otel.trace.Status = _Status
    otel.trace.StatusCode = _StatusCode
    sys.modules["opentelemetry"] = otel
    sys.modules["opentelemetry.metrics"] = otel.metrics
    sys.modules["opentelemetry.trace"] = otel.trace

# Lightweight stubs to avoid heavy optional deps during import
if "backend.app.services.forensics" not in sys.modules:
    forensics_stub = types.ModuleType("backend.app.services.forensics")

    class ForensicsService:
        def run_case(self, case_id):
            return {}

    def get_forensics_service():
        return ForensicsService()

    forensics_stub.ForensicsService = ForensicsService
    forensics_stub.get_forensics_service = get_forensics_service
    sys.modules["backend.app.services.forensics"] = forensics_stub

if "backend.app.services.retrieval" not in sys.modules:
    retrieval_stub = types.ModuleType("backend.app.services.retrieval")

    class QueryResult:
        pass

    class RetrievalService:
        pass

    def get_retrieval_service():
        return RetrievalService()

    retrieval_stub.QueryResult = QueryResult
    retrieval_stub.RetrievalService = RetrievalService
    retrieval_stub.get_retrieval_service = get_retrieval_service
    sys.modules["backend.app.services.retrieval"] = retrieval_stub

if "backend.app.security.authz" not in sys.modules:
    authz_stub = types.ModuleType("backend.app.security.authz")

    class Principal:
        def __init__(self, *args, **kwargs):
            pass

    authz_stub.Principal = Principal
    sys.modules["backend.app.security.authz"] = authz_stub

# Stub team modules to avoid heavyweight service imports
if "backend.app.agents.teams.document_ingestion" not in sys.modules:
    stub = types.ModuleType("backend.app.agents.teams.document_ingestion")

    class DocumentPreprocessingTool:
        pass

    class ContentIndexingTool:
        pass

    class KnowledgeGraphBuilderTool:
        pass

    class DatabaseQueryTool:
        pass

    class DocumentSummaryTool:
        pass

    def build_document_ingestion_team(*args, **kwargs):
        return []

    stub.DocumentPreprocessingTool = DocumentPreprocessingTool
    stub.ContentIndexingTool = ContentIndexingTool
    stub.KnowledgeGraphBuilderTool = KnowledgeGraphBuilderTool
    stub.DatabaseQueryTool = DatabaseQueryTool
    stub.DocumentSummaryTool = DocumentSummaryTool
    stub.build_document_ingestion_team = build_document_ingestion_team
    sys.modules["backend.app.agents.teams.document_ingestion"] = stub

if "backend.app.agents.teams.forensic_analysis" not in sys.modules:
    stub = types.ModuleType("backend.app.agents.teams.forensic_analysis")

    def build_forensic_analysis_team(*args, **kwargs):
        return []

    stub.build_forensic_analysis_team = build_forensic_analysis_team
    sys.modules["backend.app.agents.teams.forensic_analysis"] = stub

if "backend.app.agents.teams.legal_research" not in sys.modules:
    stub = types.ModuleType("backend.app.agents.teams.legal_research")

    def build_legal_research_team(*args, **kwargs):
        return []

    stub.build_legal_research_team = build_legal_research_team
    sys.modules["backend.app.agents.teams.legal_research"] = stub

if "backend.app.agents.teams.litigation_support" not in sys.modules:
    stub = types.ModuleType("backend.app.agents.teams.litigation_support")

    class KnowledgeGraphQueryTool:
        pass

    class LLMDraftingTool:
        pass

    class SimulationTool:
        pass

    def build_litigation_support_team(*args, **kwargs):
        return []

    stub.KnowledgeGraphQueryTool = KnowledgeGraphQueryTool
    stub.LLMDraftingTool = LLMDraftingTool
    stub.SimulationTool = SimulationTool
    stub.build_litigation_support_team = build_litigation_support_team
    sys.modules["backend.app.agents.teams.litigation_support"] = stub

if "backend.app.agents.teams.software_development" not in sys.modules:
    stub = types.ModuleType("backend.app.agents.teams.software_development")

    class CodeGenerationTool:
        pass

    class CodeModificationTool:
        pass

    class TestExecutionTool:
        pass

    def build_software_development_team(*args, **kwargs):
        return []

    stub.CodeGenerationTool = CodeGenerationTool
    stub.CodeModificationTool = CodeModificationTool
    stub.TestExecutionTool = TestExecutionTool
    stub.build_software_development_team = build_software_development_team
    sys.modules["backend.app.agents.teams.software_development"] = stub

if "backend.app.agents.teams.ai_qa_oversight" not in sys.modules:
    stub = types.ModuleType("backend.app.agents.teams.ai_qa_oversight")

    def build_ai_qa_oversight_committee(*args, **kwargs):
        return []

    stub.build_ai_qa_oversight_committee = build_ai_qa_oversight_committee
    sys.modules["backend.app.agents.teams.ai_qa_oversight"] = stub

from backend.app.services.agents import SwarmsOrchestrator
from backend.app.agents.definitions import AgentDefinition
from backend.app.agents.runner import SessionGraph
from backend.app.agents.tools import (
    ForensicsTool,
    IngestionTool,
    QATool,
    ResearchTool,
    StrategyTool,
)


class SwarmsOrchestratorTests(unittest.TestCase):
    def test_orchestrator_initialization(self) -> None:
        strategy_tool = MagicMock(spec=StrategyTool)
        ingestion_tool = MagicMock(spec=IngestionTool)
        research_tool = MagicMock(spec=ResearchTool)
        forensics_tool = MagicMock(spec=ForensicsTool)
        qa_tool = MagicMock(spec=QATool)
        echo_tool = MagicMock()
        drafting_tool = MagicMock()
        deposition_tool = MagicMock()
        subpoena_tool = MagicMock()
        discovery_tool = MagicMock()
        trial_prep_tool = MagicMock()
        memory_store = MagicMock()

        orchestrator = SwarmsOrchestrator(
            strategy_tool=strategy_tool,
            ingestion_tool=ingestion_tool,
            research_tool=research_tool,
            forensics_tool=forensics_tool,
            qa_tool=qa_tool,
            echo_tool=echo_tool,
            drafting_tool=drafting_tool,
            deposition_tool=deposition_tool,
            subpoena_tool=subpoena_tool,
            discovery_tool=discovery_tool,
            trial_prep_tool=trial_prep_tool,
            memory_store=memory_store,
        )
        self.assertIsNotNone(orchestrator)

    def test_session_graph_from_definitions(self) -> None:
        strategy_tool = MagicMock(spec=StrategyTool, name="StrategyTool", component="strategy", role="strategy")
        ingestion_tool = MagicMock(spec=IngestionTool, name="IngestionTool", component="ingestion", role="ingestion")
        research_tool = MagicMock(spec=ResearchTool, name="ResearchTool", component="research", role="research")
        forensics_tool = MagicMock(spec=ForensicsTool, name="ForensicsTool", component="forensics", role="cocounsel")
        qa_tool = MagicMock(spec=QATool, name="QATool", component="qa", role="qa")

        strategy_def = AgentDefinition(
            name="Strategy", role="strategy", description="...", delegates=["Ingestion"], tool=strategy_tool
        )
        ingestion_def = AgentDefinition(
            name="Ingestion", role="ingestion", description="...", delegates=["Research"], tool=ingestion_tool
        )
        research_def = AgentDefinition(
            name="Research", role="research", description="...", delegates=["CoCounsel"], tool=research_tool
        )
        cocounsel_def = AgentDefinition(
            name="CoCounsel", role="cocounsel", description="...", delegates=["QA"], tool=forensics_tool
        )
        qa_def = AgentDefinition(name="QA", role="qa", description="...", delegates=[], tool=qa_tool)

        definitions = [strategy_def, ingestion_def, research_def, cocounsel_def, qa_def]

        session_graph = SessionGraph.from_definitions(definitions)

        self.assertEqual(session_graph.entry_role, "strategy")
        self.assertEqual(session_graph.order, ["strategy", "ingestion", "research", "cocounsel", "qa"])
        self.assertEqual(session_graph.nodes["strategy"].next_roles, ["ingestion"])
        self.assertEqual(session_graph.nodes["ingestion"].next_roles, ["research"])
        self.assertEqual(session_graph.nodes["research"].next_roles, ["cocounsel"])
        self.assertEqual(session_graph.nodes["cocounsel"].next_roles, ["qa"])
        self.assertEqual(session_graph.nodes["qa"].next_roles, [])


if __name__ == "__main__":
    unittest.main()
