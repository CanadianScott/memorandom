"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Clock, MapPin, Users, Calendar, Tag, X, CheckCircle } from "lucide-react";
import { StoryWithDetails, getStories, getEntities, deleteStory } from "@/lib/supabase/client";
import { Entity } from "@/types/database";
import { StoryCard } from "./StoryCard";

export type SortOption = "recency" | "location" | "people" | "timeline";

export interface StoryCatalogProps {
  initialStories: StoryWithDetails[];
  initialEntities?: Entity[];
}

interface StoryGroup {
  id: string;
  title: string;
  subtitle?: string;
  iconType: "place" | "person" | "era";
  sortOrder?: number;
  stories: StoryWithDetails[];
}

export function StoryCatalog({
  initialStories,
  initialEntities = [],
}: StoryCatalogProps) {
  const router = useRouter();
  const [stories, setStories] = useState<StoryWithDetails[]>(initialStories);
  const [entities, setEntities] = useState<Entity[]>(initialEntities);
  const [sortBy, setSortBy] = useState<SortOption>("recency");
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [deleteToastMessage, setDeleteToastMessage] = useState<string | null>(null);

  const handleDeleteStory = async (storyId: string) => {
    try {
      await deleteStory(storyId);
      setStories((prev) => prev.filter((s) => s.id !== storyId));
      setDeleteToastMessage("Story deleted successfully.");
      setTimeout(() => setDeleteToastMessage(null), 3500);

      // Notify reactive components (e.g. HomeStats)
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("memorandom:story-deleted", { detail: { storyId } })
        );
      }

      try {
        router.refresh();
      } catch {}
    } catch (err) {
      console.error("Failed to delete story:", err);
    }
  };

  // Synchronize client-side with local storage / Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function refreshCatalog() {
      try {
        const [freshStories, freshEntities] = await Promise.all([
          getStories(),
          getEntities(),
        ]);
        if (isMounted) {
          if (Array.isArray(freshStories)) {
            setStories(freshStories);
          }
          if (Array.isArray(freshEntities) && freshEntities.length > 0) {
            setEntities(freshEntities);
          }
        }
      } catch (err) {
        console.warn("StoryCatalog: client refresh error", err);
      }
    }
    refreshCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter stories when an entity is selected
  const filteredStories = useMemo(() => {
    if (!selectedEntity) {
      return stories;
    }

    const targetId = selectedEntity.id;
    const targetName = selectedEntity.name.toLowerCase().trim();

    return stories.filter((story) => {
      // 1. Check explicit linked story_entities
      const matchesLinked = story.story_entities?.some((se) => {
        if (se.entity_id === targetId) return true;
        if (se.entities?.id === targetId) return true;
        if (se.entities?.name.toLowerCase().trim() === targetName) return true;
        return false;
      });
      if (matchesLinked) return true;

      // 2. Check era_tags
      const matchesEra = story.era_tags?.some(
        (tag) => tag.toLowerCase().trim() === targetName
      );
      if (matchesEra) return true;

      // 3. Fallback: check transcript or title mention
      if (
        story.title?.toLowerCase().includes(targetName) ||
        story.transcript?.toLowerCase().includes(targetName)
      ) {
        return true;
      }

      return false;
    });
  }, [stories, selectedEntity]);

  // Sort: Recency (flat list sorted by created_at descending)
  const storiesSortedByRecency = useMemo(() => {
    return [...filteredStories].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [filteredStories]);

  // Sort: Location (grouped by place entities)
  const groupedByLocation = useMemo<StoryGroup[]>(() => {
    const groupMap = new Map<string, StoryGroup>();
    const unlocatedStories: StoryWithDetails[] = [];

    for (const story of filteredStories) {
      const placeEntities: Entity[] = [];
      const seenPlaceIds = new Set<string>();

      for (const se of story.story_entities || []) {
        if (se.entities && se.entities.type === "place" && !seenPlaceIds.has(se.entities.id)) {
          seenPlaceIds.add(se.entities.id);
          placeEntities.push(se.entities);
        }
      }

      if (placeEntities.length === 0) {
        unlocatedStories.push(story);
      } else {
        for (const place of placeEntities) {
          const key = place.id;
          if (!groupMap.has(key)) {
            const context =
              typeof place.metadata?.context === "string"
                ? place.metadata.context
                : typeof place.metadata?.location === "string"
                ? place.metadata.location
                : undefined;

            groupMap.set(key, {
              id: key,
              title: place.name,
              subtitle: context,
              iconType: "place",
              stories: [],
            });
          }
          groupMap.get(key)!.stories.push(story);
        }
      }
    }

    const result = Array.from(groupMap.values()).sort(
      (a, b) => b.stories.length - a.stories.length || a.title.localeCompare(b.title)
    );

    if (unlocatedStories.length > 0) {
      result.push({
        id: "unspecified-locations",
        title: "Other Locations",
        subtitle: "Memories without specific location tags",
        iconType: "place",
        stories: unlocatedStories,
      });
    }

    return result;
  }, [filteredStories]);

  // Sort: People (grouped by person entities)
  const groupedByPeople = useMemo<StoryGroup[]>(() => {
    const groupMap = new Map<string, StoryGroup>();
    const soloStories: StoryWithDetails[] = [];

    for (const story of filteredStories) {
      const personEntities: Entity[] = [];
      const seenPersonIds = new Set<string>();

      for (const se of story.story_entities || []) {
        if (se.entities && se.entities.type === "person" && !seenPersonIds.has(se.entities.id)) {
          seenPersonIds.add(se.entities.id);
          personEntities.push(se.entities);
        }
      }

      if (personEntities.length === 0) {
        soloStories.push(story);
      } else {
        for (const person of personEntities) {
          const key = person.id;
          if (!groupMap.has(key)) {
            const relationship =
              typeof person.metadata?.relationship === "string"
                ? person.metadata.relationship
                : undefined;

            groupMap.set(key, {
              id: key,
              title: person.name,
              subtitle: relationship,
              iconType: "person",
              stories: [],
            });
          }
          groupMap.get(key)!.stories.push(story);
        }
      }
    }

    const result = Array.from(groupMap.values()).sort(
      (a, b) => b.stories.length - a.stories.length || a.title.localeCompare(b.title)
    );

    if (soloStories.length > 0) {
      result.push({
        id: "solo-memories",
        title: "Solo / Other Memories",
        subtitle: "Stories not mentioning specific people",
        iconType: "person",
        stories: soloStories,
      });
    }

    return result;
  }, [filteredStories]);

  // Sort: Timeline (chronological by era/decade)
  const groupedByTimeline = useMemo<StoryGroup[]>(() => {
    const groupMap = new Map<string, StoryGroup>();
    const undatedStories: StoryWithDetails[] = [];

    for (const story of filteredStories) {
      // Determine era or decade info
      let decadeLabel: string | null = null;
      let sortYear = 9999;
      let eraSubtitle: string | undefined = undefined;

      // 1. Look for era entities
      for (const se of story.story_entities || []) {
        if (se.entities && se.entities.type === "era") {
          eraSubtitle = se.entities.name;
          const yearsStr = String(se.entities.metadata?.years || "");
          const matchYears = yearsStr.match(/(\d{4})/);
          if (matchYears) {
            const yr = parseInt(matchYears[1], 10);
            sortYear = yr;
            decadeLabel = `${Math.floor(yr / 10) * 10}s`;
            break;
          }
          const matchName = se.entities.name.match(/(\d{4})/);
          if (matchName) {
            const yr = parseInt(matchName[1], 10);
            sortYear = yr;
            decadeLabel = `${Math.floor(yr / 10) * 10}s`;
            break;
          }
        }
      }

      // 2. Look for era tags
      if (!decadeLabel) {
        for (const tag of story.era_tags || []) {
          const matchTag = tag.match(/(\d{4})/);
          if (matchTag) {
            const yr = parseInt(matchTag[1], 10);
            sortYear = yr;
            decadeLabel = `${Math.floor(yr / 10) * 10}s`;
            eraSubtitle = tag;
            break;
          }
        }
      }

      // 3. Look for years in title
      if (!decadeLabel) {
        const fullText = `${story.title || ""} ${story.transcript || ""}`;
        const matchFull = fullText.match(/\b(19\d{2}|20\d{2})\b/);
        if (matchFull) {
          const yr = parseInt(matchFull[1], 10);
          sortYear = yr;
          decadeLabel = `${Math.floor(yr / 10) * 10}s`;
        } else {
          const matchApostrophe = fullText.match(/'([4-9]\d)\b/);
          if (matchApostrophe) {
            const yr = 1900 + parseInt(matchApostrophe[1], 10);
            sortYear = yr;
            decadeLabel = `${Math.floor(yr / 10) * 10}s`;
          }
        }
      }

      if (decadeLabel) {
        const key = decadeLabel;
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            id: key,
            title: key,
            subtitle: eraSubtitle,
            iconType: "era",
            sortOrder: sortYear,
            stories: [],
          });
        }
        groupMap.get(key)!.stories.push(story);
      } else {
        undatedStories.push(story);
      }
    }

    // Sort timeline groups chronologically ascending (earliest decades first)
    const result = Array.from(groupMap.values()).sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );

    if (undatedStories.length > 0) {
      result.push({
        id: "undated-timeline",
        title: "Undated / Other Eras",
        subtitle: "Stories without specific era tags",
        iconType: "era",
        sortOrder: 99999,
        stories: undatedStories,
      });
    }

    return result;
  }, [filteredStories]);

  const handleSelectEntity = (entity: Entity) => {
    if (
      selectedEntity?.id === entity.id ||
      selectedEntity?.name.toLowerCase() === entity.name.toLowerCase()
    ) {
      setSelectedEntity(null);
    } else {
      setSelectedEntity(entity);
    }
  };

  return (
    <section aria-labelledby="story-catalog-heading" className="w-full">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2
            id="story-catalog-heading"
            className="text-2xl md:text-3xl font-serif font-bold text-warm-brown tracking-tight"
          >
            Story Catalog
          </h2>
          <p className="text-sm text-ink/70 font-sans mt-1">
            Displaying all {filteredStories.length} {filteredStories.length === 1 ? "story" : "stories"}
            {selectedEntity ? ` mentioning ${selectedEntity.name}` : ""}
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white/70 border border-warm-brown/15 rounded-2xl shadow-2xs backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setSortBy("recency")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              sortBy === "recency"
                ? "bg-warm-brown text-white shadow-xs font-semibold"
                : "text-ink/70 hover:text-ink hover:bg-warm-brown/5"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Recency
          </button>

          <button
            type="button"
            onClick={() => setSortBy("location")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              sortBy === "location"
                ? "bg-warm-brown text-white shadow-xs font-semibold"
                : "text-ink/70 hover:text-ink hover:bg-warm-brown/5"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Location
          </button>

          <button
            type="button"
            onClick={() => setSortBy("people")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              sortBy === "people"
                ? "bg-warm-brown text-white shadow-xs font-semibold"
                : "text-ink/70 hover:text-ink hover:bg-warm-brown/5"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            People
          </button>

          <button
            type="button"
            onClick={() => setSortBy("timeline")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              sortBy === "timeline"
                ? "bg-warm-brown text-white shadow-xs font-semibold"
                : "text-ink/70 hover:text-ink hover:bg-warm-brown/5"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Timeline
          </button>
        </div>
      </div>

      {/* Quick Entity Filter Chips */}
      {entities.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-semibold text-ink/50 uppercase tracking-wider whitespace-nowrap">
            Filter by:
          </span>
          {entities.map((entity) => {
            const isSelected = selectedEntity?.id === entity.id;
            return (
              <button
                key={entity.id}
                type="button"
                onClick={() => handleSelectEntity(entity)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap inline-flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-warm-brown text-white border-warm-brown shadow-2xs font-semibold"
                    : "bg-white/80 text-ink/75 hover:bg-white hover:text-ink border-warm-brown/15"
                }`}
              >
                {entity.type === "person" && <Users className="w-3 h-3" />}
                {entity.type === "place" && <MapPin className="w-3 h-3" />}
                {entity.type === "era" && <Calendar className="w-3 h-3" />}
                {entity.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Filter Banner */}
      {selectedEntity && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 mb-8 rounded-2xl bg-warm-brown/10 border border-warm-brown/20 text-ink animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-warm-brown/15 flex items-center justify-center text-warm-brown shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">
                Filtered by{" "}
                <span className="font-bold text-warm-brown">{selectedEntity.name}</span>
                <span className="text-xs text-ink/60 ml-1.5 uppercase tracking-wider font-semibold">
                  ({selectedEntity.type})
                </span>
              </p>
              <p className="text-xs text-ink/65">
                Showing {filteredStories.length}{" "}
                {filteredStories.length === 1 ? "story" : "stories"} linked to this entity
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedEntity(null)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/90 hover:bg-white text-warm-brown border border-warm-brown/25 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all hover:shadow-xs"
            aria-label="Clear active filter"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filter
          </button>
        </div>
      )}

      {/* Content Rendering based on Sort Option */}
      {filteredStories.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white/60 border border-warm-brown/15 border-dashed">
          <p className="text-lg font-serif italic text-ink/70 mb-3">
            {selectedEntity
              ? `No stories found mentioning "${selectedEntity.name}".`
              : "No stories recorded yet. Tap a card above to begin your first interview."}
          </p>
          {selectedEntity && (
            <button
              type="button"
              onClick={() => setSelectedEntity(null)}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-warm-brown text-white hover:bg-warm-brown/90 cursor-pointer shadow-xs transition-colors"
            >
              Show All Stories
            </button>
          )}
        </div>
      ) : sortBy === "recency" ? (
        /* Recency: Flat 2-Column Responsive Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {storiesSortedByRecency.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onSelectEntity={handleSelectEntity}
              activeEntityId={selectedEntity?.id}
              onDeleteStory={handleDeleteStory}
            />
          ))}
        </div>
      ) : sortBy === "location" ? (
        /* Location: Grouped by Place Entity */
        <div className="space-y-10">
          {groupedByLocation.map((group) => (
            <div key={group.id} className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-warm-brown/15">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-xl text-ink">
                      {group.title}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-warm-brown/10 text-warm-brown">
                      {group.stories.length} {group.stories.length === 1 ? "story" : "stories"}
                    </span>
                  </div>
                  {group.subtitle && (
                    <p className="text-xs text-ink/60 mt-0.5">{group.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {group.stories.map((story) => (
                  <StoryCard
                    key={`${group.id}-${story.id}`}
                    story={story}
                    onSelectEntity={handleSelectEntity}
                    activeEntityId={selectedEntity?.id}
                    onDeleteStory={handleDeleteStory}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : sortBy === "people" ? (
        /* People: Grouped by Person Entity */
        <div className="space-y-10">
          {groupedByPeople.map((group) => (
            <div key={group.id} className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-warm-brown/15">
                <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-xl text-ink">
                      {group.title}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-warm-brown/10 text-warm-brown">
                      {group.stories.length} {group.stories.length === 1 ? "story" : "stories"}
                    </span>
                  </div>
                  {group.subtitle && (
                    <p className="text-xs text-ink/60 mt-0.5">{group.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {group.stories.map((story) => (
                  <StoryCard
                    key={`${group.id}-${story.id}`}
                    story={story}
                    onSelectEntity={handleSelectEntity}
                    activeEntityId={selectedEntity?.id}
                    onDeleteStory={handleDeleteStory}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Timeline: Chronological by Era/Decade */
        <div className="space-y-10">
          {groupedByTimeline.map((group) => (
            <div key={group.id} className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-warm-brown/15">
                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-xl text-ink">
                      {group.title}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-warm-brown/10 text-warm-brown">
                      {group.stories.length} {group.stories.length === 1 ? "story" : "stories"}
                    </span>
                  </div>
                  {group.subtitle && (
                    <p className="text-xs text-ink/60 mt-0.5">{group.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {group.stories.map((story) => (
                  <StoryCard
                    key={`${group.id}-${story.id}`}
                    story={story}
                    onSelectEntity={handleSelectEntity}
                    activeEntityId={selectedEntity?.id}
                    onDeleteStory={handleDeleteStory}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Feedback Toast */}
      {deleteToastMessage && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-warm-brown text-white text-sm font-medium shadow-xl flex items-center gap-2.5 animate-fadeIn border border-white/20"
        >
          <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{deleteToastMessage}</span>
        </aside>
      )}
    </section>
  );
}
