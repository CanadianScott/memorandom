"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChapterWithStories } from "@/lib/supabase/client";
import { Menu, X } from "lucide-react";

export interface ChapterNavProps {
  chapters: ChapterWithStories[];
  activeChapterId?: string;
  onSelectChapter: (id: string) => void;
  className?: string;
}

export function ChapterNav({
  chapters,
  activeChapterId,
  onSelectChapter,
  className,
}: ChapterNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="md:hidden flex items-center justify-between p-4 bg-cream border-b border-warm-brown/20 print:hidden">
        <h1 className="font-serif text-2xl text-ink">Memorandom</h1>
        <button onClick={() => setIsOpen(!isOpen)} className="text-ink">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <nav
        className={cn(
          "bg-cream border-r border-warm-brown/20 flex flex-col transition-all duration-300 print:hidden",
          isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 md:max-h-screen md:opacity-100",
          "md:w-[280px] md:min-h-screen overflow-hidden md:overflow-y-auto shrink-0",
          className
        )}
      >
        <div className="p-6 hidden md:block">
          <h1 className="font-serif text-3xl text-ink tracking-tight mb-2">Memorandom</h1>
          <p className="text-warm-brown/70 text-sm uppercase tracking-widest">Table of Contents</p>
        </div>

        <ul className="flex-1 py-4 md:py-0">
          {chapters.map((chapter, index) => {
            const isActive = activeChapterId === chapter.id;
            const storyCount = chapter.chapter_stories.length;

            return (
              <li key={chapter.id} className="relative">
                {index > 0 && (
                  <div className="absolute top-0 left-6 right-6 h-px bg-warm-brown/10" />
                )}
                <button
                  onClick={() => {
                    onSelectChapter(chapter.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-6 py-4 flex items-center justify-between transition-colors",
                    isActive
                      ? "bg-warm-brown text-cream"
                      : "text-ink hover:bg-aged-paper"
                  )}
                >
                  <span className="font-serif text-lg pr-4">{chapter.title}</span>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full shrink-0",
                      isActive ? "bg-cream/20 text-cream" : "bg-warm-brown/10 text-warm-brown"
                    )}
                  >
                    {storyCount}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
