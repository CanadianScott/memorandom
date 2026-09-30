"use client";

import React from "react";
import { StoryWithDetails } from "@/lib/supabase/client";
import { ImageCarousel } from "@/components/visual-stage/ImageCarousel";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface StoryReaderProps {
  story: StoryWithDetails;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export function StoryReader({
  story,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}: StoryReaderProps) {
  // Format narrative text
  const paragraphs = story.transcript.split("\n\n").filter((p) => p.trim() !== "");

  // Hero image
  const heroMedia = story.story_media && story.story_media.length > 0 
    ? story.story_media[0].media 
    : null;
  
  // Gallery images (if > 1)
  const galleryMedia = story.story_media && story.story_media.length > 1 
    ? story.story_media.slice(1).map(sm => sm.media).filter(m => m !== null) 
    : [];

  const formattedDate = new Date(story.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <article className="max-w-3xl mx-auto py-12 px-6 md:px-12 bg-cream text-ink print:p-0 print:max-w-full">
      {/* Hero Section */}
      <div className="mb-10 rounded-2xl overflow-hidden print:rounded-none">
        {heroMedia ? (
          <div 
            className="w-full h-[40vh] md:h-[50vh] bg-cover bg-center print:h-auto print:max-h-[40vh]" 
            style={{ backgroundImage: `url(${heroMedia.url})` }}
            title={heroMedia.caption || heroMedia.alt_text || "Story illustration"}
          >
            {/* Img tag for print visibility */}
            <img 
              src={heroMedia.url} 
              alt={heroMedia.caption || heroMedia.alt_text || "Story illustration"} 
              className="hidden print:block w-full h-auto max-h-[40vh] object-cover" 
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-tr from-warm-brown/20 to-aged-paper print:hidden" />
        )}
      </div>

      {/* Header */}
      <header className="mb-12 text-center">
        {story.era_tags && story.era_tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {story.era_tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-warm-brown/10 text-warm-brown text-sm rounded-full tracking-wide uppercase">
                {tag}
              </span>
            ))}
          </div>
        )}
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-ink leading-tight mb-4">
          {story.title || "Untitled Story"}
        </h1>
        <time className="text-warm-brown/70 italic text-lg">{formattedDate}</time>
      </header>

      {/* Narrative */}
      <div className="font-serif text-lg md:text-xl leading-relaxed text-ink/90 space-y-6 print:text-black">
        {paragraphs.map((p, idx) => {
          // Check for pull quote
          if (p.trim().startsWith('"') || p.trim().startsWith('“')) {
            return (
              <blockquote key={idx} className="my-10 pl-6 border-l-4 border-soft-gold text-2xl italic text-ink/80 print:border-black print:text-black">
                {p}
              </blockquote>
            );
          }

          // First paragraph gets drop cap
          if (idx === 0) {
            return (
              <p key={idx} className="first-letter:float-left first-letter:text-6xl first-letter:pr-2 first-letter:font-bold first-letter:text-warm-brown print:first-letter:text-black">
                {p}
              </p>
            );
          }

          return <p key={idx}>{p}</p>;
        })}
      </div>

      {/* Photo Gallery */}
      {galleryMedia.length > 0 && (
        <div className="mt-16 mb-8 print:break-inside-avoid">
          <h3 className="font-serif text-2xl text-center mb-6 text-ink/80">More Memories</h3>
          <div className="print:hidden">
            <ImageCarousel 
              images={galleryMedia.map(m => ({ 
                url: m!.url, 
                title: m!.caption || m!.filename || "Photo",
                attribution: m!.attribution || undefined
              }))} 
            />
          </div>
          <div className="hidden print:grid print:grid-cols-2 print:gap-4">
            {galleryMedia.map((m, i) => (
              <div key={i} className="mb-4">
                <img src={m!.url} alt={m!.caption || "Photo"} className="w-full h-auto rounded" />
                {m!.caption && <p className="text-sm italic mt-1">{m!.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entity Mentions */}
      {story.story_entities && story.story_entities.length > 0 && (
        <div className="mt-16 pt-8 border-t border-warm-brown/20 print:hidden">
          <h4 className="text-sm uppercase tracking-widest text-warm-brown/70 mb-4">People & Places Mentioned</h4>
          <div className="flex flex-wrap gap-2">
            {story.story_entities.map((se) => (
              se.entities && (
                <span key={se.entities.id} className="px-3 py-1 bg-white/50 border border-warm-brown/20 text-ink/80 text-sm rounded-full shadow-sm">
                  {se.entities.name}
                </span>
              )
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="mt-16 flex items-center justify-between border-t border-warm-brown/20 pt-8 print:hidden">
        {hasPrevious ? (
          <Button variant="ghost" onClick={onPrevious} className="gap-2">
            <ChevronLeft size={20} /> Previous
          </Button>
        ) : <div />}
        
        {hasNext ? (
          <Button variant="ghost" onClick={onNext} className="gap-2">
            Next <ChevronRight size={20} />
          </Button>
        ) : <div />}
      </nav>
    </article>
  );
}
