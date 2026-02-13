#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
compose_file="${repo_root}/docker-compose.yml"

DEV_CONFIG=$(docker compose -f "$compose_file" --profile dev config)
PROD_CONFIG=$(docker compose -f "$compose_file" --profile prod config)

# Dev should include frontend and exclude frontend-prod
if ! echo "$DEV_CONFIG" | grep -q "frontend:"; then
  echo "dev config missing frontend"; exit 1; fi
if echo "$DEV_CONFIG" | grep -q "frontend-prod:"; then
  echo "dev config unexpectedly includes frontend-prod"; exit 1; fi

# Prod should include frontend-prod and exclude frontend
if ! echo "$PROD_CONFIG" | grep -q "frontend-prod:"; then
  echo "prod config missing frontend-prod"; exit 1; fi
if echo "$PROD_CONFIG" | grep -q "frontend:"; then
  echo "prod config unexpectedly includes frontend"; exit 1; fi

# Prod should include full-featured services
for svc in stt tts otel-collector grafana storage-backup; do
  if ! echo "$PROD_CONFIG" | grep -q "$svc:"; then
    echo "prod config missing $svc"; exit 1; fi
  done

echo "compose profiles check passed"
