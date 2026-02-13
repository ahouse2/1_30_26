from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict, List


@dataclass(frozen=True)
class PhaseDefinition:
    name: str
    handler: Callable[..., dict]
    swarms_profile: str
    outputs: List[str]


def get_phase_registry() -> Dict[str, PhaseDefinition]:
    from . import phases

    return {
        "ingestion": PhaseDefinition(
            name="ingestion",
            handler=phases.run_ingestion,
            swarms_profile="DocumentIngestionTeam",
            outputs=["json", "md"],
        ),
        "preprocess": PhaseDefinition(
            name="preprocess",
            handler=phases.run_preprocess,
            swarms_profile="DocumentIngestionTeam",
            outputs=["json", "md"],
        ),
        "forensics": PhaseDefinition(
            name="forensics",
            handler=phases.run_forensics,
            swarms_profile="ForensicsTeam",
            outputs=["json", "md"],
        ),
        "parsing_chunking": PhaseDefinition(
            name="parsing_chunking",
            handler=phases.run_parsing_chunking,
            swarms_profile="DocumentIngestionTeam",
            outputs=["json", "md"],
        ),
        "indexing": PhaseDefinition(
            name="indexing",
            handler=phases.run_indexing,
            swarms_profile="DocumentIngestionTeam",
            outputs=["json", "md"],
        ),
        "court_sync": PhaseDefinition(
            name="court_sync",
            handler=phases.run_court_sync,
            swarms_profile="LegalResearchTeam",
            outputs=["json", "md"],
        ),
        "fact_extraction": PhaseDefinition(
            name="fact_extraction",
            handler=phases.run_fact_extraction,
            swarms_profile="CoreCaseTeam",
            outputs=["json", "md"],
        ),
        "timeline": PhaseDefinition(
            name="timeline",
            handler=phases.run_timeline,
            swarms_profile="CoreCaseTeam",
            outputs=["json", "md"],
        ),
        "legal_theories": PhaseDefinition(
            name="legal_theories",
            handler=phases.run_legal_theories,
            swarms_profile="LegalResearchTeam",
            outputs=["json", "md"],
        ),
        "strategy": PhaseDefinition(
            name="strategy",
            handler=phases.run_strategy,
            swarms_profile="LitigationSupportTeam",
            outputs=["json", "md"],
        ),
        "drafting": PhaseDefinition(
            name="drafting",
            handler=phases.run_drafting,
            swarms_profile="LitigationSupportTeam",
            outputs=["json", "md"],
        ),
        "qa_review": PhaseDefinition(
            name="qa_review",
            handler=phases.run_qa_review,
            swarms_profile="QAOversightTeam",
            outputs=["json", "md"],
        ),
    }
