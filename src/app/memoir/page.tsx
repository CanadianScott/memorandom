"use client";

import React, { useEffect, useState, useRef } from "react";
import { getChaptersWithStories, getStories, getEntities, ChapterWithStories, StoryWithDetails } from "@/lib/supabase/client";
import { autoOrganizeChapters, createChapter } from "@/lib/memoir/chapters";
import { ChapterNav } from "@/components/memoir/ChapterNav";
import { StoryReader } from "@/components/memoir/StoryReader";
import { MemoirCover } from "@/components/memoir/MemoirCover";
import { Button } from "@/components/ui/Button";
import { Printer } from "lucide-react";
import Link from "next/link";
import "./print.css";

export default function MemoirPage() {
  const [chapters, setChapters] = useState<ChapterWithStories[]>([]);
  const [storyDetails, setStoryDetails] = useState<Record<string, StoryWithDetails>>({});
  const [entityCount, setEntityCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeChapterId, setActiveChapterId] = useState<string>();
  
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMemoir() {
      try {
        let chaps = await getChaptersWithStories();
        const allStories = await getStories();
        
        if (chaps.length === 0 && allStories.length > 0) {
          const organized = await autoOrganizeChapters(allStories);
          for (const org of organized) {
            await createChapter(org.title, org.storyIds);
          }
          chaps = await getChaptersWithStories();
        }
        
        setChapters(chaps);
        if (chaps.length > 0) {
          setActiveChapterId(chaps[0].id);
        }
        
        const detailsMap: Record<string, StoryWithDetails> = {};
        allStories.forEach(s => {
          detailsMap[s.id] = s;
        });
        setStoryDetails(detailsMap);
        
        const entities = await getEntities();
        setEntityCount(entities.length);
      } catch (error) {
        console.error("Failed to load memoir:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadMemoir();
  }, []);

  const totalStories = chapters.reduce((acc, chap) => acc + chap.chapter_stories.length, 0);

  const handlePrint = () => {
    window.print();
  };

  const scrollToChapter = (id: string) => {
    setActiveChapterId(id);
    const el = document.getElementById(`chapter-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="font-serif text-2xl text-ink/70 animate-pulse">Opening the pages...</p>
      </div>
    );
  }

  if (totalStories === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream text-center p-8">
        <h1 className="font-serif text-4xl text-ink mb-6">Your memoir is waiting to be written.</h1>
        <p className="text-ink/80 text-lg mb-8 max-w-md">
          Start by sharing some stories. Your voice will fill these pages with memories, people, and places.
        </p>
        <Link href="/interview">
          <Button size="lg" className="font-serif text-lg px-8">Start an Interview</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-cream">
      <ChapterNav 
        chapters={chapters}
        activeChapterId={activeChapterId}
        onSelectChapter={scrollToChapter}
      />
      
      <main ref={contentRef} className="flex-1 overflow-y-auto print:overflow-visible relative h-screen md:h-auto">
        <div className="fixed md:absolute top-4 right-4 z-50 print:hidden flex gap-3">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2 shadow-md bg-cream text-ink border border-warm-brown/20 hover:bg-aged-paper">
              Back to Home
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={handlePrint} className="gap-2 shadow-md bg-cream text-ink border border-warm-brown/20 hover:bg-aged-paper">
            <Printer size={16} /> Print / Save PDF
          </Button>
        </div>

        <div id="cover">
          <MemoirCover 
            storyCount={totalStories} 
            entityCount={entityCount}
            onBegin={() => {
              if (chapters.length > 0) {
                scrollToChapter(chapters[0].id);
              }
            }}
          />
        </div>

        <div className="pb-24">
          {chapters.map((chapter) => (
            <div key={chapter.id} id={`chapter-${chapter.id}`} className="print-chapter-break mt-24 first:mt-0 print:mt-0">
              <div className="py-24 text-center px-4 print:py-32 bg-cream">
                <h2 className="font-serif text-4xl md:text-5xl text-ink/90 mb-4 print:text-black print:text-5xl">{chapter.title}</h2>
                <div className="h-px w-24 bg-warm-brown/30 mx-auto print:bg-black" />
              </div>
              
              <div className="space-y-32 print:space-y-8 bg-cream">
                {[...chapter.chapter_stories]
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((cs) => {
                    const fullStory = storyDetails[cs.story_id];
                    if (!fullStory) return null;
                    return (
                      <div key={cs.story_id} className="print-story-break">
                        <StoryReader 
                          story={fullStory} 
                        />
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
