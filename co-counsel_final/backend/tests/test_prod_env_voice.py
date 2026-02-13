"""
User journey:
As an operator, I want the default production TTS voice to be a high-quality
female preset so the out-of-the-box experience is aligned with the product spec.
"""
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
PROD_ENV = REPO_ROOT / "infra" / "profiles" / "prod.env"


def test_prod_env_sets_female_tts_voice():
    content = PROD_ENV.read_text(encoding="utf-8")
    assert "TTS_VOICE=" in content
    assert "en-us-blizzard_lessac" in content
