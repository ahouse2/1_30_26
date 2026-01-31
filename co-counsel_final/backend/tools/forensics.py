"""Command-line utilities for inspecting persisted forensics reports."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Callable

from backend.app.services.forensics import ForensicsService, get_forensics_service


def _dump_command(service: ForensicsService, args: argparse.Namespace) -> int:
    artifact = args.artifact
    try:
        payload = service.load_artifact(args.id, artifact)
    except FileNotFoundError as exc:  # pragma: no cover - exercised via CLI test
        print(f"error: {exc}", file=sys.stderr)
        return 2
    output = json.dumps(payload, indent=2, sort_keys=True)
    if args.output:
        Path(args.output).write_text(output, encoding="utf-8")
    else:
        print(output)
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Forensics toolbox utilities")
    subparsers = parser.add_subparsers(dest="command", required=True)

    dump_parser = subparsers.add_parser("dump", help="Dump an artefact to stdout or file")
    dump_parser.add_argument("--id", required=True, help="Document identifier")
    dump_parser.add_argument(
        "--artifact",
        default="document",
        choices=["document", "image", "financial"],
        help="Artefact type to materialise",
    )
    dump_parser.add_argument(
        "--output",
        type=str,
        help="Optional path to write JSON instead of stdout",
    )
    return parser


def main(argv: list[str] | None = None, *, service_factory: Callable[[], ForensicsService] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    factory = service_factory or get_forensics_service
    service = factory()
    if args.command == "dump":
        return _dump_command(service, args)
    parser.print_help()
    return 1


if __name__ == "__main__":  # pragma: no cover - CLI entrypoint
    raise SystemExit(main())
