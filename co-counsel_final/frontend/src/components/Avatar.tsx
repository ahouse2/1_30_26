import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { buildApiUrl } from '@/config';

const VOICE_PROFILE_STORAGE_KEY = 'co-counsel.voice.profile';

export type AvatarHandle = {
  speak: (text: string) => Promise<void>;
};

export const Avatar = forwardRef<AvatarHandle>((_props, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [speaking, setSpeaking] = useState(false);

  const speak = async (text: string) => {
    const audio = audioRef.current;
    if (!audio || !text.trim()) return;
    let preferredVoice = 'aurora';
    try {
      preferredVoice = localStorage.getItem(VOICE_PROFILE_STORAGE_KEY) || preferredVoice;
    } catch (_error) {
      // localStorage may be unavailable in restricted browser modes.
    }

    const response = await fetch(buildApiUrl('/voice/tts'), {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice: preferredVoice,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS request failed (${response.status})`);
    }

    const payload = (await response.json()) as { base64?: string; mime_type?: string };
    if (!payload.base64) {
      throw new Error('No audio payload returned from TTS service');
    }

    const bytes = atob(payload.base64);
    const raw = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i += 1) {
      raw[i] = bytes.charCodeAt(i);
    }
    const audioBlob = new Blob([raw], {
      type: payload.mime_type || 'audio/wav',
    });
    const audioUrl = URL.createObjectURL(audioBlob);
    audio.src = audioUrl;
    setSpeaking(true);
    await audio.play();

    audio.onended = () => {
      setSpeaking(false);
      URL.revokeObjectURL(audioUrl);
    };
  };

  useImperativeHandle(ref, () => ({
    speak,
  }));

  return (
    <div className="h-full w-full bg-transparent flex items-center justify-center">
      <div className={`voice-avatar-orb ${speaking ? 'is-speaking' : ''}`} aria-label="Co-Counsel voice avatar" />
      <audio ref={audioRef} hidden />
    </div>
  );
});

Avatar.displayName = 'Avatar';
