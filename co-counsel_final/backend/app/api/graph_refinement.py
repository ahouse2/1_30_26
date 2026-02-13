from fastapi import APIRouter

from ..config import get_settings
from ..services.graph_refinement import get_graph_refinement_worker, restart_graph_refinement_worker

router = APIRouter()

@router.get("/graph/refinement/status")
def refinement_status() -> dict:
    settings = get_settings()
    worker = get_graph_refinement_worker()
    payload = worker.status()
    payload["enabled"] = settings.graph_refinement_enabled
    return payload


@router.post("/graph/refinement/restart")
def restart_refinement_worker() -> dict:
    worker = restart_graph_refinement_worker()
    return {
        "status": "restarted",
        **worker.status(),
    }
