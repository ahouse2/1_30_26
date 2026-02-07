#!/usr/bin/env bash
set -euo pipefail

print_usage() {
  cat << 'USAGE'
Usage: ./scripts/start-stack-full.sh [--mode dev|prod] [--seed] [--no-seed] [--data-dir <path>] [--e2e]
  --mode           Compose profile to start (dev or prod; default: prod)
  --seed           Seed the Neo4j graph with initial data (default: enabled)
  --no-seed        Do not seed the database
  --data-dir       Path to local data directory to ingest after startup
  --e2e            Run frontend UI end-to-end tests after startup (if possible)
USAGE
}

MODE="prod"
SEED=true
NOSEED=false
RUN_E2E=false
DATA_DIR="EXTERNAL_DRIVE SSD/POST TRIAL DIVORCE"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    --seed) SEED=true; shift ;;
    --no-seed) SEED=false; shift ;;
    --data-dir) DATA_DIR="$2"; shift 2 ;;
    --e2e) RUN_E2E=true; shift ;;
    --help) print_usage; exit 0 ;;
    *) echo "Unknown option: $1"; print_usage; exit 1 ;;
  esac
done

ENV_FILE="infra/profiles/${MODE}.env"
if [ ! -f "${ENV_FILE}" ]; then
  echo "Profile env file not found: ${ENV_FILE}" >&2
  exit 1
fi

echo "Starting stack via docker compose (profile: ${MODE})..."
docker compose --env-file "${ENV_FILE}" --profile "${MODE}" up -d --build
echo "Waiting for services to become healthy..."
./scripts/wait-for-docker-compose.sh 600 --profile "${MODE}"

if [ "$SEED" = true ]; then
  echo "Applying Neo4j seed data..."
  if [ -f docker/seeds/neo4j_seed.cql ]; then
    if docker ps | grep -q cocounsel_neo4j; then
      docker cp docker/seeds/neo4j_seed.cql cocounsel_neo4j:/tmp/neo4j_seed.cql
      PASSWORD="neo4j"
      if docker exec cocounsel_neo4j printenv NEO4J_PASSWORD &>/dev/null; then
        PASSWORD=$(docker exec cocounsel_neo4j printenv NEO4J_PASSWORD)
      fi
      docker exec cocounsel_neo4j cypher-shell -u neo4j -p "$PASSWORD" < /tmp/neo4j_seed.cql
      echo "Neo4j seed applied."
    else
      echo "Neo4j container not ready; skipping seed."
    fi
  else
    echo "No seed file found at docker/seeds/neo4j_seed.cql; skipping seed."
  fi
fi

if [ -n "$DATA_DIR" ]; then
  echo "Ingesting user data from $DATA_DIR..."
  if [ -d "$DATA_DIR" ]; then
    (cd backend && python3 scripts/ingest_local_folder.py "$DATA_DIR") || true
  else
    echo "Data directory not found: $DATA_DIR"
  fi
fi

if [ "$RUN_E2E" = true ]; then
  echo "Running frontend end-to-end tests..."
  if command -v npm >/dev/null 2>&1; then
    (cd frontend && npm ci --silent || true)
    (cd frontend && npm run test:e2e --silent || true)
  else
    echo "Node not installed; skipping E2E tests."
  fi
fi

echo "Startup complete."
