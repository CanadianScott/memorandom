import { NextRequest, NextResponse } from "next/server";
import { searchWikimediaImages } from "@/lib/enrichment/wikimedia";
import { searchUnsplashPhotos } from "@/lib/enrichment/unsplash";
import { geocodePlace } from "@/lib/enrichment/geocoding";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, query, limit } = body || {};

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    const itemLimit = typeof limit === "number" && limit > 0 ? limit : undefined;

    switch (type) {
      case "wikimedia": {
        const results = await searchWikimediaImages(query.trim(), itemLimit);
        return NextResponse.json({ results });
      }
      case "unsplash": {
        const results = await searchUnsplashPhotos(query.trim(), itemLimit);
        return NextResponse.json({ results });
      }
      case "geocode": {
        const result = await geocodePlace(query.trim());
        return NextResponse.json({
          result,
          results: result ? [result] : [],
        });
      }
      default: {
        return NextResponse.json(
          {
            error: `Invalid type '${type}'. Must be 'wikimedia', 'unsplash', or 'geocode'.`,
          },
          { status: 400 }
        );
      }
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to process enrichment request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
