"use client";

import dynamic from "next/dynamic";
import React from "react";

export interface StoryLocation {
  lat: number;
  lng: number;
  name: string;
}

export interface StoryMapProps {
  locations: StoryLocation[];
  className?: string;
}

const DynamicStoryMap = dynamic<StoryMapProps>(
  () => import("./StoryMapInner"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full rounded-2xl bg-aged-paper/40 border border-warm-brown/15 flex items-center justify-center">
        <p className="text-sm text-ink/50 font-serif">Loading map...</p>
      </div>
    ),
  }
);

export const StoryMap = DynamicStoryMap;
export default DynamicStoryMap;
