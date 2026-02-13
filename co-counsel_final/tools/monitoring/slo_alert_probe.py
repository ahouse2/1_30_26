#!/usr/bin/env python3
"""Simple SLO alert probe for Co-Counsel telemetry."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Dict

import requests


METRIC_RE = re.compile(r"^([a-zA-Z_:][a-zA-Z0-9_:]*)\{([^}]*)\}\s+([0-9eE+\-.]+)$")
PLAIN_METRIC_RE = re.compile(r"^([a-zA-Z_:][a-zA-Z0-9_:]*)\s+([0-9eE+\-.]+)$")


def parse_metrics(text: str) -> Dict[str, float]:
    metrics: Dict[str, float] = {}
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        match = METRIC_RE.match(line)
        if match:
            key = f"{match.group(1)}{{{match.group(2)}}}"
            metrics[key] = float(match.group(3))
            continue
        plain = PLAIN_METRIC_RE.match(line)
        if plain:
            metrics[plain.group(1)] = float(plain.group(2))
    return metrics


def main() -> int:
    parser = argparse.ArgumentParser(description="Check telemetry thresholds for basic alerting.")
    parser.add_argument("--metrics-url", default="http://localhost:9464/metrics", help="Prometheus metrics endpoint")
    parser.add_argument("--metrics-file", default="", help="Path to saved metrics file (overrides --metrics-url)")
    parser.add_argument("--max-forensics-fallbacks", type=float, default=5.0)
    parser.add_argument("--max-retrieval-p95-ms", type=float, default=1800.0)
    args = parser.parse_args()

    if args.metrics_file:
        text = Path(args.metrics_file).read_text(encoding="utf-8")
    else:
        response = requests.get(args.metrics_url, timeout=10)
        response.raise_for_status()
        text = response.text

    metrics = parse_metrics(text)
    failures: list[str] = []

    fallback_metric = "cocounsel_forensics_pipeline_fallbacks_total"
    fallback_value = metrics.get(fallback_metric, 0.0)
    if fallback_value > args.max_forensics_fallbacks:
        failures.append(
            f"{fallback_metric}={fallback_value:.3f} exceeds threshold {args.max_forensics_fallbacks:.3f}"
        )

    p95_metric = (
        "cocounsel_retrieval_query_duration_ms{otel_scope_name=backend.app.services.retrieval,"
        "quantile=0.95}"
    )
    p95_value = metrics.get(p95_metric, None)
    if p95_value is None:
        failures.append(f"Missing required quantile metric: {p95_metric}")
    elif p95_value > args.max_retrieval_p95_ms:
        failures.append(
            f"{p95_metric}={p95_value:.3f} exceeds threshold {args.max_retrieval_p95_ms:.3f}"
        )

    if failures:
        print("ALERT CHECK FAILED")
        for failure in failures:
            print(f"- {failure}")
        return 2

    print("ALERT CHECK OK")
    print(f"- {fallback_metric}={fallback_value:.3f}")
    print(f"- {p95_metric}={p95_value:.3f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
