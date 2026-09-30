"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export interface MemoirCoverProps {
  title?: string;
  subtitle?: string;
  coverImageUrl?: string;
  storyCount: number;
  entityCount: number;
  onBegin?: () => void;
  className?: string;
}

export function MemoirCover({
  title = "Memorandom",
  subtitle = "A Life in Stories",
  coverImageUrl,
  storyCount,
  entityCount,
  onBegin,
  className,
}: MemoirCoverProps) {
  return (
    <div 
      className={cn(
        "min-h-screen w-full flex flex-col items-center justify-center p-8 relative overflow-hidden print:min-h-0 print:h-screen print:page-break-after-always",
        !coverImageUrl && "bg-gradient-to-br from-aged-paper to-warm-brown/20",
        className
      )}
    >
      {/* Background Image Overlay */}
      {coverImageUrl && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center print:hidden" 
            style={{ backgroundImage: `url(${coverImageUrl})` }} 
          />
          <img src={coverImageUrl} className="hidden print:block absolute inset-0 w-full h-full object-cover" alt="Cover" />
          <div className="absolute inset-0 bg-ink/60" />
        </>
      )}

      {/* Decorative Frame */}
      <div className={cn(
        "absolute inset-4 md:inset-8 border-2 border-double rounded-sm pointer-events-none print:border-black",
        coverImageUrl ? "border-cream/30" : "border-warm-brown/30"
      )} />
      <div className={cn(
        "absolute inset-5 md:inset-9 border border-solid rounded-sm pointer-events-none print:border-black",
        coverImageUrl ? "border-cream/20" : "border-warm-brown/20"
      )} />

      {/* Content */}
      <div className={cn(
        "relative z-10 flex flex-col items-center text-center max-w-3xl print:text-black",
        coverImageUrl ? "text-cream" : "text-ink"
      )}>
        <h1 className="font-serif text-6xl md:text-8xl tracking-tight mb-6 print:text-black">
          {title}
        </h1>
        
        <div className="flex items-center gap-4 mb-8">
          <div className={cn("h-px w-12 print:bg-black", coverImageUrl ? "bg-cream/40" : "bg-warm-brown/40")} />
          <h2 className="font-serif text-2xl md:text-3xl italic tracking-wide print:text-black">
            {subtitle}
          </h2>
          <div className={cn("h-px w-12 print:bg-black", coverImageUrl ? "bg-cream/40" : "bg-warm-brown/40")} />
        </div>

        <p className={cn(
          "uppercase tracking-widest text-sm mb-16 print:text-black",
          coverImageUrl ? "text-cream/80" : "text-warm-brown/80"
        )}>
          {storyCount} Stories · {entityCount} People & Places
        </p>

        {onBegin && (
          <Button 
            onClick={onBegin} 
            variant={coverImageUrl ? "primary" : "outline"} 
            size="lg"
            className={cn(
              "font-serif tracking-wide px-10 rounded-sm shadow-xl transition-transform hover:scale-105 print:hidden",
              coverImageUrl && "bg-cream text-ink hover:bg-cream/90"
            )}
          >
            Begin Reading
          </Button>
        )}
      </div>
    </div>
  );
}
