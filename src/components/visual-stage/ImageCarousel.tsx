"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CarouselImage {
  url: string;
  thumbUrl?: string;
  title: string;
  attribution?: string;
}

export type CarouselItem = CarouselImage;

export interface ImageCarouselProps {
  images: CarouselImage[];
  className?: string;
}

export function ImageCarousel({ images = [], className = "" }: ImageCarouselProps) {
  const [rawIndex, setRawIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pointerStartX = useRef<number | null>(null);
  const pointerCurrentX = useRef<number | null>(null);

  const currentIndex =
    images.length > 0 ? (rawIndex >= images.length ? 0 : rawIndex) : 0;

  const next = useCallback(() => {
    setRawIndex((prev) => (images.length > 0 ? (prev + 1) % images.length : 0));
  }, [images.length]);

  const prev = useCallback(() => {
    setRawIndex((prev) =>
      images.length > 0 ? (prev === 0 ? images.length - 1 : prev - 1) : 0
    );
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      next();
    }, 5000);

    return () => clearInterval(timer);
  }, [images.length, isPaused, next]);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartX.current = e.clientX;
    pointerCurrentX.current = e.clientX;
    setIsPaused(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerStartX.current !== null) {
      pointerCurrentX.current = e.clientX;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStartX.current !== null) {
      const endX = pointerCurrentX.current ?? e.clientX;
      const diff = endX - pointerStartX.current;
      if (diff > 45) {
        prev();
      } else if (diff < -45) {
        next();
      }
    }
    pointerStartX.current = null;
    pointerCurrentX.current = null;
    setIsPaused(false);
  };

  const handlePointerCancel = () => {
    pointerStartX.current = null;
    pointerCurrentX.current = null;
    setIsPaused(false);
  };

  if (!images || images.length === 0) {
    return (
      <div
        className={`h-64 w-full rounded-2xl bg-aged-paper/40 border border-warm-brown/15 flex items-center justify-center ${className}`}
      >
        <p className="text-sm text-ink/50 font-serif">No images yet</p>
      </div>
    );
  }

  const current = images[currentIndex];
  if (!current) return null;

  return (
    <div
      className={`relative flex flex-col rounded-2xl overflow-hidden border border-warm-brown/20 bg-aged-paper/30 shadow-md ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-64 w-full bg-ink/5 select-none touch-pan-y">
        <Image
          src={current.thumbUrl || current.url}
          alt={current.title || "Archival photo"}
          fill
          unoptimized
          className="object-cover"
          priority={currentIndex === 0}
        />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/60 to-transparent p-4 text-cream pointer-events-none">
          <p className="text-sm font-serif font-medium leading-snug line-clamp-2">
            {current.title}
          </p>
          {current.attribution && (
            <p className="text-[11px] text-cream/80 mt-1 truncate">
              {current.attribution}
            </p>
          )}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-cream/85 hover:bg-cream text-ink border border-warm-brown/20 shadow-md transition-all focus:outline-none"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-cream/85 hover:bg-cream text-ink border border-warm-brown/20 shadow-md transition-all focus:outline-none"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-2.5 bg-cream/70 border-t border-warm-brown/10">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRawIndex(idx);
              }}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? "w-6 bg-warm-brown"
                  : "w-2 bg-warm-brown/30 hover:bg-warm-brown/60"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageCarousel;
