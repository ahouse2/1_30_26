from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple

from backend.app.services.drafting import DraftingService
from backend.app.services.errors import WorkflowComponent
from backend.app.services.llm_service import get_llm_service
from backend.app.services.retrieval import RetrievalService, get_retrieval_service
from backend.app.services.timeline import TimelineService, get_timeline_service

from ..context import AgentContext
from ..tools.base import AgentTool
from ..types import AgentTurn


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class DraftingTool(AgentTool):
    def __init__(self, drafting_service: DraftingService | None = None) -> None:
        super().__init__(
            name="drafting_pipeline",
            description="Drafts litigation materials (motions, briefs, narratives, outlines).",
            component=WorkflowComponent.RETRIEVAL,
        )
        self.drafting_service = drafting_service or DraftingService()

    def execute(self, context: AgentContext) -> Tuple[AgentTurn, Dict[str, Any]]:
        started = _utcnow()
        payload = self.drafting_service.draft(context.case_id)
        completed = _utcnow()
        metrics = {"drafts": len(payload.get("drafts", []))}
        turn = AgentTurn(
            role="drafting",
            action="draft_case_materials",
            input={"case_id": context.case_id},
            output=payload,
            started_at=started,
            completed_at=completed,
            metrics=metrics,
        )
        context.memory.update("drafting", payload)
        context.memory.record_turn(turn.to_dict())
        return turn, payload

    def summarize(self, context: AgentContext, payload: Dict[str, Any]) -> str:
        drafts = payload.get("drafts", [])
        return f"Drafting pipeline produced {len(drafts)} draft section(s)."

    def annotate(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return {"draft_count": len(payload.get("drafts", []))}


class DepositionPrepTool(AgentTool):
    def __init__(
        self,
        *,
        retrieval_service: RetrievalService | None = None,
    ) -> None:
        super().__init__(
            name="deposition_prep",
            description="Prepares deposition outlines and witness question sets.",
            component=WorkflowComponent.RETRIEVAL,
        )
        self.retrieval_service = retrieval_service or get_retrieval_service()
        self.llm_service = get_llm_service()

    def execute(self, context: AgentContext) -> Tuple[AgentTurn, Dict[str, Any]]:
        started = _utcnow()
        retrieval = self.retrieval_service.query(
            f"Deposition preparation for case {context.case_id}: {context.question}",
            page_size=max(context.top_k, 5),
        )
        prompt = (
            "Prepare a deposition outline and question tree using the evidence summary below.\n"
            "Return: (1) key themes, (2) witness sequence, (3) question list per theme.\n\n"
            f"Evidence Summary:\n{retrieval.answer}\n"
        )
        outline = self.llm_service.generate_text(prompt)
        payload = {
            "outline": outline,
            "citations": [c.to_dict() for c in retrieval.citations],
            "question": context.question,
        }
        completed = _utcnow()
        turn = AgentTurn(
            role="deposition_prep",
            action="prepare_outline",
            input={"case_id": context.case_id, "question": context.question},
            output=payload,
            started_at=started,
            completed_at=completed,
            metrics={"citations": len(payload["citations"])},
        )
        context.memory.update("deposition_prep", payload)
        context.memory.record_turn(turn.to_dict())
        return turn, payload

    def summarize(self, context: AgentContext, payload: Dict[str, Any]) -> str:
        return "Deposition prep produced an outline and witness sequence."


class SubpoenaPrepTool(AgentTool):
    def __init__(self) -> None:
        super().__init__(
            name="subpoena_prep",
            description="Drafts subpoena requests and production checklists.",
            component=WorkflowComponent.RETRIEVAL,
        )
        self.llm_service = get_llm_service()

    def execute(self, context: AgentContext) -> Tuple[AgentTurn, Dict[str, Any]]:
        started = _utcnow()
        prompt = (
            "Draft a subpoena request checklist and document list based on the case prompt:\n"
            f"{context.question}\n"
        )
        subpoena = self.llm_service.generate_text(prompt)
        payload = {"subpoena_packet": subpoena, "question": context.question}
        completed = _utcnow()
        turn = AgentTurn(
            role="subpoena",
            action="draft_subpoena",
            input={"case_id": context.case_id, "question": context.question},
            output=payload,
            started_at=started,
            completed_at=completed,
            metrics={"length": len(subpoena)},
        )
        context.memory.update("subpoena_prep", payload)
        context.memory.record_turn(turn.to_dict())
        return turn, payload

    def summarize(self, context: AgentContext, payload: Dict[str, Any]) -> str:
        return "Subpoena prep drafted a request checklist and document list."


class DiscoveryProductionTool(AgentTool):
    def __init__(
        self,
        *,
        retrieval_service: RetrievalService | None = None,
    ) -> None:
        super().__init__(
            name="discovery_production",
            description="Builds discovery production plans and response matrices.",
            component=WorkflowComponent.RETRIEVAL,
        )
        self.retrieval_service = retrieval_service or get_retrieval_service()
        self.llm_service = get_llm_service()

    def execute(self, context: AgentContext) -> Tuple[AgentTurn, Dict[str, Any]]:
        started = _utcnow()
        retrieval = self.retrieval_service.query(
            f"Discovery production planning for case {context.case_id}: {context.question}",
            page_size=max(context.top_k, 5),
        )
        prompt = (
            "Create a discovery production plan and response matrix. "
            "Include deadlines, custodians, and categories.\n\n"
            f"Evidence Summary:\n{retrieval.answer}\n"
        )
        plan = self.llm_service.generate_text(prompt)
        payload = {
            "production_plan": plan,
            "citations": [c.to_dict() for c in retrieval.citations],
        }
        completed = _utcnow()
        turn = AgentTurn(
            role="discovery",
            action="draft_production_plan",
            input={"case_id": context.case_id, "question": context.question},
            output=payload,
            started_at=started,
            completed_at=completed,
            metrics={"citations": len(payload["citations"])},
        )
        context.memory.update("discovery_production", payload)
        context.memory.record_turn(turn.to_dict())
        return turn, payload

    def summarize(self, context: AgentContext, payload: Dict[str, Any]) -> str:
        return "Discovery production plan drafted with response matrix."


class TrialPreparationTool(AgentTool):
    def __init__(
        self,
        *,
        timeline_service: TimelineService | None = None,
    ) -> None:
        super().__init__(
            name="trial_preparation",
            description="Builds trial prep checklists and hearing playbooks.",
            component=WorkflowComponent.STRATEGY,
        )
        self.timeline_service = timeline_service or get_timeline_service()
        self.llm_service = get_llm_service()

    def execute(self, context: AgentContext) -> Tuple[AgentTurn, Dict[str, Any]]:
        started = _utcnow()
        events = self.timeline_service.list_events(limit=10)
        event_summaries = [event.summary for event in events.events]
        prompt = (
            "Create a trial prep checklist with task owners and deadlines. "
            "Use the recent timeline highlights below.\n\n"
            f"Timeline Highlights:\n- " + "\n- ".join(event_summaries)
        )
        checklist = self.llm_service.generate_text(prompt)
        payload = {"checklist": checklist, "events_considered": len(event_summaries)}
        completed = _utcnow()
        turn = AgentTurn(
            role="trial_prep",
            action="build_trial_prep",
            input={"case_id": context.case_id},
            output=payload,
            started_at=started,
            completed_at=completed,
            metrics={"events": len(event_summaries)},
        )
        context.memory.update("trial_prep", payload)
        context.memory.record_turn(turn.to_dict())
        return turn, payload

    def summarize(self, context: AgentContext, payload: Dict[str, Any]) -> str:
        return "Trial prep checklist generated from timeline highlights."
