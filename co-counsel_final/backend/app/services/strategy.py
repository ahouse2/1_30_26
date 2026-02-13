from __future__ import annotations

from typing import Dict, List

from .graph import GraphService
from .llm_service import get_llm_service
from .retrieval import RetrievalService


class StrategyService:
    def __init__(
        self,
        retrieval_service: RetrievalService | None = None,
        graph_service: GraphService | None = None,
    ) -> None:
        self.retrieval_service = retrieval_service or RetrievalService()
        self.graph_service = graph_service or GraphService()
        self.llm = get_llm_service()

    def recommend(self, case_id: str) -> Dict[str, object]:
        question = (
            "Provide strategic recommendations for litigation or negotiation based on evidence and timelines. "
            f"Case ID: {case_id}."
        )
        retrieval = self.retrieval_service.query(question, page_size=5)
        strategy_brief = self.graph_service.synthesize_strategy_brief(limit=6)
        prompt = (
            "You are lead trial counsel. Given the evidence summary and strategy brief, "
            "produce 5 concise strategic recommendations with risk notes.\n\n"
            f"Evidence Summary:\n{retrieval.answer}\n\n"
            f"Strategy Brief Summary:\n{strategy_brief.summary}\n"
        )
        recommendations_text = self.llm.generate_text(prompt)
        recommendations = [line.strip("- ") for line in recommendations_text.split("\n") if line.strip()]
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
            "recommendations": recommendations,
            "strategy_brief": strategy_brief.to_dict(),
            "citations": [c.to_dict() for c in retrieval.citations],
            "traces": retrieval.trace.to_dict(),
            "graph": graph,
        }
