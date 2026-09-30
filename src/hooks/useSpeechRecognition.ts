"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface SpeechRecognitionEventItem {
  isFinal: boolean;
  [index: number]: {
    transcript: string;
    confidence?: number;
  };
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionEventItem;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognitionInstance;
    };
    webkitSpeechRecognition?: {
      new (): SpeechRecognitionInstance;
    };
  }
}

export interface UseSpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export interface UseSpeechRecognitionReturn {
  transcript: string;
  interimResult: string;
  isListening: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

function mapSpeechError(error: string): string {
  switch (error) {
    case "no-speech":
      return "No speech detected. Please speak into the microphone.";
    case "audio-capture":
      return "Microphone capture failed. Please check your microphone.";
    case "not-allowed":
      return "Microphone permission denied. Please allow microphone access.";
    case "network":
      return "Network error occurred during speech recognition.";
    case "aborted":
      return "Speech recognition was aborted.";
    case "language-not-supported":
      return "The requested language is not supported.";
    case "service-not-allowed":
      return "Speech recognition service is not permitted.";
    default:
      return `Speech recognition error: ${error}`;
  }
}

export function useSpeechRecognition({
  language = "en-US",
  continuous = true,
  interimResults = true,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState("");
  const [interimResult, setInterimResult] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isListeningRef = useRef(false);
  const continuousRef = useRef(continuous);

  useEffect(() => {
    continuousRef.current = continuous;
  }, [continuous]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimResult("");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // no-op
      }
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimResult("");
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;

    setError(null);

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // no-op
      }
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalAccumulator = "";
        let interimAccumulator = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0]?.transcript || "";
          if (item.isFinal) {
            finalAccumulator += text;
          } else {
            interimAccumulator += text;
          }
        }

        if (finalAccumulator) {
          setTranscript((prev) => {
            const trimmed = finalAccumulator.trim();
            if (!prev) return trimmed;
            return `${prev} ${trimmed}`;
          });
          setInterimResult("");
        } else {
          setInterimResult(interimAccumulator);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "aborted") return;
        setError(mapSpeechError(event.error));
        if (
          event.error === "not-allowed" ||
          event.error === "audio-capture" ||
          event.error === "service-not-allowed"
        ) {
          isListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current && continuousRef.current) {
          try {
            recognition.start();
          } catch {
            isListeningRef.current = false;
            setIsListening(false);
          }
        } else {
          isListeningRef.current = false;
          setIsListening(false);
          setInterimResult("");
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      isListeningRef.current = true;
      setIsListening(true);
    } catch {
      setError("Failed to start speech recognition.");
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, [language, continuous, interimResults]);

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // no-op
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    transcript,
    interimResult,
    isListening,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
