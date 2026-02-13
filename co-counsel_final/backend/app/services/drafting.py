from __future__ import annotations

import asyncio
from typing import Dict

from .llm_service import get_llm_service
from .retrieval import RetrievalService
from ..services.knowledge_graph_service import KnowledgeGraphService


def _run_async(coro):
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)
    raise RuntimeError("Cannot run async operation inside an active event loop")


class DraftingService:
    def __init__(
        self,
        retrieval_service: RetrievalService | None = None,
        knowledge_graph_service: KnowledgeGraphService | None = None,
    ) -> None:
        self.retrieval_service = retrieval_service or RetrievalService()
        self.knowledge_graph_service = knowledge_graph_service or KnowledgeGraphService()
        self.llm = get_llm_service()

    def draft(self, case_id: str) -> Dict[str, object]:
        case_summary = _run_async(self.knowledge_graph_service.get_case_summary(case_id))
        retrieval = self.retrieval_service.query(
            f"Draft a litigation narrative and outline based on evidence for case {case_id}.",
            page_size=5,
        )
        prompt = (
            "You are drafting for litigation. Produce the following sections in Markdown, each with an H2 header:\n"
            "## Motion\n"
            "## Brief\n"
            "## Timeline Narrative\n"
            "## Presentation Outline\n\n"
            "Use the case summary and evidence summary below. Include citations or exhibit references inline when relevant.\n\n"
            f"Case Summary:\n{case_summary}\n\n"
            f"Evidence Summary:\n{retrieval.answer}\n"
        )
        draft_text = self.llm.generate_text(prompt)
        sections = {}
        current = None
        for line in draft_text.split("\n"):
            if line.startswith("## " ):
                current = line.replace("## ", "").strip().lower().replace(" ", "_")
                sections[current] = []
                continue
            if current is not None:
                sections[current].append(line)
        drafts = [
            {"type": key, "content": "\n".join(value).strip()}
            for key, value in sections.items()
        ]
        graph = {
            "nodes": [],
            "edges": [],
        }
        return {
            "case_id": case_id,
            "draft": draft_text,
            "drafts": drafts,
            "citations": [c.to_dict() for c in retrieval.citations],
            "traces": retrieval.trace.to_dict(),
            "graph": graph,
        }
