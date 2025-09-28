"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface SoundOptions {
  volume?: number;
  isMuted?: boolean;
  enabled?: boolean;
}

export function useSound(
  soundUrl: string,
  { volume = 1, isMuted = false, enabled = true }: SoundOptions = {}
): [() => void] {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (enabled && !audioRef.current) {
      const newAudio = new Audio(soundUrl);
      newAudio.load();
      audioRef.current = newAudio;
    }
  }, [soundUrl, enabled]);

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
    if (audioRef.current && enabled && !isMuted) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.warn("Sound autoplay was prevented for:", soundUrl, error);
      });
    }
  }, [soundUrl, isMuted, enabled]);

  return [play];
}
