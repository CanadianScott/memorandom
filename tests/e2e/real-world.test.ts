/**
 * Tier 4: Real-World Scenarios E2E Test Suite
 * Simulates realistic end-to-end narrator life story journeys
 * Authoritative source: ORIGINAL_REQUEST.md, PROJECT.md, life-story-interviewer SKILL.md
 */

import { suite, test, expect, createMockRequest } from "./framework";

export async function runRealWorldTests() {
  await suite(
    "Real-World Scenarios (Tier 4)",
    "Tier 4: Real-World Scenarios",
    "Real-World",
    async () => {
      await test("T4.RW.01", "Journey 1: Childhood in Chicago & Sandlot Memories", async () => {
        const localStore = await import("@/lib/supabase/local-store");
        const clientModule = await import("@/lib/supabase/client");

        // 1. Narrator starts on home catalog - load stories
        const initialStories = await clientModule.getStories();
        expect(initialStories.length).toBeGreaterThanOrEqual(1);

        // 2. Narrator enters interview session - create session
        const session = localStore.localCreateSession("classic", "Tell me about your favorite childhood game");
        expect(session.id).toBeDefined();

        // 3. Narrator speaks: "My best friend Billy and I played sandlot baseball every summer afternoon in Chicago."
        const transcript = "My best friend Billy and I played sandlot baseball every summer afternoon in Chicago.";

        // 4. Entity extraction processes transcript
        const extractEntitiesRoute = await import("@/app/api/gemini/extract-entities/route");
        const extractReq = createMockRequest("http://localhost:3000/api/gemini/extract-entities", {
          method: "POST",
          body: JSON.stringify({ transcript }),
        });
        const extractRes = await extractEntitiesRoute.POST(extractReq as any);
        expect(extractRes.status).toBe(200);
        const extractData = await extractRes.json();
        expect(Array.isArray(extractData.entities)).toBe(true);

        // 5. Visual enrichment maps Chicago
        const enrichmentRoute = await import("@/app/api/enrichment/route");
        const geoReq = createMockRequest("http://localhost:3000/api/enrichment", {
          method: "POST",
          body: JSON.stringify({ type: "geocode", query: "Chicago, Illinois" }),
        });
        const geoRes = await enrichmentRoute.POST(geoReq as any);
        expect(geoRes.status).toBe(200);

        // 6. Save story turn to store
        const savedStory = localStore.localCreateStory({
          session_id: session.id,
          title: "Sandlot Days with Billy",
          transcript,
          era_tags: ["1950s Childhood"],
        });
        expect(savedStory.id).toBeDefined();

        // 7. Verify new story is visible in store
        const updatedStories = localStore.localGetStories();
        const found = updatedStories.find((s) => s.id === savedStory.id);
        expect(found).toBeDefined();
      });

      await test("T4.RW.02", "Journey 2: Western Road Trip & Historical Prompt Injection", async () => {
        const { getHistoricalContext } = await import("@/lib/gemini/historical-context");

        // 1. Narrator established context: 1960s era, Wyoming/Yellowstone, born ~1945
        const profile = {
          birthYear: 1945,
          eras: ["1960s Travels"],
          locations: ["Yellowstone National Park", "Wyoming"],
        };

        // 2. Cadence trigger: System queries for historical prompts
        const histRes = await getHistoricalContext({
          ...profile,
          limit: 3,
        });

        expect(histRes.prompts.length).toBeGreaterThanOrEqual(1);
        const prompt = histRes.prompts[0];

        // 3. Verify prompt is empathetic, single-part, age-appropriate
        expect(prompt.question.endsWith("?")).toBe(true);
        expect(prompt.question.length).toBeGreaterThan(20);

        // 4. Verify prompt supplies Visual Stage triggers
        expect(prompt.visualQuery.length).toBeGreaterThan(5);
        expect(prompt.mapQuery.length).toBeGreaterThan(3);
        expect(prompt.artPrompt.length).toBeGreaterThan(10);
      });

      await test("T4.RW.03", "Journey 3: Family Keepsake & Biography Archival Review", async () => {
        const localStore = await import("@/lib/supabase/local-store");

        // 1. Adult child browses biographical knowledge graph
        const entities = localStore.localGetEntities();
        expect(entities.length).toBeGreaterThanOrEqual(5);

        // 2. Inspect People & Relationships
        const relatives = entities.filter((e) => e.type === "person");
        expect(relatives.length).toBeGreaterThanOrEqual(2);

        // 3. Inspect Places Lived & Visited
        const places = entities.filter((e) => e.type === "place");
        expect(places.length).toBeGreaterThanOrEqual(2);

        // 4. Inspect Eras & Timeline
        const eras = entities.filter((e) => e.type === "era");
        expect(eras.length).toBeGreaterThanOrEqual(1);

        // 5. Verify chapter organization for memoir book
        const chapters = localStore.localGetChapters();
        expect(Array.isArray(chapters)).toBe(true);
        expect(chapters.length).toBeGreaterThanOrEqual(2);
      });

      await test("T4.RW.04", "Journey 4: Zero-Config Tablet Offline Resilience", async () => {
        const localStore = await import("@/lib/supabase/local-store");
        const interviewRoute = await import("@/app/api/gemini/interview/route");

        // 1. Zero-config startup with seed data
        const initialStories = localStore.localGetStories();
        expect(initialStories.length).toBeGreaterThanOrEqual(2);

        // 2. Narrator responds to interview prompt in offline mode
        const interviewReq = createMockRequest("http://localhost:3000/api/gemini/interview", {
          method: "POST",
          body: JSON.stringify({
            transcript: "We used to pack sandwiches and listen to the car radio all through the prairie.",
            knowledgeGraphSummary: "Known eras: 1960s Travels. Known places: Yellowstone.",
            mode: "classic",
          }),
        });

        // 3. Route handler returns resilient HTTP 200 even with placeholder/offline Gemini
        const interviewRes = await interviewRoute.POST(interviewReq as any);
        expect(interviewRes.status).toBe(200);
        const interviewData = await interviewRes.json();
        expect(interviewData.question).toBeDefined();
        const questionText = typeof interviewData.question === "string"
          ? interviewData.question
          : interviewData.question?.question;
        expect(typeof questionText).toBe("string");
        expect(questionText.length).toBeGreaterThan(10);
      });
    }
  );
}
