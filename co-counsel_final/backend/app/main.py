from __future__ import annotations

import importlib
import logging

from fastapi import FastAPI, HTTPException, Request

from .config import get_settings
from .telemetry import setup_telemetry

settings = get_settings()
setup_telemetry(settings)
app = FastAPI(title=settings.app_name, version=settings.app_version)
logger = logging.getLogger(__name__)


@app.middleware("http")
async def mtls_middleware(request: Request, call_next):
    if request.url.scheme == "https" and "ssl_client_cert" not in request.scope:
        raise HTTPException(status_code=403, detail="Client certificate required")
    return await call_next(request)


def _include_optional_router(module_name: str, *, prefix: str | None = None, tags: list[str] | None = None) -> None:
    try:
        module = importlib.import_module(f".api.{module_name}", __package__)
    except Exception as exc:
        logger.warning("Router '%s' not loaded: %s", module_name, exc)
        return
    router = getattr(module, "router", None)
    if router is None:
        logger.warning("Router '%s' has no 'router' attribute", module_name)
        return
    kwargs = {}
    if prefix is not None:
        kwargs["prefix"] = prefix
    if tags is not None:
        kwargs["tags"] = tags
    app.include_router(router, **kwargs)


_include_optional_router("health")
_include_optional_router("parity")
_include_optional_router("voice")
_include_optional_router("courts")

try:
    from .events import register_events
except Exception as exc:
    logger.warning("Event hooks disabled during startup: %s", exc)
else:
    register_events(app)

from .database import Base, engine
from .models import (
    document,
    permission,
    recipient,
    role,
    role_permission,
    service_of_process,
    user,
    user_role,
)

Base.metadata.create_all(bind=engine)
