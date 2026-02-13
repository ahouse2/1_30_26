import os

from .services.agents import get_agents_service
from .services.ingestion import (
    get_ingestion_worker,
    shutdown_ingestion_worker,
)
from .services.graph_refinement import (
    get_graph_refinement_worker,
    shutdown_graph_refinement_worker,
)

def register_events(app):
    @app.on_event("startup")
    def start_background_workers() -> None:
        get_ingestion_worker()
        if os.getenv("START_GRAPH_REFINEMENT_ON_STARTUP", "false").lower() in {"1", "true", "yes"}:
            get_graph_refinement_worker()
        if os.getenv("PREWARM_AGENTS_ON_STARTUP", "false").lower() in {"1", "true", "yes"}:
            get_agents_service()


    @app.on_event("shutdown")
    def stop_background_workers() -> None:
        shutdown_ingestion_worker(timeout=5.0)
        shutdown_graph_refinement_worker(timeout=5.0)
