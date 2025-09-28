"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface SoundOptions {
  volume?: number;
  isMuted?: boolean;
}

export function useSound(
  soundUrl: string,
  { volume = 1, isMuted = false }: SoundOptions = {}
): [() => void, (enabled: boolean) => void] {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (isEnabled && !audioRef.current) {
      const newAudio = new Audio(soundUrl);
      newAudio.load();
      audioRef.current = newAudio;
    }
  }, [soundUrl, isEnabled]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const play = useCallback(() => {
    if (audioRef.current && isEnabled && !isMuted) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.warn("Sound autoplay was prevented for:", soundUrl, error);
      });
    }
  }, [soundUrl, isMuted, isEnabled]);
  
  const setEnabled = (enabled: boolean) => {
    setIsEnabled(enabled);
  }

  return [play, setEnabled];
}
