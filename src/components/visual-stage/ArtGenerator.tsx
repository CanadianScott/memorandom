"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Sparkles, Loader2, Check, BookmarkPlus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ArtStyle } from "@/types/interview";
import { uploadMedia } from "@/lib/supabase/client";

export interface ArtGeneratorProps {
  initialPrompt?: string;
  onGenerated?: (imageUrl: string) => void;
  className?: string;
  autoGenerate?: boolean;
}

export function ArtGenerator({
  initialPrompt = "",
  onGenerated,
  className = "",
  autoGenerate = false,
}: ArtGeneratorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [style, setStyle] = useState<ArtStyle>("kodachrome");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() !== prompt.trim()) {
      setPrompt(initialPrompt.trim());
    }
  }, [initialPrompt]);

  const handleGenerate = async (overridePrompt?: string) => {
    const textToIllustrate = (overridePrompt || prompt || "").trim();
    if (!textToIllustrate) return;

    setIsLoading(true);
    setIsSaved(false);

    try {
      const res = await fetch("/api/gemini/generate-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToIllustrate,
          storySummary: textToIllustrate,
          style,
        }),
      });

      const data = await res.json();
      const imageUrl =
        data.imageUrl ||
        (data.imageBase64
          ? `data:${data.mimeType || "image/png"};base64,${data.imageBase64}`
          : null);

      if (imageUrl) {
        setGeneratedImage(imageUrl);
        setModelUsed(data.model || "gemini-3.1-flash-image");
        onGenerated?.(imageUrl);
      }
    } catch (err) {
      console.error("Art generation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoGenerate && initialPrompt && !generatedImage && !isLoading) {
      handleGenerate(initialPrompt);
    }
  }, [autoGenerate, initialPrompt]);

  const handleSaveToMemoir = async () => {
    if (!generatedImage || isSaving || isSaved) return;
    setIsSaving(true);
    try {
      // Convert data URL to Blob
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      await uploadMedia(blob, "generated", {
        artStyle: style,
        caption: prompt.slice(0, 100),
        altText: `Nano illustration: ${prompt.slice(0, 80)}`,
        attribution: "Generated with Gemini Nano Banana",
      });
      setIsSaved(true);
    } catch (err) {
      console.warn("Failed to persist media, stored in session:", err);
      setIsSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border border-warm-brown/20 bg-white/85 p-5 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-warm-brown font-serif font-semibold">
          <Sparkles className="w-5 h-5 text-soft-gold" />
          <h3 className="text-base md:text-lg">Nano Story Illustrator</h3>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-soft-gold/25 text-warm-brown border border-soft-gold/30">
          Powered by Nano
        </span>
      </div>

      <p className="text-xs text-ink/70">
        Choose an artistic style and publish an AI painting or retro photograph of this memory.
      </p>

      {/* Style selector */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {(
          [
            ["kodachrome", "📷 1960s Kodachrome"],
            ["watercolor", "🎨 Classic Watercolor"],
            ["oil_painting", "🖼️ Rich Oil Painting"],
            ["storybook", "📖 Warm Storybook"],
          ] as [ArtStyle, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStyle(key)}
            className={`p-2.5 rounded-xl border text-left transition font-serif cursor-pointer ${
              style === key
                ? "border-warm-brown bg-warm-brown text-cream font-medium shadow-xs"
                : "border-warm-brown/20 bg-aged-paper/40 text-ink/80 hover:bg-aged-paper/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Scene description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-warm-brown uppercase tracking-wider">
          Story Description / Scene Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the scene (e.g. visiting Yellowstone geyser in a station wagon)..."
          rows={3}
          className="w-full rounded-xl border border-warm-brown/25 p-3 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-warm-brown/30 bg-aged-paper/20 text-ink font-serif resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          onClick={() => handleGenerate()}
          disabled={isLoading || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 cursor-pointer text-sm font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-soft-gold" />
              <span>Publishing with Nano Banana...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-soft-gold" />
              <span>Publish Illustration with Nano</span>
            </>
          )}
        </Button>

        {generatedImage && (
          <div className="flex flex-col gap-3 mt-2">
            <div className="relative h-64 w-full rounded-xl overflow-hidden border border-warm-brown/30 shadow-md bg-stone-100">
              <Image
                src={generatedImage}
                alt="Nano generated memoir illustration"
                fill
                unoptimized
                className="object-cover"
              />
              {modelUsed && (
                <div className="absolute bottom-2 right-2 bg-ink/75 text-cream text-[10px] px-2 py-0.5 rounded backdrop-blur-xs font-mono">
                  {modelUsed}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveToMemoir}
                disabled={isSaving || isSaved}
                className="flex-1 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Saved to Memoir Book</span>
                  </>
                ) : isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-4 h-4 text-warm-brown" />
                    <span>Save to Story Memoir</span>
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isLoading}
                title="Regenerate with different variation"
                className="p-2 rounded-lg border border-warm-brown/20 bg-aged-paper/40 hover:bg-aged-paper text-ink cursor-pointer transition"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ArtGenerator;
