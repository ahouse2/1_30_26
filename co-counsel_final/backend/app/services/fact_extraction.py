from __future__ import annotations

from typing import Dict, List

from .retrieval import RetrievalService

from ..utils.triples import extract_triples


class FactExtractionService:
    def __init__(self, retrieval_service: RetrievalService | None = None) -> None:
        self.retrieval_service = retrieval_service or RetrievalService()

    def extract(self, case_id: str) -> Dict[str, object]:
        question = (
            "Extract the key facts, entities, and events from the evidence corpus. "
            f"Case ID: {case_id}. Provide concise bullet points."
        )
        result = self.retrieval_service.query(question, page_size=5)
        facts = [line.strip("- ") for line in result.answer.split("\n") if line.strip()]
        entities: List[dict] = []
        for citation in result.citations:
            for entity in citation.entities:
                entities.append(entity.to_dict())
        events = result.trace.graph.get("events", []) if hasattr(result.trace, "graph") else []
        triples = [
            {
                "subject": t.subject.label,
                "predicate": t.predicate,
                "object": t.obj.label,
                "evidence": t.evidence,
            }
            for t in extract_triples(result.answer)
        ]
        graph = {"nodes": [{"id": e["id"], "type": e.get("type", "Entity"), "properties": e} for e in entities], "edges": []}
        return {
            "case_id": case_id,
            "facts": facts,
            "entities": entities,
            "events": events,
            "triples": triples,
            "citations": [c.to_dict() for c in result.citations],
            "traces": result.trace.to_dict(),
            "graph": graph,
        }
