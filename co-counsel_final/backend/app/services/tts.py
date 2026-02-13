from __future__ import annotations

import hashlib
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
from uuid import uuid4

import httpx

from ..config import get_settings
from .voice.adapters import CoquiSynthesizer


class LocalTextToSpeechService:
    """Local Coqui-based TTS fallback for more natural voices."""

    def __init__(self, *, cache_dir: Path, settings):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.settings = settings
        self._synthesizer = CoquiSynthesizer(
            model_id=settings.voice_tts_model,
            cache_dir=settings.voice_cache_dir,
            device_preference=settings.voice_device_preference,
            default_sample_rate=settings.voice_sample_rate,
        )

    def _resolve_speaker(self, voice: Optional[str]) -> Optional[str]:
        if not voice:
            voice = self.settings.tts_default_voice
        if not voice:
            return None
        personas = self.settings.voice_personas or {}
        if voice in personas:
            return personas[voice].get("speaker_id")
        for payload in personas.values():
            if payload.get("label", "").lower() == str(voice).lower():
                return payload.get("speaker_id")
        return voice

    def synthesise(self, *, text: str, voice: Optional[str] = None) -> TextToSpeechResult:
        if not text.strip():
            raise WorkflowAbort(
                WorkflowError(
                    component=WorkflowComponent.TTS,
                    code="TTS_EMPTY_INPUT",
                    message="Cannot synthesise empty text",
                )
            )
        resolved_voice = self._resolve_speaker(voice)
        cache_key = hashlib.sha256(f"local:{resolved_voice}:{text}".encode("utf-8")).hexdigest()
        cache_path = self.cache_dir / f"{cache_key}.wav"
        if cache_path.exists():
            audio = cache_path.read_bytes()
            return TextToSpeechResult(
                voice=resolved_voice or "default",
                content_type="audio/wav",
                audio_bytes=audio,
                sha256=cache_key,
                cache_hit=True,
            )
        audio_bytes = self._synthesizer.synthesize(
            text=text,
            speaker_id=resolved_voice,
            speed=1.0,
            sample_rate=self.settings.voice_sample_rate,
        )
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = cache_path.with_name(f".{cache_path.name}.{uuid4().hex}.tmp")
        temp_path.write_bytes(audio_bytes)
        temp_path.replace(cache_path)
        return TextToSpeechResult(
            voice=resolved_voice or "default",
            content_type="audio/wav",
            audio_bytes=audio_bytes,
            sha256=cache_key,
            cache_hit=False,
        )
from .errors import WorkflowAbort, WorkflowComponent, WorkflowError, WorkflowSeverity


@dataclass(slots=True)
class TextToSpeechResult:
    voice: str
    content_type: str
    audio_bytes: bytes
    sha256: str
    cache_hit: bool = False


class TextToSpeechService:
    """Client wrapper around the Larynx text-to-speech HTTP API."""

    def __init__(self, base_url: str, cache_dir: Path, *, timeout: float = 15.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.timeout = timeout
        self._client = httpx.Client(base_url=self.base_url, timeout=timeout)

    def synthesise(self, *, text: str, voice: Optional[str] = None) -> TextToSpeechResult:
        settings = get_settings()
        if not text.strip():
            raise WorkflowAbort(
                WorkflowError(
                    component=WorkflowComponent.TTS,
                    code="TTS_EMPTY_INPUT",
                    message="Cannot synthesise empty text",
                )
            )
        resolved_voice = voice or settings.tts_default_voice or "en-us/mary_ann-glow_tts"
        voice_name = self._normalise_voice(resolved_voice)
        cache_key = hashlib.sha256(f"{voice_name}:{text}".encode("utf-8")).hexdigest()
        cache_path = self.cache_dir / f"{cache_key}.wav"
        if cache_path.exists():
            audio = cache_path.read_bytes()
            return TextToSpeechResult(
                voice=voice_name,
                content_type="audio/wav",
                audio_bytes=audio,
                sha256=cache_key,
                cache_hit=True,
            )
        headers = {"accept": "audio/wav"}
        try:
            # Larynx HTTP API expects query params for text/voice and returns wav bytes.
            response = self._client.get(
                "/api/tts",
                params={"text": text, "voice": voice_name},
                headers=headers,
            )
        except httpx.HTTPError as exc:  # pragma: no cover - network failures are rare in tests
            raise WorkflowAbort(
                WorkflowError(
                    component=WorkflowComponent.TTS,
                    code="TTS_TRANSPORT_ERROR",
                    message=str(exc),
                    severity=WorkflowSeverity.ERROR,
                    retryable=True,
                )
            ) from exc
        if response.status_code >= 400:
            raise WorkflowAbort(
                WorkflowError(
                    component=WorkflowComponent.TTS,
                    code="TTS_HTTP_ERROR",
                    message=f"TTS service responded with {response.status_code}",
                    severity=WorkflowSeverity.ERROR,
                ),
                status_code=response.status_code,
            )
        content_type = response.headers.get("content-type", "audio/wav")
        audio_bytes = response.read()
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = cache_path.with_name(f".{cache_path.name}.{uuid4().hex}.tmp")
        temp_path.write_bytes(audio_bytes)
        temp_path.replace(cache_path)
        return TextToSpeechResult(
            voice=voice_name,
            content_type=content_type,
            audio_bytes=audio_bytes,
            sha256=cache_key,
            cache_hit=False,
        )

    def _normalise_voice(self, voice: Optional[str]) -> str:
        if not voice:
            return "en-us/mary_ann-glow_tts"
        if ":" in voice:
            _, voice_name = voice.split(":", 1)
            voice = voice_name
        # Larynx expects voices like "en-us/mary_ann-glow_tts".
        if "/" not in voice:
            return "en-us/mary_ann-glow_tts"
        return voice


_tts_service: TextToSpeechService | None = None


def get_tts_service(*, optional: bool = False) -> TextToSpeechService | None:
    global _tts_service
    settings = get_settings()
    enabled = getattr(settings, "tts_enabled", True)
    base_url = getattr(settings, "tts_service_url", None)
    backend = str(getattr(settings, "tts_backend", "auto") or "auto").lower()
    if not enabled:
        if optional:
            return None
        raise RuntimeError("TTS service is disabled")

    if _tts_service is None:
        cache_dir = getattr(settings, "tts_cache_dir", Path("storage/audio_cache"))
        if backend in {"local", "coqui"} or not base_url or (backend == "auto" and not base_url):
            _tts_service = LocalTextToSpeechService(cache_dir=Path(cache_dir), settings=settings)
        elif backend in {"remote", "larynx", "http"} or backend == "auto":
            if not base_url:
                if optional:
                    return None
                raise RuntimeError("TTS service is not configured")
            timeout = float(getattr(settings, "tts_timeout_seconds", 15.0))
            _tts_service = TextToSpeechService(str(base_url), Path(cache_dir), timeout=timeout)
        else:
            if optional:
                return None
            raise RuntimeError(f"Unsupported TTS backend: {backend}")
    return _tts_service


__all__ = ["TextToSpeechResult", "TextToSpeechService", "get_tts_service"]
