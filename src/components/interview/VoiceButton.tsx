"use client";

import React from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VoiceButtonProps {
  isListening: boolean;
  onToggle: () => void;
  error?: string | null;
  disabled?: boolean;
  className?: string;
}

export function VoiceButton({
  isListening,
  onToggle,
  error,
  disabled = false,
  className,
}: VoiceButtonProps) {
  const hasError = Boolean(error);

  const getAriaLabel = () => {
    if (isListening) return "Stop listening";
    if (hasError) return `Error: ${error}. Tap to retry.`;
    return "Start speaking";
  };

  const getButtonStyles = () => {
    if (isListening) {
      return "bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-400/50 shadow-lg shadow-red-500/30";
    }
    if (hasError) {
      return "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/30";
    }
    return "bg-warm-brown hover:bg-warm-brown/90 text-white shadow-lg shadow-warm-brown/25";
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative flex items-center justify-center">
        {isListening && (
          <div
            aria-hidden="true"
            className="absolute -inset-2 rounded-full bg-red-500/30 animate-ping pointer-events-none"
          />
        )}

        <button
          type="button"
          role="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={getAriaLabel()}
          className={cn(
            "relative flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-full transition-all duration-300 select-none cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-soft-gold",
            getButtonStyles(),
            disabled && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
        >
          {isListening ? (
            <MicOff className="w-10 h-10 md:w-12 md:h-12" />
          ) : (
            <Mic className="w-10 h-10 md:w-12 md:h-12" />
          )}
        </button>
      </div>

      {isListening && (
        <span className="text-base md:text-lg font-semibold text-red-600 animate-pulse tracking-wide">
          Listening...
        </span>
      )}

      {!isListening && hasError && (
        <div className="text-sm font-medium text-amber-900 bg-amber-100/90 border border-amber-300 rounded-xl px-4 py-2 text-center max-w-xs shadow-sm">
          {error}
        </div>
      )}

      {!isListening && !hasError && (
        <span className="text-base md:text-lg font-medium text-ink/75">
          Tap to speak
        </span>
      )}
    </div>
  );
}
