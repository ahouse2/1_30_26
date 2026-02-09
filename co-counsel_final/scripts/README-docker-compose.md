Docker Compose Orchestration for Co-Counsel

- docker-compose.yml defines core services including api (backend) and frontend.
- The api exposes port 8000; the frontend exposes port 5173.
- Health checks ensure containers become healthy; frontend depends_on api_healthy.
- Use scripts/wait-for-docker-compose.sh to build, start, and wait for readiness.
- One-click prod launcher: ./scripts/run-prod.sh
- Wrapper: ./scripts/start-stack-full.sh --mode prod
- Supports the same flags as start-stack-full.sh (ex: --no-seed, --data-dir, --e2e, --voice)
- Voice profile:
- STT: linuxserver/faster-whisper (host port 9000 -> container 10300)
- TTS: rhasspy/larynx (default voice en-us-blizzard_lessac, female)
