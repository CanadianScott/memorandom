"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface LiveTranscriptProps {
  transcript: string;
  interimResult: string;
  className?: string;
  isListening?: boolean;
}

export function LiveTranscript({
  transcript,
  interimResult,
  className,
  isListening,
}: LiveTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasContent = Boolean(transcript || interimResult);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, interimResult]);

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between w-full min-h-[180px] max-h-[360px] overflow-y-auto rounded-2xl border border-warm-brown/20 bg-aged-paper/50 p-6 md:p-8 shadow-sm transition-all",
        className
      )}
    >
      {hasContent ? (
        <div className="space-y-2">
          <p className="text-2xl md:text-3xl font-serif leading-relaxed break-words">
            {transcript && <span className="text-ink">{transcript}</span>}
            {transcript && interimResult && " "}
            {interimResult && (
              <span className="text-stone-400 italic">{interimResult}</span>
            )}
          </p>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center py-6">
          <p className="text-xl md:text-2xl font-serif text-ink/40 italic text-center">
            {isListening
              ? "Listening to your story... Speak at your own pace."
              : "Your words will appear here as you speak."}
          </p>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
