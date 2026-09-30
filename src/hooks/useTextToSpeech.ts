"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface UseTextToSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voicePreference?: string;
}

export interface UseTextToSpeechReturn {
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
}

export function useTextToSpeech({
  rate = 1,
  pitch = 1,
  volume = 1,
  voicePreference,
}: UseTextToSpeechOptions = {}): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const queueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);
  const isPausedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const populateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;

    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const selectVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (voices.length === 0) return null;

    if (voicePreference) {
      const preferred = voices.find(
        (v) =>
          v.name.toLowerCase().includes(voicePreference.toLowerCase()) ||
          v.lang.toLowerCase().includes(voicePreference.toLowerCase())
      );
      if (preferred) return preferred;
    }

    const englishVoices = voices.filter((v) =>
      v.lang.toLowerCase().startsWith("en")
    );
    const pool = englishVoices.length > 0 ? englishVoices : voices;

    const naturalVoice = pool.find((v) => {
      const name = v.name.toLowerCase();
      return (
        name.includes("natural") ||
        name.includes("enhanced") ||
        name.includes("google")
      );
    });

    if (naturalVoice) return naturalVoice;

    const defaultVoice = pool.find((v) => v.default) || pool[0];
    return defaultVoice || null;
  }, [voices, voicePreference]);

  const processQueue = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      return;
    }

    if (queueRef.current.length === 0) {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      return;
    }

    const nextText = queueRef.current.shift();
    if (!nextText) {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      return;
    }

    const utterance = new SpeechSynthesisUtterance(nextText);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    const voice = selectVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
      setIsPaused(false);
      isPausedRef.current = false;
    };

    utterance.onend = () => {
      processQueue();
    };

    utterance.onerror = (e) => {
      if (e.error !== "canceled" && e.error !== "interrupted") {
        console.error("SpeechSynthesis error:", e.error);
      }
      processQueue();
    };

    window.speechSynthesis.speak(utterance);
  }, [rate, pitch, volume, selectVoice]);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      if (!text || !text.trim()) return;

      queueRef.current.push(text);

      if (!isSpeakingRef.current && !window.speechSynthesis.speaking) {
        processQueue();
      }
    },
    [processQueue]
  );

  const pause = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      isPausedRef.current = true;
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      isPausedRef.current = false;
    }
  }, []);

  const cancel = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    queueRef.current = [];
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    setIsPaused(false);
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        queueRef.current = [];
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speak,
    pause,
    resume,
    cancel,
    isSpeaking,
    isPaused,
  };
}
