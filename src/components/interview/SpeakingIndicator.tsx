"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SpeakingIndicatorProps {
  isSpeaking: boolean;
  text?: string;
  speakerName?: string;
  className?: string;
}

export function SpeakingIndicator({
  isSpeaking,
  text,
  speakerName = "Biographer",
  className,
}: SpeakingIndicatorProps) {
  if (!isSpeaking) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center gap-2 px-5 py-3 rounded-2xl bg-cream border border-soft-gold/40 shadow-sm transition-all",
        className
      )}
    >
      <style>{`
        @keyframes memorandomWave {
          0%, 100% { height: 8px; }
          50% { height: 26px; }
        }
        .memorandom-bar-1 { animation: memorandomWave 0.9s ease-in-out infinite; }
        .memorandom-bar-2 { animation: memorandomWave 0.9s ease-in-out infinite 0.18s; }
        .memorandom-bar-3 { animation: memorandomWave 0.9s ease-in-out infinite 0.36s; }
        .memorandom-bar-4 { animation: memorandomWave 0.9s ease-in-out infinite 0.54s; }
      `}</style>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 h-7" aria-hidden="true">
          <span className="w-1.5 bg-warm-brown rounded-full memorandom-bar-1" />
          <span className="w-1.5 bg-warm-brown rounded-full memorandom-bar-2" />
          <span className="w-1.5 bg-warm-brown rounded-full memorandom-bar-3" />
          <span className="w-1.5 bg-warm-brown rounded-full memorandom-bar-4" />
        </div>
        <span className="text-sm font-medium text-ink">
          {speakerName} is speaking...
        </span>
      </div>

      {text && (
        <p className="text-sm italic text-ink/70 max-w-md text-center line-clamp-2 px-2">
          &ldquo;{text}&rdquo;
        </p>
      )}
    </div>
  );
}
