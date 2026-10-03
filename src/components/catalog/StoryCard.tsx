"use client";

import React, { useState } from "react";
import { User, MapPin, Clock, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { StoryWithDetails } from "@/lib/supabase/client";
import { Entity } from "@/types/database";

export interface StoryCardProps {
  story: StoryWithDetails;
  onSelectEntity?: (entity: Entity) => void;
  activeEntityId?: string | null;
}

export function StoryCard({
  story,
  onSelectEntity,
  activeEntityId,
}: StoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract unique entities linked to this story
  const linkedEntities: Entity[] = React.useMemo(() => {
    const list: Entity[] = [];
    const seen = new Set<string>();

    for (const se of story.story_entities || []) {
      if (se.entities && !seen.has(se.entities.id)) {
        seen.add(se.entities.id);
        list.push(se.entities);
      }
    }

    // Merge any era tags that weren't captured as entities
    for (const tag of story.era_tags || []) {
      const alreadyHas = list.some(
        (e) => e.name.toLowerCase() === tag.toLowerCase()
      );
      if (!alreadyHas && !seen.has(tag)) {
        seen.add(tag);
        list.push({
          id: `era-${tag.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          name: tag,
          type: "era",
          metadata: {},
          mention_count: 1,
          first_mentioned_at: story.created_at,
          created_at: story.created_at,
          updated_at: story.created_at,
        });
      }
    }

    return list;
  }, [story]);

  const formattedDate = new Date(story.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const title = story.title?.trim() || "Untitled Story";
  const displayText = story.summary || story.transcript || "";
  const isLongText = displayText.length > 200;

  const renderTagChip = (entity: Entity) => {
    const isSelected =
      activeEntityId === entity.id ||
      activeEntityId?.toLowerCase() === entity.name.toLowerCase();

    let icon = <Sparkles className="w-3 h-3 shrink-0" />;
    let colorStyles = "bg-warm-brown/10 text-warm-brown border-warm-brown/20 hover:bg-warm-brown/15";

    if (entity.type === "person") {
      icon = <User className="w-3 h-3 text-amber-700 shrink-0" />;
      colorStyles = "bg-amber-50 text-amber-900 border-amber-200/90 hover:bg-amber-100 hover:border-amber-300";
    } else if (entity.type === "place") {
      icon = <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />;
      colorStyles = "bg-emerald-50 text-emerald-900 border-emerald-200/90 hover:bg-emerald-100 hover:border-emerald-300";
    } else if (entity.type === "era") {
      icon = <Clock className="w-3 h-3 text-purple-700 shrink-0" />;
      colorStyles = "bg-purple-50 text-purple-900 border-purple-200/90 hover:bg-purple-100 hover:border-purple-300";
    } else if (entity.type === "event") {
      icon = <Sparkles className="w-3 h-3 text-rose-700 shrink-0" />;
      colorStyles = "bg-rose-50 text-rose-900 border-rose-200/90 hover:bg-rose-100 hover:border-rose-300";
    }

    const selectedStyles = isSelected
      ? "ring-2 ring-warm-brown font-semibold shadow-xs bg-warm-brown/20 border-warm-brown/40"
      : "";

    return (
      <button
        key={entity.id}
        type="button"
        onClick={() => onSelectEntity?.(entity)}
        className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 border transition-all cursor-pointer ${colorStyles} ${selectedStyles}`}
        title={`Filter stories by ${entity.name} (${entity.type})`}
      >
        {icon}
        <span className="truncate max-w-[160px]">{entity.name}</span>
      </button>
    );
  };

  return (
    <article className="rounded-2xl border border-warm-brown/15 bg-white/75 p-6 shadow-xs backdrop-blur-xs flex flex-col justify-between hover:border-warm-brown/30 hover:shadow-sm transition-all duration-200">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="font-serif font-bold text-lg md:text-xl text-ink leading-snug tracking-tight">
            {title}
          </h3>
          <span className="text-xs font-medium px-2.5 py-1 bg-warm-brown/10 text-warm-brown rounded-full whitespace-nowrap shrink-0">
            {formattedDate}
          </span>
        </div>

        {/* Story Content — prefer narrative summary over raw transcript */}
        <p
          className={`text-ink/75 text-sm leading-relaxed ${
            isExpanded ? "" : "line-clamp-3"
          }`}
        >
          {displayText}
        </p>

        {/* Expand / Collapse Button */}
        {isLongText && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="text-xs font-semibold text-warm-brown hover:text-warm-brown/80 mt-2 inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            {isExpanded ? (
              <>
                Show less <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Read more <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Entity Tags Section */}
      {linkedEntities.length > 0 && (
        <div className="mt-5 pt-4 border-t border-warm-brown/10">
          <div className="flex flex-wrap gap-1.5 items-center">
            {linkedEntities.map(renderTagChip)}
          </div>
        </div>
      )}
    </article>
  );
}
