from __future__ import annotations

import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import pytest

from backend.app import config
from backend.app.services.forensics import ForensicsService
from backend.tools import forensics as forensics_cli


@pytest.fixture()
def forensics_service(tmp_path, monkeypatch) -> ForensicsService:
    monkeypatch.setenv("FORENSICS_DIR", str(tmp_path / "forensics"))
    config.reset_settings_cache()
    return ForensicsService()


def test_dump_command_outputs_json(forensics_service: ForensicsService, tmp_path: Path, capsys) -> None:
    sample = tmp_path / "notes.txt"
    sample.write_text("Table of Contents\n\nKey Facts")
    forensics_service.build_document_artifact("doc-cli", sample)
    exit_code = forensics_cli.main(
        ["dump", "--id", "doc-cli", "--artifact", "document"],
        service_factory=lambda: forensics_service,
    )
    assert exit_code == 0
    captured = capsys.readouterr().out
    payload = json.loads(captured)
    assert payload["summary"]
    assert payload["schema_version"]
