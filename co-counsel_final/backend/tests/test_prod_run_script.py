"""
User journey:
As an operator, I want a one-click production docker compose launcher,
so that I can start the full stack quickly without remembering flags.
"""
from pathlib import Path
import stat


REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = REPO_ROOT / "scripts" / "run-prod.sh"


def test_run_prod_script_exists():
    assert SCRIPT_PATH.exists(), "run-prod.sh should exist in scripts/"


def test_run_prod_script_is_executable():
    mode = SCRIPT_PATH.stat().st_mode
    assert mode & stat.S_IXUSR, "run-prod.sh should be executable"


def test_run_prod_script_invokes_full_stack():
    content = SCRIPT_PATH.read_text(encoding="utf-8")
    assert "start-stack-full.sh" in content
    assert "--mode prod" in content
