# Voice Assistant Runbook

## UI Route
- `/live-chat`

## Primary APIs
- `GET /voice/personas`
- `POST /voice/sessions`
- `GET /voice/sessions/{session_id}`
- `POST /voice/sessions/{session_id}/turn`
- `POST /voice/tts`
- `POST /tts/speak`

## Operator Steps
1. Confirm preferred voice persona is set in Settings.
2. Create voice session and send test turn.
3. Validate transcript + response audio are both produced.
4. If using remote TTS/STT profile, confirm service health first.

## Success Criteria
- Turn responses include text + playable audio output.
- Persona selection persists and is reflected in synthesis behavior.

## Common Issues
- No audio returned:
  - Verify `TTS_BACKEND` and service URL configuration.
- Slow response:
  - Check provider latency and reduce model size for urgent use.
