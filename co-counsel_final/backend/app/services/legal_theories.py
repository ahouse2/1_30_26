from __future__ import annotations

import asyncio
from typing import Dict, List

from .graph import GraphService
from .llm_service import get_llm_service
from .retrieval import RetrievalService


def _run_async(coro):
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)
    raise RuntimeError("Cannot run async operation inside an active event loop")


class LegalTheoryService:
    def __init__(
        self,
        retrieval_service: RetrievalService | None = None,
        graph_service: GraphService | None = None,
    ) -> None:
        self.retrieval_service = retrieval_service or RetrievalService()
        self.graph_service = graph_service or GraphService()
        self.llm = get_llm_service()

    def generate(self, case_id: str) -> Dict[str, object]:
        question = (
            "Synthesize legal theories for the case based on the available evidence. "
            "Summarize key theories and cite supporting evidence." 
            f" Case ID: {case_id}."
        )
        retrieval = self.retrieval_service.query(question, page_size=5)
        strategy_brief = self.graph_service.synthesize_strategy_brief(limit=8)
        prompt = (
            "You are a litigation strategist. Based on the following evidence summary and strategy brief, "
            "produce 3-5 legal theories with one-line rationales.\n\n"
            f"Evidence Summary:\n{retrieval.answer}\n\n"
            f"Strategy Brief Summary:\n{strategy_brief.summary}\n"
        )
        theories_text = self.llm.generate_text(prompt)
        theories = [line.strip("- ") for line in theories_text.split("\n") if line.strip()]
        graph = {
            "nodes": strategy_brief.to_dict().get("focus_nodes", []),
            "edges": [
                {
                    "source": c["source"].get("id"),
                    "target": c["target"].get("id"),
                    "type": "CONTRADICTION",
                    "properties": {"relation": c.get("relation")},
                }
                for c in strategy_brief.to_dict().get("contradictions", [])
            ],
        }
        return {
            "case_id": case_id,
            "theories": theories,
            "strategy_brief": strategy_brief.to_dict(),
            "citations": [c.to_dict() for c in retrieval.citations],
            "traces": retrieval.trace.to_dict(),
            "graph": graph,
        }
