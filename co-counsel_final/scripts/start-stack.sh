#!/usr/bin/env bash
set -euo pipefail

SHOW_USAGE() {
  cat << 'USAGE'
Usage: ./scripts/start-stack.sh [--seed] [--no-seed] [--e2e]
  --seed      Seed the Neo4j database with initial data (default: enabled)
  --no-seed   Do not seed the database
  --e2e       Run frontend UI end-to-end tests after startup (if possible)
  --data-dir  Path to a local data directory to ingest into the system after startup
USAGE
}

SEED=true
RUN_E2E=false
DATA_DIR=""

while [ $# -gt 0 ]; do
  case "$1" in
    --seed) SEED=true; shift ;;
    --no-seed) SEED=false; shift ;;
    --e2e) RUN_E2E=true; shift ;;
    --data-dir) DATA_DIR="$2"; shift 2 ;;
    --help) SHOW_USAGE; exit 0 ;;
    *) echo "Unknown option: $1"; SHOW_USAGE; exit 1 ;;
  esac
done

echo "Starting stack with docker-compose..."
docker-compose pull
docker-compose up -d --build

echo "Waiting for services to become healthy..."
./scripts/wait-for-docker-compose.sh 600

if [ -n "$DATA_DIR" ]; then
  echo "Ingesting user data from '$DATA_DIR'..."
  if [ -d "$DATA_DIR" ]; then
    python3 backend/scripts/ingest_local_folder.py "$DATA_DIR" || true
  else
    echo "Data directory '$DATA_DIR' does not exist or is not a directory; skipping ingestion."
  fi
fi

if [ "$SEED" = true ]; then
  echo "Seeding Neo4j with initial data..."
  if [ -f docker/seeds/neo4j_seed.cql ]; then
    # Determine the Neo4j password to use for cypher-shell
    PASSWORD="neo4j"
    if docker inspect cocounsel_neo4j >/dev/null 2>&1; then
      PASS_ENV=$(docker exec cocounsel_neo4j printenv NEO4J_PASSWORD 2>/dev/null || true)
      if [ -n "$PASS_ENV" ]; then
        PASSWORD="$PASS_ENV"
      fi
      docker cp docker/seeds/neo4j_seed.cql cocounsel_neo4j:/tmp/neo4j_seed.cql
      docker exec cocounsel_neo4j cypher-shell -u neo4j -p "$PASSWORD" < /tmp/neo4j_seed.cql
      echo "Neo4j seed applied."
    else
      echo "Neo4j container not found; skipping seed."
    fi
  else
    echo "No seed file found at docker/seeds/neo4j_seed.cql; skipping seed."
  fi
fi

if [ "$RUN_E2E" = true ]; then
  echo "Running frontend E2E tests (if dependencies are installed in host)."
  if command -v node >/dev/null 2>&1 && [ -d frontend ]; then
    # Install deps if needed
    if [ ! -d frontend/node_modules ]; then
      (cd frontend && npm ci --silent)
    fi
    (cd frontend && npm run test:e2e --silent) || true
  else
    echo "Node/Playwright not available; skipping E2E."
  fi
fi

echo "Stack startup complete."
