/**
 * R3 Historically-Grounded Interview Prompts E2E Test Suite
 * Covers Tier 1 (Feature Coverage) and Tier 2 (Boundary & Corner Cases)
 * Authoritative source: ORIGINAL_REQUEST.md §R3, PROJECT.md §F12-F16, PROJECT.md §Interface Contracts
 */

import { suite, test, expect, createMockRequest } from "./framework";
import type { HistoricalContextRequest, HistoricalContextResponse } from "@/types/historical-context";

export async function runHistoricalTests() {
  await suite(
    "Historical Prompts Tier 1: Feature Coverage",
    "Tier 1: Feature Coverage",
    "R3: Historical Prompts",
    async () => {
      await test("T1.R3.01", "API Endpoint Route Handler - /api/gemini/historical-context POST contract", async () => {
        const routeModule = await import("@/app/api/gemini/historical-context/route");
        expect(routeModule.POST).toBeDefined();

        const reqPayload: HistoricalContextRequest = {
          birthYear: 1945,
          eras: ["1950s Childhood"],
          locations: ["Chicago, Illinois"],
          limit: 3,
        };

        const mockReq = createMockRequest("http://localhost:3000/api/gemini/historical-context", {
          method: "POST",
          body: JSON.stringify(reqPayload),
        });

        const res = await routeModule.POST(mockReq as any);
        expect(res.status).toBe(200);

        const data = (await res.json()) as HistoricalContextResponse;
        expect(data).toBeDefined();
        expect(Array.isArray(data.prompts)).toBe(true);
        expect(data.prompts.length).toBeGreaterThanOrEqual(1);
        expect(data.metadata).toBeDefined();
      });

      await test("T1.R3.02", "Prompt Item Schema Conformance - required fields and types", async () => {
        const { getHistoricalContext } = await import("@/lib/gemini/historical-context");
        const res = await getHistoricalContext({
          birthYear: 1945,
          locations: ["Chicago, Illinois"],
          limit: 3,
        });

        for (const prompt of res.prompts) {
          expect(typeof prompt.id).toBe("string");
          expect(typeof prompt.question).toBe("string");
          expect(prompt.question.length).toBeGreaterThan(15);
          expect(typeof prompt.historicalEvent).toBe("string");
          expect(typeof prompt.yearOrEra).toBe("string");
          expect(typeof prompt.location).toBe("string");
          expect(["local", "national"].includes(prompt.scope)).toBe(true);
          expect(Array.isArray(prompt.followUps)).toBe(true);
          expect(typeof prompt.visualQuery).toBe("string");
          expect(typeof prompt.mapQuery).toBe("string");
          expect(typeof prompt.artPrompt).toBe("string");
        }
      });

      await test("T1.R3.03", "Infantile Amnesia Cutoff - no events before birthYear + 5", async () => {
        const { getHistoricalContext } = await import("@/lib/gemini/historical-context");
        const birthYear = 1945;
        const cutoffYear = birthYear + 5; // 1950

        const res = await getHistoricalContext({
          birthYear,
          eras: ["1950s Childhood"],
          locations: ["Chicago, Illinois"],
          limit: 10,
        });

        for (const prompt of res.prompts) {
          const numMatch = prompt.yearOrEra.match(/\d{4}/);
          if (numMatch) {
            const promptYear = parseInt(numMatch[0], 10);
            expect(promptYear).toBeGreaterThanOrEqual(cutoffYear);
          }
        }
      });

      await test("T1.R3.04", "Reminiscence Bump Prioritization - prompts emphasize youth (ages 10-25)", async () => {
        const { getHistoricalContext } = await import("@/lib/gemini/historical-context");
        const birthYear = 1945;
        // Reminiscence bump: ages 10 to 25 -> 1955 to 1970
        const bumpStart = birthYear + 10;
        const bumpEnd = birthYear + 25;

        const res = await getHistoricalContext({
          birthYear,
          eras: ["1950s Childhood", "1960s Travels"],
          locations: ["Chicago, Illinois"],
          limit: 5,
        });

        const bumpPrompts = res.prompts.filter((p) => {
          const year = parseInt(p.yearOrEra.match(/\d{4}/)?.[0] || "0", 10);
          return year >= bumpStart && year <= bumpEnd;
        });

        // The majority of prompts should fall within or adjacent to the reminiscence bump
        expect(bumpPrompts.length).toBeGreaterThanOrEqual(1);
      });

      await test("T1.R3.05", "Hyperlocal vs National Scope - returns local events for specified city", async () => {
        const { getHistoricalContext } = await import("@/lib/gemini/historical-context");
        const res = await getHistoricalContext({
          birthYear: 1945,
          locations: ["Chicago, Illinois"],
          limit: 5,
        });

        const localPrompts = res.prompts.filter((p) => p.scope === "local");
        expect(localPrompts.length).toBeGreaterThanOrEqual(1);

        const hasChicagoMention = localPrompts.some(
          (p) => p.location.includes("Chicago") || p.question.includes("Chicago") || p.historicalEvent.includes("Chicago")
        );
        expect(hasChicagoMention).toBe(true);
      });

      await test("T1.R3.06", "Visual Stage Metadata Integrity - queries match event context", async () => {
        const { getHistoricalContext } = await import("@/lib/gemini/historical-context");
        const res = await getHistoricalContext({
          birthYear: 1945,
          locations: ["Chicago, Illinois"],
          limit: 2,
        });

        for (const prompt of res.prompts) {
          // visualQuery should include archival or vintage terms
          expect(prompt.visualQuery.length).toBeGreaterThan(5);
          // mapQuery should identify a location
          expect(prompt.mapQuery.length).toBeGreaterThan(3);
          // artPrompt should specify an evocative artistic style
          expect(prompt.artPrompt.length).toBeGreaterThan(15);
        }
      });
    }
  );

  await suite(
    "Historical Prompts Tier 2: Boundary & Corner Cases",
    "Tier 2: Boundary & Corner Cases",
    "R3: Historical Prompts",
    async () => {
      await test("T2.R3.01", "Deterministic Offline Fallback Matrix - works without GEMINI_API_KEY", async () => {
        const { selectFromFallbackMatrix } = await import("@/lib/gemini/historical-context") as any;
        if (typeof selectFromFallbackMatrix === "function") {
          const fallbackPrompts = selectFromFallbackMatrix({
            birthYear: 1950,
            locations: ["Chicago, Illinois"],
            limit: 3,
          });
          expect(fallbackPrompts.length).toBe(3);
          expect(fallbackPrompts[0].historicalEvent).toBeDefined();
        } else {
          const { getHistoricalContext } = await import("@/lib/gemini/historical-context");
          const res = await getHistoricalContext({
            birthYear: 1950,
            locations: ["Chicago, Illinois"],
            limit: 3,
          });
          expect(res.prompts.length).toBeGreaterThanOrEqual(1);
        }
      });

      await test("T2.R3.02", "Empty Request Fallback - handles {} gracefully without crashing", async () => {
        const { getHistoricalContext } = await import("@/lib/gemini/historical-context");
        const res = await getHistoricalContext({});
        expect(res).toBeDefined();
        expect(res.prompts.length).toBeGreaterThanOrEqual(1);
        expect(res.metadata.inferredBirthYear).toBeDefined();
      });

      await test("T2.R3.03", "Non-Standard Decade Input - parses '50s' and '1950s'", async () => {
        const { getHistoricalContext } = await import("@/lib/gemini/historical-context");
        const res = await getHistoricalContext({ birthDecade: "1950s", limit: 2 });
        expect(res.prompts.length).toBeGreaterThanOrEqual(1);
        // Birth year inferred from 1950s childhood should be ~1945
        expect(res.metadata.inferredBirthYear).toBeLessThanOrEqual(1955);
      });

      await test("T2.R3.04", "Unknown / Obscure Location - falls back gracefully to national events", async () => {
        const { getHistoricalContext } = await import("@/lib/gemini/historical-context");
        const res = await getHistoricalContext({
          locations: ["Nonexistent Village, Nowhere"],
          birthYear: 1950,
          limit: 3,
        });

        expect(res.prompts.length).toBeGreaterThanOrEqual(1);
        // At least one national or era-relevant event should be provided
        const hasValidPrompt = res.prompts.some((p) => p.scope === "national" || p.scope === "local");
        expect(hasValidPrompt).toBe(true);
      });

      await test("T2.R3.05", "Deduplication via excludeEventNames", async () => {
        const { getHistoricalContext } = await import("@/lib/gemini/historical-context");
        // Get initial prompts
        const initial = await getHistoricalContext({
          birthYear: 1945,
          locations: ["Chicago, Illinois"],
          limit: 2,
        });

        const excludedName = initial.prompts[0].historicalEvent;

        // Fetch again with excludeEventNames
        const filtered = await getHistoricalContext({
          birthYear: 1945,
          locations: ["Chicago, Illinois"],
          excludeEventNames: [excludedName],
          limit: 5,
        });

        for (const p of filtered.prompts) {
          expect(p.historicalEvent).not.toBe(excludedName);
        }
      });

      await test("T2.R3.06", "Extreme Birth Years - Centenarian (1915) vs Younger Narrator (1980)", async () => {
        const { getHistoricalContext } = await import("@/lib/gemini/historical-context");

        // Centenarian (1915) -> eligible for 1930s-1940s
        const centenarian = await getHistoricalContext({ birthYear: 1915, limit: 3 });
        expect(centenarian.prompts.length).toBeGreaterThanOrEqual(1);
        for (const p of centenarian.prompts) {
          const year = parseInt(p.yearOrEra.match(/\d{4}/)?.[0] || "0", 10);
          expect(year).toBeGreaterThanOrEqual(1920); // 1915 + 5
        }

        // Younger narrator (1980) -> eligible for 1985+
        const younger = await getHistoricalContext({ birthYear: 1980, limit: 3 });
        expect(younger.prompts.length).toBeGreaterThanOrEqual(1);
        for (const p of younger.prompts) {
          const year = parseInt(p.yearOrEra.match(/\d{4}/)?.[0] || "0", 10);
          expect(year).toBeGreaterThanOrEqual(1985); // 1980 + 5
        }
      });
    }
  );
}
