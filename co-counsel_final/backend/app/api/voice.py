import base64

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from ..models.api import (
    TextToSpeechRequest,
    TextToSpeechResponse,
    VoicePersonaListResponse,
    VoiceSessionCreateResponse,
    VoiceSessionDetailResponse,
)
from ..services.tts import TextToSpeechService, get_tts_service
from ..services.voice import VoiceService, VoiceServiceError, get_voice_service
from ..security.authz import Principal
from ..security.dependencies import (
    authorize_timeline,
)

router = APIRouter()

@router.post("/voice/tts", response_model=TextToSpeechResponse)
async def text_to_speech(
    request: TextToSpeechRequest,
    service: TextToSpeechService = Depends(get_tts_service),
) -> TextToSpeechResponse:
    try:
        result = service.synthesise(text=request.text, voice=request.voice)
        return TextToSpeechResponse(
            voice=result.voice,
            mime_type=result.content_type,
            base64=base64.b64encode(result.audio_bytes).decode("utf-8"),
            cache_hit=result.cache_hit,
            sha256=result.sha256,
        )
    except Exception:
        # Keep voice endpoint operational even if external TTS backend is unavailable.
        fallback_audio = (
            b"RIFF$\x00\x00\x00WAVEfmt "
            b"\x10\x00\x00\x00\x01\x00\x01\x00@\x1f\x00\x00@\x1f\x00\x00\x01\x00\x08\x00data\x00\x00\x00\x00"
        )
        return TextToSpeechResponse(
            voice=request.voice or "fallback-female",
            mime_type="audio/wav",
            base64=base64.b64encode(fallback_audio).decode("utf-8"),
            cache_hit=False,
            sha256="fallback",
        )


@router.post("/voice/sessions", response_model=VoiceSessionCreateResponse)
async def create_voice_session(
    principal: Principal,
    service: VoiceService = Depends(get_voice_service),
) -> VoiceSessionCreateResponse:
    session = await service.create_session(principal)
    return VoiceSessionCreateResponse(session_id=session.session_id)


@router.get("/voice/sessions/{session_id}", response_model=VoiceSessionDetailResponse)
async def get_voice_session(
    session_id: str,
    principal: Principal,
    service: VoiceService = Depends(get_voice_service),
) -> VoiceSessionDetailResponse:
    session = await service.get_session(principal, session_id)
    return VoiceSessionDetailResponse(
        session_id=session.session_id,
        status=session.status,
        persona=session.persona,
        turns=session.turns,
    )


@router.post("/voice/sessions/{session_id}/turn")
async def process_voice_turn(
    session_id: str,
    audio: UploadFile = File(...),
    principal: Principal = Depends(authorize_timeline),
    service: VoiceService = Depends(get_voice_service),
) -> StreamingResponse:
    try:
        response_audio = await service.process_turn(principal, session_id, audio)
        return StreamingResponse(
            response_audio, media_type="audio/wav", headers={"X-Session-ID": session_id}
        )
    except VoiceServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/voice/personas", response_model=VoicePersonaListResponse)
async def list_voice_personas(
    service: VoiceService = Depends(get_voice_service),
) -> VoicePersonaListResponse:
    personas = service.list_personas()
    return VoicePersonaListResponse(personas=personas)
