#!/usr/bin/env bash
set -euo pipefail

echo "Starting services with docker-compose..."
docker-compose up -d --build

echo "Waiting for services to become healthy..."
TIMEOUT=${1:-120}
END=$((SECONDS+TIMEOUT))

check() {
  local api_health=$(docker inspect -f '{{.State.Health.Status}}' cocounsel_api 2>/dev/null || echo "unknown")
  local front_health=$(docker inspect -f '{{.State.Health.Status}}' cocounsel_frontend 2>/dev/null || echo "unknown")
  if [[ "$api_health" == "healthy" && "$front_health" == "healthy" ]]; then
    return 0
  fi
  # Optional: check Neo4j HTTP port for readiness if available
  if curl -sS http://localhost:7474/ >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

until check; do
  if (( SECONDS >= END )); then
    echo "Timed out waiting for services to become healthy."
    docker-compose ps
    exit 1
  fi
  echo -n "."; sleep 2
done
