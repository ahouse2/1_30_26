#!/usr/bin/env bash
set -euo pipefail

print_usage() {
  cat << 'USAGE'
Usage: ./scripts/wait-for-docker-compose.sh [timeout_seconds] [--profile dev|prod]
  timeout_seconds  Optional timeout in seconds (default: 120)
  --profile        Compose profile to check (dev or prod; default: dev)
USAGE
}

TIMEOUT=120
PROFILE="dev"

if [[ ${1:-} =~ ^[0-9]+$ ]]; then
  TIMEOUT="$1"
  shift
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile) PROFILE="$2"; shift 2 ;;
    --help) print_usage; exit 0 ;;
    *) echo "Unknown option: $1"; print_usage; exit 1 ;;
  esac
done

COMPOSE_ARGS=()
if [ -n "$PROFILE" ]; then
  COMPOSE_ARGS+=(--profile "$PROFILE")
fi

FRONT_CONTAINER="cocounsel_frontend"
if [ "$PROFILE" = "prod" ]; then
  FRONT_CONTAINER="cocounsel_frontend_prod"
fi

echo "Waiting for services to become healthy (profile: ${PROFILE}, timeout: ${TIMEOUT}s)..."
END=$((SECONDS+TIMEOUT))

check() {
  local api_health=$(docker inspect -f '{{.State.Health.Status}}' cocounsel_api 2>/dev/null || echo "unknown")
  local front_health=$(docker inspect -f '{{.State.Health.Status}}' "$FRONT_CONTAINER" 2>/dev/null || echo "unknown")
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
    docker compose "${COMPOSE_ARGS[@]}" ps
    exit 1
  fi
  echo -n "."; sleep 2
done
