from __future__ import annotations

from typing import Dict

from ..services.forensics import ForensicsService
from ..services.ingestion import IngestionService


def run_ingestion(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    service = IngestionService()
    summary = service.summarize_latest(case_id)
    return {"summary": summary, "graph": {"nodes": 0, "edges": 0}}


def run_preprocess(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    service = IngestionService()
    result = service.preprocess_case(case_id)
    return {"summary": result}


def run_forensics(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    forensics = ForensicsService()
    report = forensics.run_case(case_id)
    return {"summary": report}


def run_parsing_chunking(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    service = IngestionService()
    result = service.parse_and_chunk(case_id)
    return {"summary": result}


def run_indexing(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    service = IngestionService()
    index = service.index_case(case_id)
    return {"summary": index}


def run_fact_extraction(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    from ..services.fact_extraction import FactExtractionService
    return FactExtractionService().extract(case_id)


def run_timeline(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    from ..services.timeline import TimelineService
    return {"timeline": TimelineService().get_timeline(case_id)}


def run_legal_theories(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    from ..services.legal_theories import LegalTheoryService
    return LegalTheoryService().generate(case_id)


def run_strategy(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    from ..services.strategy import StrategyService
    return StrategyService().recommend(case_id)


def run_drafting(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    from ..services.drafting import DraftingService
    return DraftingService().draft(case_id)

def run_court_sync(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    from ..services.court_integration import CourtIntegrationService
    status = CourtIntegrationService().provider_status()
    return {"providers": status, "case_id": case_id}


def run_qa_review(case_id: str, payload: Dict[str, object]) -> Dict[str, object]:
    from ..services.qa_oversight_service import QAOversightService
    return QAOversightService().review(case_id)
