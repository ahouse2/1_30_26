from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
import json
from typing import Any, Dict, List, Tuple
from uuid import uuid4

from swarms import Agent

from ..config import get_settings
from ..services.errors import WorkflowAbort, WorkflowComponent, WorkflowError, WorkflowSeverity
from .context import AgentContext
from .memory import AgentMemoryStore, CaseThreadMemory
from .orchestrator import ComponentExecutor
from .tools.base import AgentTool
from .types import AgentThread, AgentTurn


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass(slots=True)
class SwarmsOrchestrator:
    strategy_tool: AgentTool
    ingestion_tool: AgentTool
    research_tool: AgentTool
    forensics_tool: AgentTool
    qa_tool: AgentTool
    echo_tool: AgentTool
    memory_store: AgentMemoryStore
    max_rounds: int = 12
    tools: Dict[str, AgentTool] = field(init=False)
    router_agent: Agent = field(init=False)
    synthesis_agent: Agent = field(init=False)

    def __post_init__(self) -> None:
        self.tools = {
            "strategy": self.strategy_tool,
            "ingestion": self.ingestion_tool,
            "research": self.research_tool,
            "forensics": self.forensics_tool,
            "qa": self.qa_tool,
            "echo": self.echo_tool,
        }
        settings = get_settings()
        model_name = settings.default_chat_model
        self.router_agent = Agent(
            agent_name="swarm-router",
            agent_description="Routes requests to the correct legal workflow steps.",
            system_prompt=self._router_system_prompt(),
            model_name=model_name,
            max_loops=1,
            output_type="json",
        )
        self.synthesis_agent = Agent(
            agent_name="swarm-synthesizer",
            agent_description="Synthesizes multi-step outputs into a single legal response.",
            system_prompt=self._synthesis_system_prompt(),
            model_name=model_name,
            max_loops=1,
        )

    def run(
        self,
        *,
        case_id: str,
        question: str,
        top_k: int,
        actor: Dict[str, object],
        component_executor: ComponentExecutor,
        thread_id: str | None = None,
        thread: AgentThread | None = None,
        telemetry: Dict[str, object] | None = None,
        autonomy_level: str = "balanced",
        max_turns: int | None = None,
        policy_state: Dict[str, Any] | None = None,
    ) -> AgentThread:
        if thread is None:
            thread = AgentThread(
                thread_id=thread_id or str(uuid4()),
                case_id=case_id,
                question=question,
                created_at=_utcnow(),
                updated_at=_utcnow(),
            )
        else:
            thread.thread_id = thread_id or thread.thread_id
            thread.case_id = case_id
            thread.question = question
            thread.updated_at = _utcnow()

        memory = CaseThreadMemory(thread, self.memory_store, state=dict(thread.memory))
        telemetry = telemetry or {}
        telemetry.setdefault("autonomy_level", autonomy_level)
        if policy_state:
            telemetry.setdefault("policy", {}).update(policy_state)

        context = AgentContext(
            case_id=case_id,
            question=question,
            top_k=top_k,
            actor=actor,
            memory=memory,
            telemetry=telemetry,
        )

        routing_plan = self._resolve_routing_plan(question, autonomy_level)
        telemetry["swarm_routing_plan"] = list(routing_plan)
        summaries: List[str] = []

        for step in routing_plan:
            tool = self.tools[step]

            def operation() -> Tuple[AgentTurn, Dict[str, Any]]:
                invocation = tool.invoke(context)
                return invocation.turn, invocation.payload

            turn, payload = component_executor(tool.component, operation)
            thread.turns.append(turn)
            summaries.append(tool.summarize(context, payload))

        thread.final_answer = self._synthesize_answer(question, summaries)
        thread.turns.append(
            AgentTurn(
                role="synthesis",
                action="synthesize_answer",
                input={"question": question, "summaries": summaries},
                output={"answer": thread.final_answer},
                started_at=_utcnow(),
                completed_at=_utcnow(),
                metrics={"summary_count": len(summaries)},
            )
        )
        thread.updated_at = _utcnow()
        thread.telemetry = telemetry
        return thread

    def invoke_agent(self, *, session_id: str, agent_name: str, prompt: str) -> str:
        context = AgentContext(
            case_id=session_id,
            question=prompt,
            top_k=4,
            actor={"type": "api"},
            memory=CaseThreadMemory(
                AgentThread(
                    thread_id=session_id,
                    case_id=session_id,
                    question=prompt,
                    created_at=_utcnow(),
                    updated_at=_utcnow(),
                ),
                self.memory_store,
                state={},
            ),
            telemetry={},
        )
        if agent_name in self.tools:
            tool = self.tools[agent_name]
            invocation = tool.invoke(context)
            return invocation.message
        if agent_name == "router":
            response = self.router_agent.run(self._router_prompt(prompt, "balanced"))
            if isinstance(response, dict):
                return json.dumps(response)
            if isinstance(response, str):
                return response
            raise WorkflowAbort(
                WorkflowError(
                    component=WorkflowComponent.ORCHESTRATOR,
                    code="swarm_router_invalid",
                    message="Swarms router returned a non-text response.",
                    severity=WorkflowSeverity.ERROR,
                )
            )
        if agent_name == "synthesis":
            return self._synthesize_answer(prompt, [])
        raise WorkflowAbort(
            WorkflowError(
                component=WorkflowComponent.ORCHESTRATOR,
                code="swarm_agent_not_found",
                message=f"Swarms agent '{agent_name}' is not registered.",
                severity=WorkflowSeverity.ERROR,
            )
        )

    def _resolve_routing_plan(self, question: str, autonomy_level: str) -> List[str]:
        prompt = self._router_prompt(question, autonomy_level)
        response = self.router_agent.run(prompt)
        if isinstance(response, dict):
            payload = response
        elif isinstance(response, str):
            payload = self._extract_json_payload(response)
        else:
            raise WorkflowAbort(
                WorkflowError(
                    component=WorkflowComponent.ORCHESTRATOR,
                    code="swarm_router_invalid",
                    message="Swarms router returned a non-text response.",
                    severity=WorkflowSeverity.ERROR,
                )
            )
        steps = payload.get("steps")
        if not isinstance(steps, list) or not steps:
            raise WorkflowAbort(
                WorkflowError(
                    component=WorkflowComponent.ORCHESTRATOR,
                    code="swarm_router_empty",
                    message="Swarms router did not return a valid step list.",
                    severity=WorkflowSeverity.ERROR,
                )
            )
        invalid = [step for step in steps if step not in self.tools]
        if invalid:
            raise WorkflowAbort(
                WorkflowError(
                    component=WorkflowComponent.ORCHESTRATOR,
                    code="swarm_router_unknown_step",
                    message=f"Swarms router returned unsupported steps: {', '.join(invalid)}.",
                    severity=WorkflowSeverity.ERROR,
                    context={"steps": steps},
                )
            )
        return steps

    def _extract_json_payload(self, response: str) -> Dict[str, Any]:
        start = response.find("{")
        end = response.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise WorkflowAbort(
                WorkflowError(
                    component=WorkflowComponent.ORCHESTRATOR,
                    code="swarm_router_parse_failed",
                    message="Swarms router response did not include a JSON object.",
                    severity=WorkflowSeverity.ERROR,
                    context={"response": response},
                )
            )
        try:
            payload = json.loads(response[start : end + 1])
        except json.JSONDecodeError as exc:
            raise WorkflowAbort(
                WorkflowError(
                    component=WorkflowComponent.ORCHESTRATOR,
                    code="swarm_router_invalid_json",
                    message="Swarms router returned invalid JSON.",
                    severity=WorkflowSeverity.ERROR,
                    context={"error": str(exc)},
                )
            ) from exc
        if not isinstance(payload, dict):
            raise WorkflowAbort(
                WorkflowError(
                    component=WorkflowComponent.ORCHESTRATOR,
                    code="swarm_router_invalid_payload",
                    message="Swarms router JSON payload must be an object.",
                    severity=WorkflowSeverity.ERROR,
                )
            )
        return payload

    def _synthesize_answer(self, question: str, summaries: List[str]) -> str:
        prompt = self._synthesis_prompt(question, summaries)
        response = self.synthesis_agent.run(prompt)
        if not isinstance(response, str):
            raise WorkflowAbort(
                WorkflowError(
                    component=WorkflowComponent.ORCHESTRATOR,
                    code="swarm_synthesis_invalid",
                    message="Swarms synthesis agent returned a non-text response.",
                    severity=WorkflowSeverity.ERROR,
                )
            )
        return response.strip()

    def _router_system_prompt(self) -> str:
        tool_list = "\n".join(
            f"- {name}: {tool.description}" for name, tool in self.tools.items()
        )
        return (
            "You are a legal discovery routing agent for Co-Counsel. "
            "Select the exact tool sequence required to answer the user. "
            "Return only JSON with a 'steps' array using the tool names below.\n\n"
            f"Available tools:\n{tool_list}\n"
        )

    def _router_prompt(self, question: str, autonomy_level: str) -> str:
        return (
            "Decide the tool execution order for this request. "
            "Always include QA if autonomy_level is 'balanced' or 'high'. "
            "Respond only with JSON in the form: {\"steps\": [\"strategy\", ...]}.\n\n"
            f"autonomy_level: {autonomy_level}\n"
            f"question: {question}\n"
        )

    def _synthesis_system_prompt(self) -> str:
        return (
            "You are the final synthesis agent for a legal discovery workflow. "
            "Combine provided tool summaries into a precise, executive-grade response."
        )

    def _synthesis_prompt(self, question: str, summaries: List[str]) -> str:
        summary_block = "\n".join(f"- {summary}" for summary in summaries) or "- No tool output."
        return (
            "Synthesize a final response for the user.\n\n"
            f"Question: {question}\n\n"
            "Tool summaries:\n"
            f"{summary_block}\n"
        )
