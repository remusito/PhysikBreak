"use client";

import { useState, useEffect, useCallback } from 'react';

interface SoundOptions {
  volume?: number;
  isMuted?: boolean;
}

export function useSound(
  soundUrl: string,
  { volume = 1, isMuted = false }: SoundOptions = {}
): [() => void] {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const newAudio = new Audio(soundUrl);
    newAudio.load();
    setAudio(newAudio);

    return () => {
      newAudio.pause();
    };
  }, [soundUrl]);

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
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(error => {
        // Autoplay was prevented.
        console.warn("Sound autoplay was prevented for:", soundUrl);
      });
    }
  }, [audio, soundUrl]);

  return [play];
}
