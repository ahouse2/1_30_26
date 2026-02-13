from __future__ import annotations

import threading
import time
from typing import Optional

from ..config import get_settings
from .graph import GraphService


class GraphRefinementWorker:
    def __init__(
        self,
        graph_service: GraphService,
        *,
        interval_seconds: float,
        idle_limit: int,
        min_new_edges: int,
    ) -> None:
        self.graph_service = graph_service
        self.interval_seconds = interval_seconds
        self.idle_limit = idle_limit
        self.min_new_edges = min_new_edges
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._idle_runs = 0

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self, timeout: float | None = None) -> None:
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=timeout)

    def _run(self) -> None:
        while not self._stop_event.is_set():
            stats = self.graph_service.refine_schema()
            if stats.get("new_edges", 0) <= self.min_new_edges:
                self._idle_runs += 1
            else:
                self._idle_runs = 0
            if self._idle_runs >= self.idle_limit:
                break
            self._stop_event.wait(self.interval_seconds)

    def status(self) -> dict:
        return {
            "running": bool(self._thread and self._thread.is_alive()),
            "idle_runs": self._idle_runs,
            "interval_seconds": self.interval_seconds,
            "idle_limit": self.idle_limit,
            "min_new_edges": self.min_new_edges,
            "stop_requested": self._stop_event.is_set(),
        }


_GRAPH_WORKER: GraphRefinementWorker | None = None
_GRAPH_LOCK = threading.Lock()


def get_graph_refinement_worker() -> GraphRefinementWorker:
    global _GRAPH_WORKER
    with _GRAPH_LOCK:
        if _GRAPH_WORKER is None:
            settings = get_settings()
            worker = GraphRefinementWorker(
                GraphService(),
                interval_seconds=settings.graph_refinement_interval_seconds,
                idle_limit=settings.graph_refinement_idle_limit,
                min_new_edges=settings.graph_refinement_min_new_edges,
            )
            if settings.graph_refinement_enabled:
                worker.start()
            _GRAPH_WORKER = worker
    return _GRAPH_WORKER


def shutdown_graph_refinement_worker(timeout: float | None = None) -> None:
    global _GRAPH_WORKER
    with _GRAPH_LOCK:
        if _GRAPH_WORKER is None:
            return
        _GRAPH_WORKER.stop(timeout=timeout)
        _GRAPH_WORKER = None


def restart_graph_refinement_worker() -> GraphRefinementWorker:
    shutdown_graph_refinement_worker(timeout=5.0)
    return get_graph_refinement_worker()
