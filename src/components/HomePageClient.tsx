"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Upload, ScrollText } from "lucide-react";
import { getStories, getEntities, getSuggestedPrompts, StoryWithDetails } from "@/lib/supabase/client";
import { StoryCatalog } from "@/components/catalog/StoryCatalog";
import { SessionStarters } from "@/components/SessionStarters";
import { PromptSuggestions } from "@/components/PromptSuggestions";
import { HomeStats } from "@/components/HomeStats";
import { UserSwitcher } from "@/components/UserSwitcher";
import { useUser } from "@/lib/user/context";
import { USERS } from "@/lib/user/users";
import { Entity, SuggestedPrompt } from "@/types/database";

export function HomePageClient() {
  const { userId } = useUser();
  const [stories, setStories] = useState<StoryWithDetails[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [prompts, setPrompts] = useState<SuggestedPrompt[]>([]);

  // Reload data whenever the active user changes
  useEffect(() => {
    let isMounted = true;
    setStories([]);
    setEntities([]);
    setPrompts([]);

    async function loadData() {
      const [s, e, p] = await Promise.all([
        getStories(undefined, userId).catch(() => [] as StoryWithDetails[]),
        getEntities(undefined, userId).catch(() => [] as Entity[]),
        getSuggestedPrompts(userId).catch(() => [] as SuggestedPrompt[]),
      ]);
      if (isMounted) {
        setStories(s);
        setEntities(e);
        setPrompts(p);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [userId]);

  const peopleCount = entities.filter((e) => e.type === "person").length;
  const placesCount = entities.filter((e) => e.type === "place").length;
  const user = USERS[userId];

  return (
    <main className="min-h-screen bg-cream text-ink">
      {/* Navigation */}
      <nav className="p-6 flex justify-between items-center border-b border-warm-brown/10">
        {/* User Switcher — left side of nav */}
        <UserSwitcher />

        <div className="flex gap-6">
          <Link href="/biography" className="flex items-center gap-2 text-warm-brown hover:text-warm-brown/80 font-medium">
            <ScrollText className="w-4 h-4" />
            Biography
          </Link>
          <Link href="/upload" className="flex items-center gap-2 text-warm-brown hover:text-warm-brown/80 font-medium">
            <Upload className="w-4 h-4" />
            Upload
          </Link>
          <Link href="/memoir" className="flex items-center gap-2 text-warm-brown hover:text-warm-brown/80 font-medium">
            <BookOpen className="w-4 h-4" />
            Memoir
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-warm-brown mb-4 tracking-tight">
            memo<em>random</em>
          </h1>
          <p className="text-xl md:text-2xl text-ink/80 font-serif italic">
            {user.displayName}&apos;s Life Story, Beautifully Told
          </p>
        </header>

        {/* Stats */}
        <HomeStats
          initialStoriesCount={stories.length}
          initialPeopleCount={peopleCount}
          initialPlacesCount={placesCount}
          userId={userId}
        />

        <SessionStarters />

        {/* Prompts */}
        <PromptSuggestions initialPrompts={prompts} userId={userId} />

        {/* Story Catalog */}
        <StoryCatalog initialStories={stories} initialEntities={entities} userId={userId} />
      </div>
    </main>
  );
}
