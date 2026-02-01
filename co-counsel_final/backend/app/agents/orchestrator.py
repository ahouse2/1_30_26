from __future__ import annotations

from typing import Any, Callable, Dict, Protocol, Tuple

from ..services.errors import WorkflowComponent
from .types import AgentThread, AgentTurn

ComponentExecutor = Callable[
    [WorkflowComponent, Callable[[], Tuple[AgentTurn, Dict[str, Any]]]],
    Tuple[AgentTurn, Dict[str, Any]],
]


class AgentsOrchestrator(Protocol):
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
        ...

    def invoke_agent(self, *, session_id: str, agent_name: str, prompt: str) -> str:
        ...
