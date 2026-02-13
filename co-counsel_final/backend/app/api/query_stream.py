from __future__ import annotations

import json
from typing import Any, Dict

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from ..services.retrieval import RetrievalMode, RetrievalService, get_retrieval_service

router = APIRouter()


@router.websocket("/query/stream")
async def query_stream(
    websocket: WebSocket,
    service: RetrievalService = Depends(get_retrieval_service),
) -> None:
    await websocket.accept()
    try:
        payload: Dict[str, Any] = await websocket.receive_json()
        query = payload.get("q") or payload.get("query")
        if not isinstance(query, str) or not query.strip():
            await websocket.send_json({"type": "error", "detail": "Missing query"})
            await websocket.close(code=1000)
            return
        mode_value = payload.get("mode") or RetrievalMode.PRECISION.value
        try:
            mode = RetrievalMode(mode_value)
        except ValueError:
            mode = RetrievalMode.PRECISION

        result = service.query(query.strip(), mode=mode)
        attributes = {
            "mode": mode.value,
            "stream": True,
        }
        for raw_event in service.stream_result(result, attributes=attributes):
            try:
                event = json.loads(raw_event)
            except json.JSONDecodeError:
                continue
            event_type = event.get("type")
            if event_type == "answer":
                token = event.get("delta")
                if token:
                    await websocket.send_json({"type": "token", "token": token})
            elif event_type == "final":
                await websocket.send_json(
                    {
                        "type": "done",
                        "answer": event.get("answer"),
                        "citations": event.get("citations"),
                        "meta": event.get("meta"),
                    }
                )
        await websocket.close(code=1000)
    except WebSocketDisconnect:
        return
    except Exception as exc:
        try:
            await websocket.send_json({"type": "error", "detail": str(exc)})
        finally:
            await websocket.close(code=1011)
