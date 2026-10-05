"use client";

import React, { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { VisualStage } from "@/components/visual-stage/VisualStage";
import { LiveTranscript } from "@/components/interview/LiveTranscript";
import { VoiceButton } from "@/components/interview/VoiceButton";
import { SpeakingIndicator } from "@/components/interview/SpeakingIndicator";
import { useGeminiLiveConversation } from "@/hooks/useGeminiLiveConversation";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { createInterviewSession, saveStoryFromTranscript, InterviewSession } from "@/lib/interview/session";
import { getGraphSummary, getBiographicalProfile } from "@/lib/interview/knowledge-graph";
import { HistoricalContextResponse, HistoricalPromptItem } from "@/types/historical-context";
import { SessionMode } from "@/types/database";
import { ExtractedEntity } from "@/types/entities";
import { CarouselItem } from "@/components/visual-stage/ImageCarousel";
import { Sparkles, Radio, Keyboard, Send, RefreshCw, Image as ImageIcon, MapPin, Home } from "lucide-react";

function InterviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = (searchParams.get("mode") as SessionMode) || "surprise_me";
  const isSandbox = searchParams.get("sandbox") === "true";
  const promptParam = searchParams.get("prompt") || "";

  // Conversation Engine: "gemini_live" (real-time voice) or "classic" (turn-by-turn fallback)
  const [engineMode, setEngineMode] = useState<"gemini_live" | "classic">("gemini_live");

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState(
    promptParam || "Tap the microphone to start your Gemini Live conversation."
  );
  const [graphSummary, setGraphSummary] = useState("");

  // Turn tracking and historical prompt injection
  const [, setTurnCount] = useState(0);
  const turnCountRef = useRef(0);
  const [activeMemorySpark, setActiveMemorySpark] = useState<string | null>(null);
  const usedHistoricalEventsRef = useRef<Set<string>>(new Set());
  // Accumulate all user turns in memory — saved as one story on session end
  const sessionTranscriptRef = useRef<string[]>([]);

  // Visual Stage state
  const [entities, setEntities] = useState<ExtractedEntity[]>([]);
  const [activeLocation, setActiveLocation] = useState<string | undefined>();
  const activeLocationRef = useRef<string | undefined>(undefined);
  const [mapLocations, setMapLocations] = useState<{ name: string; query: string }[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [images, setImages] = useState<CarouselItem[]>([]);
  const [artPrompt, setArtPrompt] = useState<string>("");
  const [visualStageTab, setVisualStageTab] = useState<"map" | "photos" | "art">("photos");
  const visualStageTabRef = useRef<"map" | "photos" | "art">("photos");

  const setVisualStageTabTracked = useCallback((tab: "map" | "photos" | "art") => {
    visualStageTabRef.current = tab;
    setVisualStageTab(tab);
  }, []);

  const setActiveLocationTracked = useCallback((loc: string | undefined) => {
    activeLocationRef.current = loc;
    setActiveLocation(loc);
  }, []);

  // Initialize interview session on mount
  useEffect(() => {
    let isMounted = true;
    async function initSession() {
      try {
        const [s, graph] = await Promise.all([
          createInterviewSession(mode, promptParam || undefined),
          getGraphSummary().catch(() => ""),
        ]);
        if (isMounted) {
          setSession(s);
          if (graph) {
            setGraphSummary(graph);
          }
          if (promptParam) {
            setCurrentPrompt(promptParam);
          } else if (s.currentTopic) {
            setCurrentPrompt(s.currentTopic);
          }
        }
      } catch (err) {
        console.warn("Failed to initialize interview session:", err);
      }
    }
    initSession();
    return () => {
      isMounted = false;
    };
  }, [mode, promptParam]);

  // Text input fallback
  const [manualText, setManualText] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const enrichVisuals = useCallback(async (query?: string, mapLoc?: string) => {
    if (mapLoc) {
      setActiveLocationTracked(mapLoc);
      setMapLocations((prev) => {
        if (prev.some((l) => l.name.toLowerCase() === mapLoc.toLowerCase())) return prev;
        return [...prev, { name: mapLoc, query: mapLoc }];
      });
      setVisualStageTabTracked("map");
    }
    if (query) {
      setSearchQueries((prev) => {
        if (prev.includes(query)) return prev;
        return [...prev, query];
      });
      try {
        const res = await fetch("/api/enrichment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "wikimedia", query, limit: 4 }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            setImages((prev) => [...data.results, ...prev.slice(0, 8)]);
            // Do NOT flip back to "photos" if a place location was just extracted or an active map pin is displayed
            if (!mapLoc && !activeLocationRef.current && visualStageTabRef.current !== "map") {
              setVisualStageTabTracked("photos");
            }
          }
        }
      } catch {
        // Enrichment error ignored gracefully
      }
    }
  }, [setActiveLocationTracked, setVisualStageTabTracked]);

  // Process text for live visual enrichment
  const triggerVisualEnrichment = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      // Lower character threshold from 15 to 3 so concise place answers ("Paris", "Yellowstone") trigger visual enrichment
      if (!trimmed || trimmed.length < 3) return;

      // Update art prompt for Nano Banana
      setArtPrompt(trimmed);

      // Run Entity Extraction & Visual Context in parallel
      try {
        const [entitiesRes, visualRes] = await Promise.allSettled([
          fetch("/api/gemini/extract-entities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript: trimmed }),
          }).then((r) => (r.ok ? r.json() : null)),
          fetch("/api/gemini/visual-context", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript: trimmed }),
          }).then((r) => (r.ok ? r.json() : null)),
        ]);

        let extractedPlace: string | undefined;

        if (entitiesRes.status === "fulfilled" && entitiesRes.value) {
          const data = entitiesRes.value;
          if (data.entities?.length > 0) {
            setEntities((prev) => {
              const existingNames = new Set(prev.map((e) => e.name.toLowerCase()));
              const newItems = data.entities.filter(
                (e: ExtractedEntity) => !existingNames.has(e.name.toLowerCase())
              );
              return [...prev, ...newItems];
            });
          }
          if (data.mapLocations?.length > 0) {
            const loc = data.mapLocations[0];
            extractedPlace = loc.name;
            setActiveLocationTracked(loc.name);
            setMapLocations((prev) => {
              if (prev.some((l) => l.name.toLowerCase() === loc.name.toLowerCase())) return prev;
              return [...prev, loc];
            });
            setVisualStageTabTracked("map");
          }
          // Leverage data.visualQueries from /api/gemini/extract-entities
          if (data.visualQueries && Array.isArray(data.visualQueries) && data.visualQueries.length > 0) {
            for (const vq of data.visualQueries) {
              enrichVisuals(vq, extractedPlace);
            }
          }
        }

        if (visualRes.status === "fulfilled" && visualRes.value) {
          const vData = visualRes.value;
          const mapLoc = extractedPlace || (vData.mapQueries && vData.mapQueries.length > 0 ? vData.mapQueries[0].name : undefined);
          if (vData.searchQueries?.length > 0) {
            const q = vData.searchQueries[0];
            enrichVisuals(q, mapLoc);
          }
        }
      } catch (err) {
        console.warn("Visual enrichment error:", err);
      }
    },
    [enrichVisuals, setActiveLocationTracked, setVisualStageTabTracked]
  );

  // --- GEMINI LIVE CONVERSATION ENGINE ---
  const handleLiveTurnComplete = useCallback(
    async (userText: string, geminiText: string) => {
      if (userText) {
        await triggerVisualEnrichment(userText);

        // Accumulate turn in memory — story saved on session end
        if (userText.trim().length > 10) {
          sessionTranscriptRef.current.push(userText.trim());
        }

        // Increment conversation turn count
        const nextTurn = turnCountRef.current + 1;
        turnCountRef.current = nextTurn;
        setTurnCount(nextTurn);
      }

      if (geminiText) {
        setCurrentPrompt(geminiText);
      }
    },
    [session, triggerVisualEnrichment]
  );

  const live = useGeminiLiveConversation({
    mode,
    knowledgeGraphSummary: graphSummary,
    initialPrompt: currentPrompt,
    voiceName: "Puck",
    onUserSpeech: (speech) => {
      // If speech is substantial, set artPrompt
      if (speech.length > 20) {
        setArtPrompt(speech);
      }
    },
    onTurnComplete: handleLiveTurnComplete,
  });

  // --- CLASSIC TURN-BY-TURN ENGINE (FALLBACK) ---
  const {
    transcript: classicTranscript,
    interimResult: classicInterim,
    isListening: classicIsListening,
    startListening: classicStartListening,
    stopListening: classicStopListening,
    resetTranscript: classicResetTranscript,
    error: classicError,
  } = useSpeechRecognition();
  const { speak: classicSpeak, isSpeaking: classicIsSpeaking, cancel: classicCancel } = useTextToSpeech({ rate: 0.95 });
  const [classicIsProcessing, setClassicIsProcessing] = useState(false);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize session on mount
  useEffect(() => {
    async function init() {
      try {
        let newSession: InterviewSession;
        try {
          newSession = await createInterviewSession(mode, promptParam || undefined);
        } catch {
          newSession = {
            id: `session-${Date.now()}`,
            mode,
            currentTopic: promptParam || undefined,
            entitiesMentioned: [],
            questionHistory: promptParam ? [promptParam] : [],
          };
        }
        setSession(newSession);

        let summary = "";
        try {
          summary = await getGraphSummary();
        } catch {
          summary = "";
        }
        setGraphSummary(summary);
      } catch (e) {
        console.error("Session init error:", e);
      }
    }
    init();
  }, [mode]);

  // Classic mode processing
  const handleClassicProcess = useCallback(
    async (textToProcess: string) => {
      if (!textToProcess.trim() || classicIsProcessing) return;
      setClassicIsProcessing(true);
      classicStopListening();

      try {
        const activeSession = session || {
          id: `session-${Date.now()}`,
          mode,
          entitiesMentioned: [],
          questionHistory: [currentPrompt],
        };

        await triggerVisualEnrichment(textToProcess);

        // Accumulate turn in memory — story saved on session end
        if (textToProcess.trim().length > 10) {
          sessionTranscriptRef.current.push(textToProcess.trim());
        }

        // Increment conversation turn count
        const nextTurn = turnCountRef.current + 1;
        turnCountRef.current = nextTurn;
        setTurnCount(nextTurn);

        // Historical prompt injection cadence:
        // When turnCount >= 4 and (turnCount % 6 === 0 || turnCount % 7 === 0) (~1 in 5-8 questions)
        // and BKG has >= 1 era or place entity, inject historical prompt
        const shouldInjectHistorical =
          nextTurn >= 4 && (nextTurn % 6 === 0 || nextTurn % 7 === 0);
        let injectedHistorical = false;
        let nextQ = "That is such a wonderful memory. What else comes to mind about that time?";

        if (shouldInjectHistorical) {
          try {
            const profile = await getBiographicalProfile();
            const hasBkgContext =
              (profile.eras && profile.eras.length > 0) ||
              (profile.places && profile.places.length > 0);

            if (hasBkgContext) {
              const histRes = await fetch("/api/gemini/historical-context", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  eras: profile.eras,
                  locations: profile.places,
                  birthDecade: profile.estimatedBirthDecade,
                  birthYear: profile.estimatedBirthYear,
                  excludeEventNames: Array.from(usedHistoricalEventsRef.current),
                  limit: 3,
                }),
              });

              if (histRes.ok) {
                const histData: HistoricalContextResponse = await histRes.json();
                if (histData.prompts && histData.prompts.length > 0) {
                  const histItem: HistoricalPromptItem = histData.prompts[0];
                  usedHistoricalEventsRef.current.add(histItem.historicalEvent);
                  nextQ = histItem.question;
                  setActiveMemorySpark(histItem.historicalEvent);
                  injectedHistorical = true;

                  // Update VisualStage tab and enrich visuals with mapQuery, visualQuery, and artPrompt
                  if (histItem.artPrompt) {
                    setArtPrompt(histItem.artPrompt);
                  }
                  if (histItem.mapQuery) {
                    enrichVisuals(histItem.visualQuery, histItem.mapQuery);
                    setVisualStageTabTracked("map");
                  } else if (histItem.visualQuery) {
                    enrichVisuals(histItem.visualQuery);
                    setVisualStageTabTracked("photos");
                  }
                }
              }
            }
          } catch (histErr) {
            console.warn("Failed to inject historical prompt:", histErr);
          }
        }

        if (!injectedHistorical) {
          setActiveMemorySpark(null);
          try {
            const interviewRes = await fetch("/api/gemini/interview", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                transcript: textToProcess,
                knowledgeGraphSummary: graphSummary,
                mode: activeSession.mode,
              }),
            });
            if (interviewRes.ok) {
              const interviewData = await interviewRes.json();
              if (interviewData?.question?.question) {
                nextQ = interviewData.question.question;
                if (interviewData.visualQuery || interviewData.mapQuery) {
                  enrichVisuals(interviewData.visualQuery, interviewData.mapQuery);
                }
              }
            }
          } catch {}
        }

        setCurrentPrompt(nextQ);
        classicResetTranscript();
        setManualText("");
        classicSpeak(nextQ);
      } finally {
        setClassicIsProcessing(false);
      }
    },
    [session, classicIsProcessing, classicStopListening, mode, currentPrompt, graphSummary, triggerVisualEnrichment, classicResetTranscript, classicSpeak, enrichVisuals, setVisualStageTabTracked]
  );

  // Auto-silence timer for classic mode
  useEffect(() => {
    if (engineMode !== "classic") return;
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);

    if (classicTranscript && classicIsListening) {
      pauseTimerRef.current = setTimeout(() => {
        handleClassicProcess(classicTranscript);
      }, 2500);
    }
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [engineMode, classicTranscript, classicIsListening, handleClassicProcess]);

  const handleEndSession = useCallback(async () => {
    if (engineMode === "gemini_live") {
      live.stopSession();
    } else {
      classicCancel();
      classicStopListening();
    }

    // Two-phase save: first save raw transcript (guaranteed), then enrich with narrative
    const turns = sessionTranscriptRef.current;
    if (!isSandbox && turns.length > 0) {
      const activeSession: InterviewSession = session || {
        id: `session-${Date.now()}`,
        mode,
        currentTopic: promptParam || currentPrompt || "Life Story Session",
        entitiesMentioned: [],
        questionHistory: promptParam ? [promptParam] : [],
      };
      const combinedTranscript = turns.join(" ");

      // Phase 1: Save story immediately with raw transcript (never loses data)
      let savedStoryId: string | null = null;
      try {
        const story = await saveStoryFromTranscript(
          { ...activeSession, currentTopic: activeSession.currentTopic || "Life Story Session" },
          combinedTranscript,
          null // no summary yet — save raw first
        );
        savedStoryId = story.id;

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("memorandom:story-created"));
        }
      } catch (err) {
        console.warn("Story save failed:", err);
      }

      // Phase 2: Generate narrative and update the saved story (best-effort)
      if (savedStoryId) {
        // Use a detached promise so navigation doesn't cancel it
        const enrichStory = async () => {
          try {
            const res = await fetch("/api/gemini/summarize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ transcript: combinedTranscript }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.summary || data.title) {
                // Update the story directly in Supabase/localStorage
                const { updateStory } = await import("@/lib/supabase/client");
                await updateStory(savedStoryId!, {
                  ...(data.summary ? { summary: data.summary } : {}),
                  ...(data.title ? { title: data.title } : {}),
                });
              }
            }
          } catch (err) {
            console.warn("Narrative enrichment failed (story saved with raw transcript):", err);
          }
        };
        // Fire and forget — don't block navigation
        enrichStory();
      }
    }

    router.push("/");
  }, [engineMode, live, classicCancel, classicStopListening, router, isSandbox, session]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    if (engineMode === "classic") {
      handleClassicProcess(manualText.trim());
    } else {
      handleLiveTurnComplete(manualText.trim(), "");
      setManualText("");
    }
  };

  // Switch to Art Tab and set prompt
  const handleOpenArtWithNano = () => {
    const candidateText =
      live.userTranscript ||
      classicTranscript ||
      manualText ||
      currentPrompt ||
      "A scenic family memory";
    setArtPrompt(candidateText);
    setVisualStageTabTracked("art");
  };

  const isListening = engineMode === "gemini_live" ? live.isListening : classicIsListening;
  const isSpeaking = engineMode === "gemini_live" ? live.isGeminiSpeaking : classicIsSpeaking;
  const displayedTranscript = engineMode === "gemini_live" ? live.userTranscript : classicTranscript;
  const displayedInterim = engineMode === "gemini_live" ? "" : classicInterim;
  const currentError = engineMode === "gemini_live" ? live.error : classicError;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-cream">
      <main className="w-full md:w-[60%] flex flex-col p-6 md:p-12 relative border-r border-warm-brown/20">
        {/* Sandbox Banner */}
        {isSandbox && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-amber-100 border border-amber-400 text-amber-800 text-sm font-medium text-center">
            🧪 Sandbox Mode — this session will not be saved
          </div>
        )}
        {/* Top Bar */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-warm-brown/70 hover:text-warm-brown transition" aria-label="Home">
              <Home className="w-5 h-5" />
            </Link>
            <span className="text-sm font-semibold uppercase tracking-widest text-warm-brown/80 font-sans">
              {mode.replace("_", " ")}
            </span>

            {/* Mode Indicator */}
            {engineMode === "gemini_live" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Gemini Live Voice
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <button
              type="button"
              onClick={() => {
                if (engineMode === "gemini_live") {
                  live.stopSession();
                  setEngineMode("classic");
                } else {
                  classicCancel();
                  classicStopListening();
                  setEngineMode("gemini_live");
                }
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-warm-brown/30 bg-aged-paper/60 hover:bg-aged-paper text-ink/80 flex items-center gap-1.5 transition cursor-pointer"
            >
              {engineMode === "gemini_live" ? (
                <>
                  <Radio className="w-3.5 h-3.5 text-warm-brown" />
                  <span>Switch to Classic</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-warm-brown" />
                  <span>Switch to Gemini Live</span>
                </>
              )}
            </button>

            <Button variant="ghost" size="sm" onClick={handleEndSession}>
              End Session
            </Button>
          </div>
        </div>

        {/* Center Storytelling Stage */}
        <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full gap-8">
          {/* Current Question / Biographer Prompt */}
          <div className="space-y-3">
            {activeMemorySpark && (
              <div>
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-serif font-medium bg-soft-gold/30 text-warm-brown border border-soft-gold/50 shadow-xs">
                  <span className="text-sm">🏛️</span>
                  <span className="font-semibold tracking-wide">Memory Spark:</span>
                  <span className="font-medium">{activeMemorySpark}</span>
                </span>
              </div>
            )}
            {engineMode === "gemini_live" && live.isConnected && !activeMemorySpark && (
              <p className="text-xs uppercase tracking-wider font-semibold text-warm-brown flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-soft-gold" />
                Gemini Biographer
              </p>
            )}
            <h2 className="text-3xl md:text-5xl font-serif text-ink leading-tight">
              {engineMode === "gemini_live" && live.geminiTranscript
                ? live.geminiTranscript
                : currentPrompt}
            </h2>
          </div>

          {/* Large Voice Interaction Controller */}
          <div className="flex flex-col items-center gap-4">
            <VoiceButton
              isListening={isListening}
              onToggle={() => {
                if (engineMode === "gemini_live") {
                  live.toggleMic();
                } else {
                  if (classicIsListening) {
                    classicStopListening();
                    if (classicTranscript) handleClassicProcess(classicTranscript);
                  } else {
                    classicStartListening();
                  }
                }
              }}
              disabled={engineMode === "gemini_live" ? live.isConnecting : classicIsProcessing}
              error={currentError}
            />

            {engineMode === "gemini_live" && live.isConnecting && (
              <span className="text-sm font-medium text-warm-brown flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-soft-gold" />
                Connecting to Gemini Live Voice...
              </span>
            )}

            {/* Quick Action Pills for Visual Stage & Nano Art */}
            <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
              <button
                type="button"
                onClick={handleOpenArtWithNano}
                className="px-3 py-1.5 rounded-full text-xs font-serif font-medium bg-soft-gold/25 hover:bg-soft-gold/40 text-warm-brown border border-soft-gold/40 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-soft-gold" />
                <span>Illustrate story with Nano</span>
              </button>

              <button
                type="button"
                onClick={() => setVisualStageTab("map")}
                className="px-3 py-1.5 rounded-full text-xs font-serif font-medium bg-aged-paper/60 hover:bg-aged-paper text-ink/80 border border-warm-brown/20 flex items-center gap-1.5 transition cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-warm-brown" />
                <span>View on Map</span>
              </button>

              <button
                type="button"
                onClick={() => setVisualStageTab("photos")}
                className="px-3 py-1.5 rounded-full text-xs font-serif font-medium bg-aged-paper/60 hover:bg-aged-paper text-ink/80 border border-warm-brown/20 flex items-center gap-1.5 transition cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-warm-brown" />
                <span>Archival Photos</span>
              </button>
            </div>

            {/* Text input toggle */}
            <button
              type="button"
              onClick={() => setShowManualInput((prev) => !prev)}
              className="text-xs text-warm-brown/80 hover:text-warm-brown flex items-center gap-1.5 underline decoration-warm-brown/40 cursor-pointer pt-1"
            >
              <Keyboard className="w-3.5 h-3.5" />
              {showManualInput ? "Hide text response" : "Prefer to type your answer?"}
            </button>

            {showManualInput && (
              <form onSubmit={handleManualSubmit} className="w-full max-w-lg mt-2 flex flex-col gap-2">
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Type your memories or story here..."
                  rows={3}
                  className="w-full p-3.5 rounded-xl border border-warm-brown/30 bg-white/80 focus:bg-white text-ink text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-warm-brown/40 resize-none font-sans"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!manualText.trim()}
                    className="flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Share Memory
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Live User Transcript */}
          <div className="w-full">
            <LiveTranscript
              transcript={displayedTranscript}
              interimResult={displayedInterim}
              isListening={isListening}
            />
          </div>

          {/* Speaking Audio Wave Indicator */}
          <div className="h-16 flex justify-center">
            <SpeakingIndicator
              isSpeaking={isSpeaking || (engineMode === "classic" && classicIsProcessing)}
              speakerName={engineMode === "gemini_live" ? "Gemini Biographer" : "Biographer"}
              text={
                engineMode === "gemini_live"
                  ? live.geminiTranscript || undefined
                  : classicIsProcessing
                  ? "Thinking..."
                  : undefined
              }
            />
          </div>
        </div>
      </main>

      {/* Split-Screen Visual Stage */}
      <aside className="w-full md:w-[40%] bg-[#FDFBF7] p-6 md:p-12 overflow-y-auto">
        <VisualStage
          entities={entities}
          activeLocation={activeLocation}
          mapLocations={mapLocations}
          searchQueries={searchQueries}
          images={images}
          artPrompt={artPrompt}
          selectedTab={visualStageTab}
          onTabChange={setVisualStageTabTracked}
        />
      </aside>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="p-12 font-serif text-warm-brown">Loading your session...</div>}>
      <InterviewContent />
    </Suspense>
  );
}
