"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import StoryMap, { StoryLocation } from "./StoryMap";
import ImageCarousel, { CarouselImage } from "./ImageCarousel";
import { ArtGenerator } from "./ArtGenerator";

export interface MapLocationInput {
  name: string;
  query: string;
}

export interface VisualStageProps {
  searchQueries?: string[];
  mapLocations?: MapLocationInput[];
  artPrompt?: string;
  className?: string;
  entities?: Array<{ type: string; name: string }>;
  activeLocation?: string;
  images?: CarouselImage[];
  selectedTab?: "map" | "photos" | "art";
  onTabChange?: (tab: "map" | "photos" | "art") => void;
}

const geocodeCache = new Map<string, StoryLocation | null>();

export function VisualStage({
  searchQueries = [],
  mapLocations = [],
  artPrompt = "",
  className = "",
  entities = [],
  activeLocation,
  images = [],
  selectedTab,
  onTabChange,
}: VisualStageProps) {
  const [userSelectedTab, setUserSelectedTab] = useState<"map" | "photos" | "art" | null>(null);

  const activeTab: "map" | "photos" | "art" =
    selectedTab ??
    userSelectedTab ??
    (mapLocations && mapLocations.length > 0 ? "map" : "photos");

  const setActiveTab = useCallback(
    (tab: "map" | "photos" | "art") => {
      setUserSelectedTab(tab);
      onTabChange?.(tab);
    },
    [onTabChange]
  );

  const [geocodedLocations, setGeocodedLocations] = useState<StoryLocation[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [fetchedPhotos, setFetchedPhotos] = useState<CarouselImage[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);

  useEffect(() => {
    const effectiveLocations: MapLocationInput[] =
      mapLocations && mapLocations.length > 0
        ? mapLocations
        : activeLocation
        ? [{ name: activeLocation, query: activeLocation }]
        : [];

    let isCurrent = true;

    const timer = setTimeout(async () => {
      if (effectiveLocations.length === 0) {
        if (isCurrent) {
          setGeocodedLocations([]);
          setIsGeocoding(false);
        }
        return;
      }

      if (isCurrent) {
        setIsGeocoding(true);
      }

      try {
        const results: StoryLocation[] = [];

        for (const loc of effectiveLocations) {
          const queryText = (loc.query || loc.name || "").trim();
          if (!queryText) continue;

          const cacheKey = queryText.toLowerCase();
          if (geocodeCache.has(cacheKey)) {
            const cached = geocodeCache.get(cacheKey);
            if (cached) {
              results.push(cached);
            }
            continue;
          }

          const res = await fetch("/api/enrichment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "geocode", query: queryText }),
          });

          if (res.ok) {
            const data = await res.json();
            if (
              data.result &&
              typeof data.result.lat === "number" &&
              typeof data.result.lng === "number"
            ) {
              const item: StoryLocation = {
                lat: data.result.lat,
                lng: data.result.lng,
                name: loc.name || data.result.displayName || queryText,
              };
              geocodeCache.set(cacheKey, item);
              results.push(item);
            } else {
              geocodeCache.set(cacheKey, null);
            }
          }
        }

        if (isCurrent) {
          setGeocodedLocations(results);
        }
      } catch {
        if (isCurrent) {
          setGeocodedLocations([]);
        }
      } finally {
        if (isCurrent) {
          setIsGeocoding(false);
        }
      }
    }, 500);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [mapLocations, activeLocation]);

  useEffect(() => {
    let isCurrent = true;

    const timer = setTimeout(async () => {
      if (!searchQueries || searchQueries.length === 0) {
        if (isCurrent) {
          setFetchedPhotos([]);
          setIsLoadingPhotos(false);
        }
        return;
      }

      if (isCurrent) {
        setIsLoadingPhotos(true);
      }

      try {
        const aggregated: CarouselImage[] = [];

        for (const q of searchQueries) {
          const cleanQuery = q.trim();
          if (!cleanQuery) continue;

          const [wikiRes, unsplashRes] = await Promise.allSettled([
            fetch("/api/enrichment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "wikimedia", query: cleanQuery, limit: 4 }),
            }).then((r) => (r.ok ? r.json() : { results: [] })),
            fetch("/api/enrichment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "unsplash", query: cleanQuery, limit: 4 }),
            }).then((r) => (r.ok ? r.json() : { results: [] })),
          ]);

          if (wikiRes.status === "fulfilled" && Array.isArray(wikiRes.value?.results)) {
            for (const item of wikiRes.value.results) {
              aggregated.push({
                url: item.url,
                thumbUrl: item.thumbUrl || item.url,
                title: item.title || item.description || cleanQuery,
                attribution: item.attribution || "Wikimedia Commons",
              });
            }
          }

          if (unsplashRes.status === "fulfilled" && Array.isArray(unsplashRes.value?.results)) {
            for (const item of unsplashRes.value.results) {
              aggregated.push({
                url: item.url,
                thumbUrl: item.thumbUrl || item.url,
                title: item.altDescription || cleanQuery,
                attribution: item.photographer
                  ? `Photo by ${item.photographer} on Unsplash`
                  : "Unsplash",
              });
            }
          }
        }

        if (isCurrent) {
          setFetchedPhotos(aggregated);
        }
      } catch {
        if (isCurrent) {
          setFetchedPhotos([]);
        }
      } finally {
        if (isCurrent) {
          setIsLoadingPhotos(false);
        }
      }
    }, 500);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [searchQueries]);

  const displayedImages = fetchedPhotos.length > 0 ? fetchedPhotos : images;

  return (
    <aside className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-warm-brown/15">
        <h2 className="font-serif text-lg font-bold text-warm-brown">Visual Stage</h2>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-soft-gold/20 text-ink/80 font-medium">
          Live Context
        </span>
      </div>

      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-aged-paper/60 border border-warm-brown/15" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "map"}
          onClick={() => setActiveTab("map")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "map"
              ? "bg-warm-brown text-cream shadow-sm"
              : "text-ink/70 hover:text-ink hover:bg-aged-paper/70"
          }`}
        >
          📍 Map
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "photos"}
          onClick={() => setActiveTab("photos")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "photos"
              ? "bg-warm-brown text-cream shadow-sm"
              : "text-ink/70 hover:text-ink hover:bg-aged-paper/70"
          }`}
        >
          📷 Photos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "art"}
          onClick={() => setActiveTab("art")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "art"
              ? "bg-warm-brown text-cream shadow-sm"
              : "text-ink/70 hover:text-ink hover:bg-aged-paper/70"
          }`}
        >
          🎨 Art
        </button>
      </div>

      <div>
        {activeTab === "map" &&
          (isGeocoding ? (
            <div className="h-64 w-full rounded-2xl bg-aged-paper/40 border border-warm-brown/15 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-warm-brown" />
              <p className="text-xs text-ink/60 font-serif">Pinpointing places on map...</p>
            </div>
          ) : (
            <StoryMap locations={geocodedLocations} />
          ))}

        {activeTab === "photos" &&
          (isLoadingPhotos ? (
            <div className="h-64 w-full rounded-2xl bg-aged-paper/40 border border-warm-brown/15 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-warm-brown" />
              <p className="text-xs text-ink/60 font-serif">Searching archival photos...</p>
            </div>
          ) : (
            <ImageCarousel images={displayedImages} />
          ))}

        {activeTab === "art" && <ArtGenerator initialPrompt={artPrompt} />}
      </div>

      {entities && entities.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-white/60 border border-warm-brown/15">
          {entities.map((entity, i) => (
            <span
              key={i}
              className="text-xs px-2.5 py-1 rounded-full bg-aged-paper border border-warm-brown/20 text-ink font-medium"
            >
              {entity.type === "place" && "📍 "}
              {entity.type === "person" && "👤 "}
              {entity.type === "era" && "⏳ "}
              {entity.type === "event" && "⭐ "}
              {entity.name}
            </span>
          ))}
        </div>
      )}
    </aside>
  );
}

export default VisualStage;
