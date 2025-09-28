"use client";

import { useState, useEffect, useCallback } from 'react';

interface SoundOptions {
  volume?: number;
  isMuted?: boolean;
  enabled?: boolean;
}

export function useSound(
  soundUrl: string,
  { volume = 1, isMuted = false, enabled = true }: SoundOptions = {}
): [() => void] {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if(enabled) {
        const newAudio = new Audio(soundUrl);
        newAudio.load();
        setAudio(newAudio);

        return () => {
            newAudio.pause();
        };
    }
  }, [soundUrl, enabled]);

  useEffect(() => {
    if (audio) {
      audio.volume = volume;
    }
  }, [volume, audio]);
  
  useEffect(() => {
    if (audio) {
      audio.muted = isMuted;
    }
  }, [isMuted, audio]);


  const play = useCallback(() => {
    if (audio && !isMuted) {
      audio.currentTime = 0;
      audio.play().catch(error => {
        // Autoplay was prevented.
        console.warn("Sound autoplay was prevented for:", soundUrl);
      });
    }
  }, [audio, soundUrl, isMuted]);

  return [play];
}

    