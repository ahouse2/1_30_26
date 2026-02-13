"""
User journey:
As an operator, I want the full-stack launcher to always use the repo's
docker-compose.yml so that environment COMPOSE_FILE values cannot select
stale or incorrect compose definitions.
"""
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = REPO_ROOT / "scripts" / "start-stack-full.sh"


def test_start_stack_full_script_exists():
    assert SCRIPT_PATH.exists(), "start-stack-full.sh should exist in scripts/"


def test_start_stack_full_uses_repo_compose_file():
    content = SCRIPT_PATH.read_text(encoding="utf-8")
    assert "docker compose" in content
    assert "-f" in content, "docker compose should be called with -f to pin compose file"
    assert "docker-compose.yml" in content, "compose file path should be explicit"
