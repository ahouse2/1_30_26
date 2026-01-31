Docker Compose Orchestration for Co-Counsel

- docker-compose.yml defines two services: api (backend) and frontend.
- The api exposes port 8000; the frontend exposes port 5173.
- Health checks ensure both containers become healthy; frontend depends_on api_healthy.
- Use scripts/wait-for-docker-compose.sh to build, start, and wait for readiness.
