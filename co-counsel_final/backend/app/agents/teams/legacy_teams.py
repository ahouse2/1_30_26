from __future__ import annotations

from typing import List

from backend.app.agents.definitions import AgentDefinition
from backend.app.agents.tools.base import AgentTool


def _build_team(
    *,
    name_prefix: str,
    role_prefix: str,
    tool: AgentTool,
    qa_tool: AgentTool | None = None,
) -> List[AgentDefinition]:
    lead_name = f"{name_prefix}Lead"
    lead_role = f"{role_prefix}_lead"
    delegates: List[str] = []
    definitions: List[AgentDefinition] = []
    if qa_tool is not None:
        qa_name = f"{name_prefix}QA"
        qa_role = f"{role_prefix}_qa"
        delegates = [qa_name]
        definitions.append(
            AgentDefinition(
                name=qa_name,
                role=qa_role,
                description=f"QA reviewer for {name_prefix} outputs.",
                tool=qa_tool,
                delegates=[],
            )
        )
    definitions.insert(
        0,
        AgentDefinition(
            name=lead_name,
            role=lead_role,
            description=f"Lead agent for {name_prefix} workflows.",
            tool=tool,
            delegates=delegates,
        ),
    )
    return definitions


def build_drafting_team(tool: AgentTool, qa_tool: AgentTool | None = None) -> List[AgentDefinition]:
    return _build_team(
        name_prefix="Drafting",
        role_prefix="drafting",
        tool=tool,
        qa_tool=qa_tool,
    )


def build_deposition_team(tool: AgentTool, qa_tool: AgentTool | None = None) -> List[AgentDefinition]:
    return _build_team(
        name_prefix="Deposition",
        role_prefix="deposition",
        tool=tool,
        qa_tool=qa_tool,
    )


def build_subpoena_team(tool: AgentTool, qa_tool: AgentTool | None = None) -> List[AgentDefinition]:
    return _build_team(
        name_prefix="Subpoena",
        role_prefix="subpoena",
        tool=tool,
        qa_tool=qa_tool,
    )


def build_discovery_team(tool: AgentTool, qa_tool: AgentTool | None = None) -> List[AgentDefinition]:
    return _build_team(
        name_prefix="Discovery",
        role_prefix="discovery",
        tool=tool,
        qa_tool=qa_tool,
    )


def build_trial_prep_team(tool: AgentTool, qa_tool: AgentTool | None = None) -> List[AgentDefinition]:
    return _build_team(
        name_prefix="TrialPrep",
        role_prefix="trial_prep",
        tool=tool,
        qa_tool=qa_tool,
    )
