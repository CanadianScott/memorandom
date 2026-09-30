"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Upload, Check } from "lucide-react";
import { Media } from "@/types/database";
import { cn } from "@/lib/utils";

export interface PhotoGalleryProps {
  media: Media[];
  onSelect?: (media: Media) => void;
  className?: string;
}

export function PhotoGallery({ media, onSelect, className }: PhotoGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (item: Media) => {
    const nextId = selectedId === item.id ? null : item.id;
    setSelectedId(nextId);
    onSelect?.(item);
  };

  if (!media || media.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-warm-brown/25 bg-white/40 min-h-[220px]",
          className
        )}
      >
        <div className="w-14 h-14 rounded-full bg-aged-paper/80 border border-warm-brown/20 flex items-center justify-center mb-3">
          <Upload className="w-7 h-7 text-warm-brown" />
        </div>
        <h4 className="font-serif font-bold text-lg text-ink">No photos uploaded yet</h4>
        <p className="text-sm text-ink/70 mt-1 max-w-sm">
          Cherished memories and milestone documents will appear here once uploaded and privacy-approved.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6",
        className
      )}
    >
      {media.map((item) => {
        const isSelected = selectedId === item.id;
        const uploadDate = item.created_at
          ? new Date(item.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "Recently uploaded";

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item)}
            className={cn(
              "group relative flex flex-col rounded-2xl overflow-hidden bg-white/80 transition-all text-left shadow-xs focus:outline-none min-h-[48px]",
              isSelected
                ? "ring-4 ring-warm-brown border-2 border-warm-brown shadow-md"
                : "border border-warm-brown/20 hover:border-warm-brown/50 hover:shadow-sm"
            )}
          >
            <div className="relative aspect-square w-full bg-aged-paper/40 overflow-hidden">
              <Image
                src={item.url}
                alt={item.alt_text || item.filename || "Memoir photo"}
                fill
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {isSelected && (
                <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-warm-brown text-cream flex items-center justify-center shadow-md">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </div>

            <div className="p-3 bg-white flex flex-col justify-between flex-1">
              <p
                className="font-medium text-sm text-ink truncate"
                title={item.filename || undefined}
              >
                {item.filename || "Untitled Photo"}
              </p>
              <p className="text-xs text-ink/60 mt-0.5">{uploadDate}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
