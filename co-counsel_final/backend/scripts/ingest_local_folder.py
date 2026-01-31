#!/usr/bin/env python3
"""Simple local data onboarding: enqueue an ingestion job for a local folder.

Usage: python3 backend/scripts/ingest_local_folder.py /path/to/data
"""
from __future__ import annotations

import sys
from pathlib import Path


def main(path: str) -> int:
    # Lightweight, import-time friendly onboarding utility.
    repo_root = Path(__file__).resolve().parents[2]
    sys.path.insert(0, str(repo_root))

    from backend.app.models.api import IngestionRequest, IngestionSource
    from backend.app.services.ingestion import get_ingestion_service

    settings = None
    # Initialize service (will use internal config/setup)
    service = get_ingestion_service()

    src = IngestionSource(type="local", path=path)
    request = IngestionRequest(sources=[src])
    job_id = service.ingest(request, None)
    print(f"Ingestion job enqueued: {job_id}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: ingest_local_folder.py /path/to/data")
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
