"use client";

import React, { useState, useEffect } from "react";
import { getStories, getEntities } from "@/lib/supabase/client";

export interface HomeStatsProps {
  initialStoriesCount: number;
  initialPeopleCount: number;
  initialPlacesCount: number;
}

export function HomeStats({
  initialStoriesCount,
  initialPeopleCount,
  initialPlacesCount,
}: HomeStatsProps) {
  const [storiesCount, setStoriesCount] = useState<number>(initialStoriesCount);
  const [peopleCount, setPeopleCount] = useState<number>(initialPeopleCount);
  const [placesCount, setPlacesCount] = useState<number>(initialPlacesCount);

  // Synchronize on mount and subscribe to story changes
  useEffect(() => {
    let isMounted = true;

    async function syncStats() {
      try {
        const [stories, entities] = await Promise.all([getStories(), getEntities()]);
        if (isMounted) {
          if (Array.isArray(stories)) {
            setStoriesCount(stories.length);
          }
          if (Array.isArray(entities) && entities.length > 0) {
            setPeopleCount(entities.filter((e) => e.type === "person").length);
            setPlacesCount(entities.filter((e) => e.type === "place").length);
          }
        }
      } catch (err) {
        console.warn("Failed to synchronize HomeStats:", err);
      }
    }

    syncStats();

    const handleStoryDeleted = () => {
      setStoriesCount((prev) => Math.max(0, prev - 1));
      // Re-sync with store to ensure accuracy
      syncStats();
    };

    const handleStoryCreated = () => {
      setStoriesCount((prev) => prev + 1);
      syncStats();
    };

    window.addEventListener("memorandom:story-deleted", handleStoryDeleted);
    window.addEventListener("memorandom:story-created", handleStoryCreated);
    window.addEventListener("storage", syncStats);

    return () => {
      isMounted = false;
      window.removeEventListener("memorandom:story-deleted", handleStoryDeleted);
      window.removeEventListener("memorandom:story-created", handleStoryCreated);
      window.removeEventListener("storage", syncStats);
    };
  }, []);

  return (
    <div className="flex justify-center gap-8 md:gap-16 mb-16 px-4">
      <div className="text-center">
        <p className="text-4xl font-serif text-warm-brown font-bold transition-all duration-300">
          {storiesCount}
        </p>
        <p className="text-sm font-medium uppercase tracking-wider text-ink/60 mt-1">Stories</p>
      </div>
      <div className="text-center">
        <p className="text-4xl font-serif text-warm-brown font-bold transition-all duration-300">
          {peopleCount}
        </p>
        <p className="text-sm font-medium uppercase tracking-wider text-ink/60 mt-1">People</p>
      </div>
      <div className="text-center">
        <p className="text-4xl font-serif text-warm-brown font-bold transition-all duration-300">
          {placesCount}
        </p>
        <p className="text-sm font-medium uppercase tracking-wider text-ink/60 mt-1">Places</p>
      </div>
    </div>
  );
}
