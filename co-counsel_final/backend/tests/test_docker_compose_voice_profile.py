"""
User journey:
As an operator, I want optional voice services in production,
so the core stack can start even when voice images are unavailable.
"""
from pathlib import Path
import re


REPO_ROOT = Path(__file__).resolve().parents[2]
COMPOSE_PATH = REPO_ROOT / "docker-compose.yml"
SCRIPT_PATH = REPO_ROOT / "scripts" / "start-stack-full.sh"


def _service_block(service_name: str) -> str:
    text = COMPOSE_PATH.read_text(encoding="utf-8")
    pattern = rf"^  {service_name}:\n(?:^[ ]{{4,}}.*\n)+"
    match = re.search(pattern, text, flags=re.MULTILINE)
    assert match, f"{service_name} service block not found"
    return match.group(0)


def test_stt_service_is_voice_profile_only():
    block = _service_block("stt")
    assert "profiles:" in block
    assert "- voice" in block
    assert "- prod" not in block
    assert "linuxserver/faster-whisper:latest" in block
    assert "\"9000:10300\"" in block


def test_tts_service_is_voice_profile_only():
    block = _service_block("tts")
    assert "profiles:" in block
    assert "- voice" in block
    assert "- prod" not in block
    assert "rhasspy/larynx:latest" in block


def test_start_stack_full_supports_voice_flag():
    script = SCRIPT_PATH.read_text(encoding="utf-8")
    assert "--voice" in script
    assert "--profile voice" in script
