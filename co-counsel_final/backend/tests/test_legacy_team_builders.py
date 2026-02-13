from backend.app.agents.definitions import AgentDefinition
from backend.app.agents.teams.legacy_teams import (
    build_drafting_team,
    build_deposition_team,
    build_subpoena_team,
    build_discovery_team,
    build_trial_prep_team,
)
from backend.app.agents.tools.base import AgentTool
from backend.app.services.errors import WorkflowComponent
from backend.app.agents.types import AgentTurn
from datetime import datetime, timezone


class DummyTool(AgentTool):
    def __init__(self, name: str):
        super().__init__(name=name, description="dummy", component=WorkflowComponent.STRATEGY)

    def execute(self, context: AgentContext):
        now = datetime.now(timezone.utc)
        turn = AgentTurn(
            role="dummy",
            action="noop",
            input={},
            output={"ok": True},
            started_at=now,
            completed_at=now,
        )
        return turn, {"ok": True}


def _assert_team(definitions: list[AgentDefinition]) -> None:
    assert definitions
    for item in definitions:
        assert isinstance(item, AgentDefinition)
        assert item.tool is not None
        assert item.role


def test_build_drafting_team() -> None:
    team = build_drafting_team(DummyTool("drafting"))
    _assert_team(team)


def test_build_deposition_team() -> None:
    team = build_deposition_team(DummyTool("deposition"))
    _assert_team(team)


def test_build_subpoena_team() -> None:
    team = build_subpoena_team(DummyTool("subpoena"))
    _assert_team(team)


def test_build_discovery_team() -> None:
    team = build_discovery_team(DummyTool("discovery"))
    _assert_team(team)


def test_build_trial_prep_team() -> None:
    team = build_trial_prep_team(DummyTool("trial_prep"))
    _assert_team(team)
