from __future__ import annotations

from pathlib import Path
from typing import Iterable, Sequence

from fastapi import HTTPException, status

from backend.app.agents.agents.toolkit.sandbox import SandboxExecutionHarness
from backend.app.config import get_settings
from backend.app.models.api import SandboxCommandResultModel
from backend.app.security.authz import Principal


class SandboxService:
    """Runs vetted commands inside a disposable sandbox workspace."""

    def __init__(
        self,
        *,
        repo_root: Path | None = None,
        allowed_commands: Iterable[Sequence[str]] | None = None,
    ) -> None:
        settings = get_settings()
        self.repo_root = repo_root or Path(__file__).resolve().parents[3]
        self.allowed_commands = [list(cmd) for cmd in (allowed_commands or settings.dev_agent_validation_commands)]

    def execute_command(self, principal: Principal, command: Sequence[str]) -> SandboxCommandResultModel:
        if not command:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Command may not be empty")
        if self.allowed_commands:
            if list(command) not in self.allowed_commands:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Command not permitted for sandbox execution",
                )
        harness = SandboxExecutionHarness(self.repo_root, commands=[list(command)])
        result = harness.validate("")
        command_result = result.commands[0]
        return SandboxCommandResultModel(
            command=list(command_result.command),
            return_code=command_result.return_code,
            stdout=command_result.stdout,
            stderr=command_result.stderr,
            duration_ms=command_result.duration_ms,
        )


def get_sandbox_service() -> SandboxService:
    return SandboxService()
