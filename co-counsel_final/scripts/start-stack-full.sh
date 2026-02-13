#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_usage() {
  cat << 'USAGE'
Usage: ./scripts/start-stack-full.sh [--mode dev|prod] [--seed] [--no-seed] [--data-dir <path>] [--e2e] [--voice]
  --mode           Compose profile to start (dev or prod; default: prod)
  --seed           Seed the Neo4j graph with initial data (default: enabled)
  --no-seed        Do not seed the database
  --data-dir       Path to local data directory to ingest after startup
  --e2e            Run frontend UI end-to-end tests after startup (if possible)
  --voice          Enable optional voice services (stt/tts)
USAGE
}

MODE="prod"
SEED=true
NOSEED=false
RUN_E2E=false
DATA_DIR=""
VOICE=false

# Ensure we only use the intended compose file and profiles.
unset COMPOSE_FILE
unset COMPOSE_PROFILES

# Force known-good voice images/voices unless explicitly overridden.
export STT_IMAGE="${STT_IMAGE:-linuxserver/faster-whisper:latest}"
export TTS_IMAGE="${TTS_IMAGE:-rhasspy/larynx:latest}"
export TTS_VOICE="${TTS_VOICE:-en-us-amy-low}"

# Auto-heal deprecated image tags that now fail to resolve.
if [[ "${STT_IMAGE}" == ghcr.io/guillaumekln/faster-whisper-server* ]]; then
  echo "Detected deprecated STT image '${STT_IMAGE}', switching to linuxserver/faster-whisper:latest."
  export STT_IMAGE="linuxserver/faster-whisper:latest"
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    --seed) SEED=true; shift ;;
    --no-seed) SEED=false; shift ;;
    --data-dir) DATA_DIR="$2"; shift 2 ;;
    --e2e) RUN_E2E=true; shift ;;
    --voice) VOICE=true; shift ;;
    --help) print_usage; exit 0 ;;
    *) echo "Unknown option: $1"; print_usage; exit 1 ;;
  esac
done

ENV_FILE="infra/profiles/${MODE}.env"
if [ ! -f "${ENV_FILE}" ]; then
  echo "Profile env file not found: ${ENV_FILE}" >&2
  exit 1
fi

COMPOSE_FILE_PATH="${SCRIPT_DIR}/../docker-compose.yml"
if [ ! -f "${COMPOSE_FILE_PATH}" ]; then
  echo "Compose file not found: ${COMPOSE_FILE_PATH}" >&2
  exit 1
fi

PROFILE_FLAGS=(--profile "${MODE}")
if [ "$VOICE" = true ]; then
  PROFILE_FLAGS+=(--profile voice)
fi

VOICE_SUFFIX=""
if [ "$VOICE" = true ]; then
  VOICE_SUFFIX=", voice"
fi

# macOS can generate AppleDouble files (._*) that break Docker context reads.
cleanup_appledouble() {
  if command -v rg >/dev/null 2>&1; then
    (rg --files -g '._*' . || true) | while IFS= read -r path; do
      [ -n "$path" ] && rm -f "$path"
    done
  else
    find . -name '._*' -type f -delete
  fi
}

cleanup_appledouble
echo "Starting stack via docker compose (profile: ${MODE}${VOICE_SUFFIX})..."
docker compose -f "${COMPOSE_FILE_PATH}" --env-file "${ENV_FILE}" "${PROFILE_FLAGS[@]}" up -d --build
echo "Waiting for services to become healthy..."
./scripts/wait-for-docker-compose.sh 600 --profile "${MODE}"

if [ "$SEED" = true ]; then
  echo "Applying Neo4j seed data..."
  if [ -f docker/seeds/neo4j_seed.cql ]; then
    if docker ps --format '{{.Names}}' | grep -qx 'cocounsel_neo4j'; then
      PASSWORD="${NEO4J_PASSWORD:-securepassword}"
      if docker exec cocounsel_neo4j printenv NEO4J_PASSWORD &>/dev/null; then
        PASSWORD=$(docker exec cocounsel_neo4j printenv NEO4J_PASSWORD)
      fi

      # Wait for Neo4j to accept queries to avoid startup race conditions.
      for i in {1..30}; do
        if docker exec cocounsel_neo4j cypher-shell -u neo4j -p "$PASSWORD" "RETURN 1;" >/dev/null 2>&1; then
          break
        fi
        sleep 2
      done

      if docker exec cocounsel_neo4j cypher-shell -u neo4j -p "$PASSWORD" "RETURN 1;" >/dev/null 2>&1; then
        docker cp docker/seeds/neo4j_seed.cql cocounsel_neo4j:/tmp/neo4j_seed.cql
        docker exec cocounsel_neo4j sh -lc "cypher-shell -u neo4j -p '$PASSWORD' < /tmp/neo4j_seed.cql"
        echo "Neo4j seed applied."
      else
        echo "Neo4j not query-ready after timeout; skipping seed."
      fi
    else
      echo "Neo4j container not running; skipping seed."
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
