"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { GoogleGenAI, Modality, type LiveServerMessage, type Session } from "@google/genai/web";
import { SessionMode } from "@/types/database";

export interface ConversationTurn {
  role: "gemini" | "user";
  text: string;
  timestamp: Date;
}

export interface UseGeminiLiveOptions {
  mode?: SessionMode;
  knowledgeGraphSummary?: string;
  initialPrompt?: string;
  avoidTopics?: string[];
  voiceName?: "Puck" | "Charon" | "Kore" | "Fenrir" | "Aoede";
  onUserSpeech?: (transcript: string) => void;
  onGeminiSpeech?: (text: string) => void;
  onTurnComplete?: (fullTurnUser: string, fullTurnGemini: string) => void;
  onError?: (err: string) => void;
}

function downsampleAndConvert(
  inputSamples: Float32Array,
  inputSampleRate: number,
  outputSampleRate = 16000
): Int16Array {
  if (inputSampleRate === outputSampleRate) {
    const pcm16 = new Int16Array(inputSamples.length);
    for (let i = 0; i < inputSamples.length; i++) {
      const s = Math.max(-1, Math.min(1, inputSamples[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return pcm16;
  }
  const ratio = inputSampleRate / outputSampleRate;
  const outputLength = Math.floor(inputSamples.length / ratio);
  const pcm16 = new Int16Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const index = Math.floor(i * ratio);
    const s = Math.max(-1, Math.min(1, inputSamples[index]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm16;
}

function int16ToBase64(pcm16: Int16Array): string {
  const bytes = new Uint8Array(pcm16.buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToInt16(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

export function useGeminiLiveConversation({
  mode = "surprise_me",
  knowledgeGraphSummary = "",
  initialPrompt = "",
  avoidTopics = [],
  voiceName = "Puck",
  onUserSpeech,
  onGeminiSpeech,
  onTurnComplete,
  onError,
}: UseGeminiLiveOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isGeminiSpeaking, setIsGeminiSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [geminiTranscript, setGeminiTranscript] = useState("");
  const [conversationTurns, setConversationTurns] = useState<ConversationTurn[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<Session | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const nextPlaybackTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const userTurnAccumulatorRef = useRef<string>("");
  const geminiTurnAccumulatorRef = useRef<string>("");

  const stopAudio = useCallback(() => {
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Source might have already ended
      }
    });
    activeSourcesRef.current = [];
    if (playbackContextRef.current) {
      nextPlaybackTimeRef.current = playbackContextRef.current.currentTime;
    }
    setIsGeminiSpeaking(false);
  }, []);

  const cleanupRecording = useCallback(() => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsListening(false);
  }, []);

  const stopSession = useCallback(() => {
    cleanupRecording();
    stopAudio();
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch {
        // Session already closed
      }
      sessionRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, [cleanupRecording, stopAudio]);

  const startSession = useCallback(async () => {
    if (sessionRef.current || isConnecting) return;
    setIsConnecting(true);
    setError(null);

    try {
      // 1. Get ephemeral token from backend
      const tokenRes = await fetch("/api/gemini/live-token", {
        method: "POST",
      });

      if (!tokenRes.ok) {
        const errorData = await tokenRes.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to initialize Gemini Live session token."
        );
      }

      const { token } = await tokenRes.json();
      if (!token) throw new Error("No token returned by token service.");

      // 2. Initialize playback AudioContext
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const playbackCtx = new AudioCtx();
      if (playbackCtx.state === "suspended") {
        await playbackCtx.resume();
      }
      playbackContextRef.current = playbackCtx;
      nextPlaybackTimeRef.current = playbackCtx.currentTime;

      // 3. Craft biographer system instruction based on life-story-interviewer skill
      const systemInstruction = `You are Memorandom, an empathetic, warm, and attentive oral history biographer interviewing an elder about their life story for their digital keepsake memoir.

CORE INTERVIEWING METHODOLOGY:
1. THEMATIC & ORGANIC PROGRESSION:
   - Follow the narrator's emotional sparks, vocal enthusiasm, and nostalgic associations rather than enforcing a rigid timeline.
   - Spontaneous diversions and tangents are treasures—explore them fully before gently bridging back.
2. SPOKEN PACING & BREVITY:
   - You are conversing via real-time spoken audio. Keep your turns concise (1-2 brief validating sentences, followed by exactly ONE focused question under 25 words).
   - NEVER ask compound or multi-part questions. Minimize cognitive fatigue.
3. VALIDATE FIRST & ANCHOR IN SENSES:
   - Always warmly acknowledge and reflect back the feeling or imagery shared before proposing the next question.
   - Probe for sensory anchors: sounds, smells, lighting, weather, textures, and specific micro-moments.
4. KNOWLEDGE GRAPH GROUNDING:
   - Naturally weave known people, places, and events into your conversation by name to maintain continuity.
5. CONVERSATIONAL GRACE & YIELDING:
   - Speak in an unhurried, gentle, respectful tone. If interrupted, yield immediately and resume without repeating lengthy intros.
${avoidTopics && avoidTopics.length > 0 ? `6. STRICT OFF-LIMITS SUBJECTS:\n   - Do NOT ask about, reference, or steer towards any of the following topics: ${avoidTopics.join(", ")}.\n` : ""}
INTERVIEW CONTEXT:
- Mode: ${mode.replace("_", " ")}
${knowledgeGraphSummary ? `- Known biographical context:\n${knowledgeGraphSummary}` : ""}
${initialPrompt ? `- Starting topic: "${initialPrompt}"` : ""}`;

      // 4. Connect to Gemini Live WebSockets
      const ai = new GoogleGenAI({
        apiKey: token,
        apiVersion: "v1alpha",
      });

      const session = await ai.live.connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName,
              },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
          },
          onmessage: (msg: LiveServerMessage) => {
            const serverContent = msg.serverContent;
            if (!serverContent) return;

            // Interruption handling
            if (serverContent.interrupted) {
              stopAudio();
            }

            // Real-time user transcription
            if (serverContent.inputTranscription?.text) {
              const text = serverContent.inputTranscription.text;
              userTurnAccumulatorRef.current += text;
              setUserTranscript(userTurnAccumulatorRef.current);
              onUserSpeech?.(userTurnAccumulatorRef.current);
            } else if ((serverContent as unknown as { interimInputTranscription?: { text?: string } })?.interimInputTranscription?.text) {
              const interim = (serverContent as unknown as { interimInputTranscription?: { text?: string } }).interimInputTranscription!.text!;
              setUserTranscript(userTurnAccumulatorRef.current ? `${userTurnAccumulatorRef.current} ${interim}` : interim);
            }

            // Real-time Gemini audio playback and transcription
            if (serverContent.modelTurn?.parts) {
              for (const part of serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  setIsGeminiSpeaking(true);
                  const pcm16 = base64ToInt16(part.inlineData.data);
                  const float32 = new Float32Array(pcm16.length);
                  for (let i = 0; i < pcm16.length; i++) {
                    float32[i] = pcm16[i] / (pcm16[i] < 0 ? 32768 : 32767);
                  }

                  const pCtx = playbackContextRef.current;
                  if (pCtx) {
                    const audioBuffer = pCtx.createBuffer(1, float32.length, 24000);
                    audioBuffer.copyToChannel(float32, 0);

                    const source = pCtx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(pCtx.destination);

                    const startTime = Math.max(pCtx.currentTime, nextPlaybackTimeRef.current);
                    source.start(startTime);
                    nextPlaybackTimeRef.current = startTime + audioBuffer.duration;

                    activeSourcesRef.current.push(source);
                    source.onended = () => {
                      const idx = activeSourcesRef.current.indexOf(source);
                      if (idx !== -1) activeSourcesRef.current.splice(idx, 1);
                      if (activeSourcesRef.current.length === 0) {
                        setIsGeminiSpeaking(false);
                      }
                    };
                  }
                }

                if (part.text) {
                  geminiTurnAccumulatorRef.current += part.text;
                  setGeminiTranscript(geminiTurnAccumulatorRef.current);
                  onGeminiSpeech?.(geminiTurnAccumulatorRef.current);
                }
              }
            }

            if (serverContent.outputTranscription?.text) {
              const text = serverContent.outputTranscription.text;
              geminiTurnAccumulatorRef.current += text;
              setGeminiTranscript(geminiTurnAccumulatorRef.current);
              onGeminiSpeech?.(geminiTurnAccumulatorRef.current);
            }

            // Turn complete
            if (serverContent.turnComplete) {
              const finalUser = userTurnAccumulatorRef.current.trim();
              const finalGemini = geminiTurnAccumulatorRef.current.trim();

              if (finalUser || finalGemini) {
                setConversationTurns((prev) => [
                  ...prev,
                  ...(finalUser ? [{ role: "user" as const, text: finalUser, timestamp: new Date() }] : []),
                  ...(finalGemini ? [{ role: "gemini" as const, text: finalGemini, timestamp: new Date() }] : []),
                ]);
              }

              if (finalUser || finalGemini) {
                onTurnComplete?.(finalUser, finalGemini);
              }

              userTurnAccumulatorRef.current = "";
              geminiTurnAccumulatorRef.current = "";
            }
          },
          onerror: (err: unknown) => {
            const errorMsg =
              err instanceof Error
                ? err.message
                : typeof err === "object" && err !== null && "message" in err
                ? String((err as { message: unknown }).message)
                : "Gemini Live connection error";
            setError(errorMsg);
            onError?.(errorMsg);
            stopSession();
          },
          onclose: () => {
            setIsConnected(false);
            setIsConnecting(false);
          },
        },
      });

      sessionRef.current = session;

      // 5. Initialize microphone capture at 16kHz PCM
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const recordCtx = new AudioCtx();
      audioContextRef.current = recordCtx;
      if (recordCtx.state === "suspended") {
        await recordCtx.resume();
      }

      const sourceNode = recordCtx.createMediaStreamSource(stream);
      // Buffer size 4096 gives ~85ms latency at 48kHz
      const processor = recordCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!sessionRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = downsampleAndConvert(inputData, recordCtx.sampleRate, 16000);
        const base64Audio = int16ToBase64(pcm16);

        sessionRef.current.sendRealtimeInput({
          audio: {
            data: base64Audio,
            mimeType: "audio/pcm;rate=16000",
          },
        });
      };

      sourceNode.connect(processor);
      // Route through a muted gain node to satisfy Web Audio destination requirement
      const muteGain = recordCtx.createGain();
      muteGain.gain.value = 0;
      processor.connect(muteGain);
      muteGain.connect(recordCtx.destination);

      setIsListening(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start Gemini Live session";
      setError(msg);
      onError?.(msg);
      stopSession();
    }
  }, [
    isConnecting,
    mode,
    knowledgeGraphSummary,
    initialPrompt,
    voiceName,
    onUserSpeech,
    onGeminiSpeech,
    onTurnComplete,
    onError,
    stopAudio,
    stopSession,
  ]);

  const toggleMic = useCallback(() => {
    if (isConnected) {
      stopSession();
    } else {
      startSession();
    }
  }, [isConnected, startSession, stopSession]);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return {
    isConnected,
    isConnecting,
    isListening,
    isGeminiSpeaking,
    userTranscript,
    geminiTranscript,
    conversationTurns,
    startSession,
    stopSession,
    toggleMic,
    error,
  };
}
