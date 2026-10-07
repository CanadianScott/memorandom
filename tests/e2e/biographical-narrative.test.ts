/**
 * Biographical Narrative Synthesis & Persistence E2E Test Suite
 * Tests that oral history transcripts are converted into third-person biographical narratives
 * and that raw transcripts are NEVER displayed as the story narrative on the front page.
 */

import { suite, test, expect } from "./framework";
import {
  generateBiographicalNarrative,
  synthesizeBiographicalFallback,
} from "@/lib/gemini/summarize";
import { POST as summarizeRoute } from "@/app/api/gemini/summarize/route";
import { saveStoryFromTranscript } from "@/lib/interview/session";
import { NextRequest } from "next/server";

export async function runBiographicalNarrativeTests() {
  await suite(
    "Biographical Narrative Synthesis & Story Persistence",
    "Tier 1: Feature Coverage",
    "R1: Story Catalog",
    async () => {
      await test(
        "T.BN.01",
        "Filler Removal & Third-Person Transformation - cleans verbal clutter and converts to third-person prose",
        async () => {
          const rawSpoken =
            "Um, well, in 1965 my dad bought an old station wagon, you know, and we drove up to Waterton. It was cold in the morning and we saw three elk by the lake. I loved watching the water.";

          const result = synthesizeBiographicalFallback(rawSpoken, "Trip to Waterton");

          expect(result).toBeDefined();
          expect(typeof result.title).toBe("string");
          expect(typeof result.summary).toBe("string");

          // Must not contain verbal clutter
          expect(result.summary.toLowerCase().includes("um")).toBe(false);
          expect(result.summary.toLowerCase().includes("you know")).toBe(false);

          // Must be third person past tense
          expect(result.summary.includes("Blair") || result.summary.includes("He") || result.summary.includes("his")).toBe(true);
          expect(result.summary.includes("his father")).toBe(true);

          // Title must be evocative
          expect(result.title).toBe("Trip to Waterton");
        }
      );

      await test(
        "T.BN.02",
        "Pronoun Perspective Shift - converts I/my/we/our into third-person narrative",
        async () => {
          const rawTranscript =
            "I remember when I bought my first airplane in Lethbridge. My wife Robin and I were so excited. We flew over the coulees together.";

          const result = synthesizeBiographicalFallback(rawTranscript, "Buying the Airplane");

          // Must not start with first-person "I remember"
          expect(result.summary.includes("Blair remembered")).toBe(true);
          expect(result.summary.includes("his first airplane")).toBe(true);
          expect(result.summary.includes("His wife Robin") || result.summary.includes("his wife Robin")).toBe(true);
        }
      );

      await test(
        "T.BN.03",
        "Title Derivation - generates evocative title from year or topic, avoids generic session names",
        async () => {
          const rawTranscript =
            "We spent the whole summer of 1972 hiking in Glacier National Park. The peaks were dusted with early snow.";

          const result = synthesizeBiographicalFallback(rawTranscript, "Interview Segment");

          expect(result.title.includes("Interview Segment")).toBe(false);
          expect(result.title.length).toBeGreaterThan(5);
        }
      );

      await test(
        "T.BN.04",
        "generateBiographicalNarrative returns cohesive narrative even in offline/test environment",
        async () => {
          const spoken =
            "I was born in Blackfoot and lived in a small house near the river. My mother always baked bread on Saturdays.";

          const result = await generateBiographicalNarrative(spoken, "Early Childhood");

          expect(result).toBeDefined();
          expect(result.summary.length).toBeGreaterThan(20);
          expect(result.summary).not.toBe(spoken);
          expect(result.summary.includes("Blair") || result.summary.includes("his mother")).toBe(true);
        }
      );

      await test(
        "T.BN.05",
        "POST /api/gemini/summarize HTTP route handler always returns valid JSON with title and narrative summary",
        async () => {
          const req = new NextRequest("http://localhost:3000/api/gemini/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transcript: "I remember skiing at Castle Mountain back in 1985 with Robin.",
              topic: "Skiing at Castle Mountain",
            }),
          });

          const res = await summarizeRoute(req);
          expect(res.status).toBe(200);

          const data = await res.json();
          expect(typeof data.title).toBe("string");
          expect(typeof data.summary).toBe("string");
          expect(data.summary.length).toBeGreaterThan(15);
        }
      );

      await test(
        "T.BN.06",
        "saveStoryFromTranscript guarantees narrative summary is NEVER null or empty in persisted story",
        async () => {
          const mockSession = {
            id: `test-session-${Date.now()}`,
            mode: "surprise_me" as const,
            currentTopic: "Fishing Trip",
            entitiesMentioned: [],
            questionHistory: [],
          };

          const rawTranscript = "My son Scott caught his first trout in the Crowsnest River. We were so proud.";

          // Save without precomputed summary — function must generate it internally
          const savedStory = await saveStoryFromTranscript(mockSession, rawTranscript);

          expect(savedStory).toBeDefined();
          expect(savedStory.transcript).toBe(rawTranscript);
          expect(savedStory.summary).toBeDefined();
          expect(savedStory.summary).not.toBeNull();
          expect(typeof savedStory.summary).toBe("string");
          expect(savedStory.summary!.length).toBeGreaterThan(15);
          expect(savedStory.summary).not.toBe(rawTranscript);
        }
      );

      await test(
        "T.BN.07",
        "Empty & Boundary Inputs - graceful handling without throwing or crashing",
        async () => {
          const emptyResult = synthesizeBiographicalFallback("", undefined);
          expect(emptyResult.title).toBeDefined();
          expect(emptyResult.summary).toBe("");

          const shortResult = synthesizeBiographicalFallback("I like snow.", undefined);
          expect(shortResult.summary.length).toBeGreaterThan(5);
        }
      );

      await test(
        "T.BN.08",
        "Realistic Elder Oral History Turn - multi-sentence meandering interview turn converts into literary biography",
        async () => {
          const elderRambling =
            "Well, um, so what am I supposed to say... ah, in the late 1960s, I worked at this small radio station before going into accounting. My father always told me to learn how to keep books. You know, we didn't have computers back then, just ledger sheets and pencils. I remember the smell of the paper and the coffee.";

          const result = synthesizeBiographicalFallback(elderRambling, "Early Jobs in Accounting");

          // Must not contain verbal filler
          expect(result.summary.includes("so what am I supposed to say")).toBe(false);
          expect(result.summary.toLowerCase().includes("you know")).toBe(false);
          expect(result.summary.toLowerCase().includes("um")).toBe(false);

          // Must be biographical third person
          expect(result.summary.toLowerCase().includes("his father")).toBe(true);
          expect(result.summary.includes("Blair") || result.summary.includes("he worked")).toBe(true);
          expect(result.summary.toLowerCase().includes("they didn't have computers")).toBe(true);
          expect(result.summary.toLowerCase().includes("remembered")).toBe(true);
        }
      );

      await test(
        "T.BN.09",
        "Legacy Unsummarized Story Defense - StoryCard logic never falls back to raw transcript",
        async () => {
          const legacyRawTranscript =
            "I flew my Cessna down to Great Falls Montana to pick up some airplane parts in 1982.";

          // Story with null summary
          const legacyStory = {
            id: "legacy-story-1",
            title: "Interview Segment",
            transcript: legacyRawTranscript,
            summary: null,
            era_tags: [],
            session_id: null,
            gemini_interaction_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const fallback = synthesizeBiographicalFallback(legacyStory.transcript, legacyStory.title);

          const displayText =
            legacyStory.summary && legacyStory.summary.trim().length > 10 && legacyStory.summary !== legacyStory.transcript
              ? legacyStory.summary
              : fallback.summary;

          expect(displayText).not.toBe(legacyRawTranscript);
          expect(displayText.includes("Blair") || displayText.includes("he flew")).toBe(true);
          expect(displayText.includes("his Cessna")).toBe(true);
        }
      );
    }
  );
}
