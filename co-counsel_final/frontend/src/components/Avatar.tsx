import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

export interface AvatarHandle {
  speak: (text: string) => void;
}

export const Avatar = forwardRef<AvatarHandle>((_, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [speaking, setSpeaking] = useState(false);

  const speak = (text: string) => {
    const audio = audioRef.current;
    if (!audio || !text.trim()) {
      return;
    }
    setSpeaking(true);
    const key = import.meta.env.VITE_ELEVENLABS_API_KEY;
    const voice = import.meta.env.VITE_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
    if (!key) {
      setSpeaking(false);
      return;
    }
    fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': key,
        },
        body: JSON.stringify({
          text,
          voice_settings: {
            stability: 0.35,
            similarity_boost: 0.7,
          },
        }),
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Voice synthesis failed (${response.status})`);
        }
        return response.blob();
      })
      .then((audioBlob) => {
        const audioUrl = URL.createObjectURL(audioBlob);
        audio.src = audioUrl;
        return audio.play().then(() => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            setSpeaking(false);
          };
        });
      })
      .catch(() => {
        setSpeaking(false);
      });
  };

  useImperativeHandle(ref, () => ({ speak }));

  return (
    <div className="h-full w-full grid place-items-center bg-transparent">
      <div className={`voice-avatar-orb ${speaking ? 'is-speaking' : ''}`} />
      <audio ref={audioRef} hidden />
    </div>
  );
});

Avatar.displayName = 'Avatar';
