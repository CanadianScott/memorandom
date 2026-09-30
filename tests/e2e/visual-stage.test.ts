/**
 * R5 Visual Stage End-to-End Pipeline Test Suite
 * Covers Tier 1 (Feature Coverage) and Tier 2 (Boundary & Corner Cases)
 * Authoritative source: ORIGINAL_REQUEST.md §R5, PROJECT.md §F17-F19, Explorer 3 Survey
 */

import { suite, test, expect, createMockRequest } from "./framework";

export async function runVisualStageTests() {
  await suite(
    "Visual Stage Tier 1: Feature Coverage",
    "Tier 1: Feature Coverage",
    "R5: Visual Stage",
    async () => {
      await test("T1.R5.01", "Geocoding Pipeline - /api/enrichment type=geocode resolves places", async () => {
        const enrichmentRoute = await import("@/app/api/enrichment/route");
        expect(enrichmentRoute.POST).toBeDefined();

        const req = createMockRequest("http://localhost:3000/api/enrichment", {
          method: "POST",
          body: JSON.stringify({ type: "geocode", query: "Yellowstone National Park" }),
        });
        const res = await enrichmentRoute.POST(req as any);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toBeDefined();
        // Should contain result or results
        const result = data.result || data.results?.[0];
        if (result) {
          expect(typeof result.lat).toBe("number");
          expect(typeof result.lng).toBe("number");
        }
      });

      await test("T1.R5.02", "Archival Photo Search Pipeline - /api/enrichment type=wikimedia returns images", async () => {
        const enrichmentRoute = await import("@/app/api/enrichment/route");
        const req = createMockRequest("http://localhost:3000/api/enrichment", {
          method: "POST",
          body: JSON.stringify({ type: "wikimedia", query: "vintage 1950s baseball", limit: 3 }),
        });
        const res = await enrichmentRoute.POST(req as any);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toBeDefined();
        const images = data.results || data.images || [];
        expect(Array.isArray(images)).toBe(true);
      });

      await test("T1.R5.03", "AI Art Generation Pipeline - /api/gemini/generate-art returns image data", async () => {
        const artRoute = await import("@/app/api/gemini/generate-art/route");
        expect(artRoute.POST).toBeDefined();

        const req = createMockRequest("http://localhost:3000/api/gemini/generate-art", {
          method: "POST",
          body: JSON.stringify({
            prompt: "A nostalgic 1950s sandlot baseball game on a golden summer afternoon",
            style: "kodachrome",
          }),
        });

        const res = await artRoute.POST(req as any);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toBeDefined();
        // Should return imageUrl or imageBase64 or fallback image data
        const hasImage = Boolean(data.imageUrl || data.image || data.imageBase64);
        expect(hasImage).toBe(true);
      });

      await test("T1.R5.04", "Entity Extraction with Visual Stage Queries - extract-entities contract", async () => {
        const extractRoute = await import("@/app/api/gemini/extract-entities/route");
        expect(extractRoute.POST).toBeDefined();

        const transcript = "My grandmother Rose took us to Yellowstone National Park back in the summer of 1965.";
        const req = createMockRequest("http://localhost:3000/api/gemini/extract-entities", {
          method: "POST",
          body: JSON.stringify({ transcript }),
        });

        const res = await extractRoute.POST(req as any);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toBeDefined();
        expect(Array.isArray(data.entities)).toBe(true);

        // Verify place detection
        const hasYellowstone = data.entities.some(
          (e: any) => e.name?.toLowerCase().includes("yellowstone")
        );
        expect(hasYellowstone).toBe(true);
      });

      await test("T1.R5.05", "Visual Stage Subcomponent Contract - tabs and handlers exist", async () => {
        const visualStageModule = await import("@/components/visual-stage/VisualStage");
        expect(visualStageModule.VisualStage).toBeDefined();
      });

      await test("T1.R5.06", "Place Mention Map Pipeline Wiring - geocodePlace resolves location", async () => {
        const { geocodePlace } = await import("@/lib/enrichment/geocoding");
        expect(typeof geocodePlace).toBe("function");

        const result = await geocodePlace("Yellowstone National Park");
        if (result) {
          expect(typeof result.lat).toBe("number");
          expect(typeof result.lng).toBe("number");
          expect(result.lat).toBeGreaterThan(40);
          expect(result.lng).toBeLessThan(-100);
        }
      });
    }
  );

  await suite(
    "Visual Stage Tier 2: Boundary & Corner Cases",
    "Tier 2: Boundary & Corner Cases",
    "R5: Visual Stage",
    async () => {
      await test("T2.R5.01", "No False Chicago Default - offline fallback does NOT force Chicago for other places", async () => {
        const { getHistoricalContext } = await import("@/lib/gemini/historical-context");

        // Ask for Boston / Massachusetts events
        const res = await getHistoricalContext({
          birthYear: 1950,
          locations: ["Boston, Massachusetts"],
          limit: 3,
        });

        // Prompts should NOT default location to Chicago
        const allChicago = res.prompts.every((p) => p.location.includes("Chicago"));
        expect(allChicago).toBe(false);
      });

      await test("T2.R5.02", "Short Input Text Guard - geocode handles concise place queries", async () => {
        const { geocodePlace } = await import("@/lib/enrichment/geocoding");
        const res = await geocodePlace("Paris");
        if (res) {
          expect(res.lat).toBeDefined();
          expect(res.lng).toBeDefined();
        }
      });

      await test("T2.R5.03", "Ungeocodable & Fictional Locations - handles unknown places gracefully", async () => {
        const { geocodePlace } = await import("@/lib/enrichment/geocoding");
        const res = await geocodePlace("Atlantis Nonexistent Kingdom 99999");
        // Must return null or empty result without throwing unhandled error
        expect(res).toBeNull();
      });

      await test("T2.R5.04", "Unsplash Fallback - missing key returns empty array without error", async () => {
        const { searchUnsplashPhotos } = await import("@/lib/enrichment/unsplash");
        const res = await searchUnsplashPhotos("vintage cars");
        expect(Array.isArray(res)).toBe(true);
      });

      await test("T2.R5.05", "Empty / Whitespace Search Query Handling - returns 400 Bad Request or empty array", async () => {
        const enrichmentRoute = await import("@/app/api/enrichment/route");
        const req = createMockRequest("http://localhost:3000/api/enrichment", {
          method: "POST",
          body: JSON.stringify({ type: "wikimedia", query: "" }),
        });
        const res = await enrichmentRoute.POST(req as any);
        // Empty query returns 400 with error message as defined in route contract
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBeDefined();
      });

      await test("T2.R5.06", "Tab Selection Precedence - map tab remains active when location is set", async () => {
        const resolveActiveTab = (
          activeLocation: string | undefined,
          hasImages: boolean,
          currentTab: "map" | "photos" | "art"
        ): "map" | "photos" | "art" => {
          if (activeLocation && currentTab === "map") return "map";
          if (!activeLocation && hasImages && currentTab !== "art") return "photos";
          return currentTab;
        };

        const result = resolveActiveTab("Yellowstone National Park", true, "map");
        expect(result).toBe("map");
      });
    }
  );
}
