Phase 1 Plan: Stabilize and Production-Readiness (Docker Compose)

- Goals:
  - Ensure API, frontend, and Neo4j containers start reliably and stay healthy on local Docker Compose.
  - Introduce a production frontend path (frontend-prod) with proper static serving and API proxy.
  - Harden secrets management by removing hard-coded credentials from compose files and providing a local env-based mechanism.
  - Establish a ready-to-run runbook for developers and operators.

- Tasks:
  1. Secret management
     - Create .env.sample (already added) and ensure docker-compose uses env vars with defaults.
     - Remove hard-coded secrets from backend/frontend Dockerfiles.
  2. Docker Compose hardening
     - Add frontend-prod service with production build and reverse proxy to API.
     - Add Neo4j as a service with proper env wiring for credentials and persistence.
     - Improve wait-for-docker-compose.sh to include Neo4j readiness checks.
  3. Production frontend
     - Implement Dockerfile.prod (done) and nginx config (done).
     - Ensure /api path proxies to the API container and that SPA routing works.
  4. Local verification and docs
     - Validate via docker-compose up -d; docker-compose ps; curl checks; Playwright e2e tests.
     - Produce runbook covering local development, startup, and teardown.

- Acceptance criteria:
  - All services start with docker-compose up -d --build and report healthy.
  - Frontend-prod serves content on port 80 and proxies /api to the API container.
  - No secret values are stored in code or compose files; env-based configuration works.
  - Documentation runbook exists and is usable by engineers.
