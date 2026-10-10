/**
 * Multi-User Isolation Verification Test Suite: Blair & Scott
 *
 * Verifies:
 * 1. Independent seed data for both Blair and Scott
 * 2. Story isolation (create/read/delete for Scott does not affect Blair and vice-versa)
 * 3. Entity isolation (Scott's family & education entities vs Blair's)
 * 4. Suggested prompts isolation
 * 5. Chapter isolation
 * 6. API route user filtering
 *
 * Usage:
 *   npx tsx tests/multi-user.test.ts
 */

import { suite, test, expect, globalTestContext, formatTerminalSummary } from "./e2e/framework";
import {
  getStories,
  createStory,
  deleteStory,
  getEntities,
  getChaptersWithStories,
  getSuggestedPrompts,
  createSuggestedPrompt,
  deleteSuggestedPrompt,
} from "@/lib/supabase/client";
import { createInterviewSession, saveStoryFromTranscript } from "@/lib/interview/session";
import { GET as getStoriesRoute } from "@/app/api/stories/route";
import { NextRequest } from "next/server";

export async function runMultiUserTests() {
  await suite(
    "Multi-User Architecture: Blair & Scott Isolation",
    "Tier 1: Multi-User Separation",
    "R1: Namespaced Storage",
    async () => {
      // ----------------------------------------------------
      // 1. Initial Seed Isolation
      // ----------------------------------------------------
      await test("USER.01", "Blair and Scott have distinct seed entities", async () => {
        const blairEntities = await getEntities(undefined, "blair");
        const scottEntities = await getEntities(undefined, "scott");

        expect(blairEntities.length > 0).toBe(true);
        expect(scottEntities.length > 0).toBe(true);

        const blairNames = blairEntities.map((e) => e.name);
        const scottNames = scottEntities.map((e) => e.name);

        // Blair should have Blair Goates as narrator
        expect(blairNames).toContain("Blair Goates");
        expect(blairNames).toContain("Robin Milne");

        // Scott should have Scott Goates as narrator and Andrea Wells
        expect(scottNames).toContain("Scott Goates");
        expect(scottNames).toContain("Andrea Wells");
        expect(scottNames).toContain("Brigham Young University");
        expect(scottNames).toContain("France");
        expect(scottNames).toContain("Santa Clarita, California");

        // Scott's specific wife shouldn't be in Blair's seed
        expect(blairNames).not.toContain("Andrea Wells");
      });

      await test("USER.02", "Blair and Scott have distinct seed stories", async () => {
        const blairStories = await getStories(undefined, "blair");
        const scottStories = await getStories(undefined, "scott");

        expect(blairStories.length).toBe(2);
        expect(scottStories.length).toBe(1);

        const blairTitles = blairStories.map((s) => s.title);
        const scottTitles = scottStories.map((s) => s.title);

        expect(blairTitles).toContain("A Life Between Idaho and Alberta");
        expect(blairTitles).toContain("Summer Days in Waterton Lakes");
        expect(scottTitles).toContain("A Life from Lethbridge to California");

        expect(blairTitles).not.toContain("A Life from Lethbridge to California");
      });

      // ----------------------------------------------------
      // 2. Story Creation & Deletion Isolation
      // ----------------------------------------------------
      await test("USER.03", "Story created for Scott is NOT visible to Blair", async () => {
        const initialBlairStories = await getStories(undefined, "blair");
        const initialScottStories = await getStories(undefined, "scott");

        const newScottStory = await createStory({
          title: "Mission in Paris and Lyon",
          transcript: "Serving my LDS mission in France taught me resilience and love for French culture.",
          summary: "Reflections on two years serving an LDS mission in France.",
          era_tags: ["BYU & Mission Years"],
        }, "scott");

        const updatedBlairStories = await getStories(undefined, "blair");
        const updatedScottStories = await getStories(undefined, "scott");

        expect(updatedScottStories.length).toBe(initialScottStories.length + 1);
        expect(updatedBlairStories.length).toBe(initialBlairStories.length);

        expect(updatedScottStories.some((s) => s.id === newScottStory.id)).toBe(true);
        expect(updatedBlairStories.some((s) => s.id === newScottStory.id)).toBe(false);

        // Clean up
        await deleteStory(newScottStory.id, "scott");
      });

      await test("USER.04", "Story created for Blair is NOT visible to Scott", async () => {
        const initialBlairStories = await getStories(undefined, "blair");
        const initialScottStories = await getStories(undefined, "scott");

        const newBlairStory = await createStory({
          title: "Flying Solo to Boise",
          transcript: "Taking off in the Cessna on a crisp morning and flying toward the Sawtooths.",
          summary: "A memorable solo flight over the Idaho mountains.",
          era_tags: ["Career & Family Life in Lethbridge"],
        }, "blair");

        const updatedBlairStories = await getStories(undefined, "blair");
        const updatedScottStories = await getStories(undefined, "scott");

        expect(updatedBlairStories.length).toBe(initialBlairStories.length + 1);
        expect(updatedScottStories.length).toBe(initialScottStories.length);

        expect(updatedBlairStories.some((s) => s.id === newBlairStory.id)).toBe(true);
        expect(updatedScottStories.some((s) => s.id === newBlairStory.id)).toBe(false);

        // Clean up
        await deleteStory(newBlairStory.id, "blair");
      });

      // ----------------------------------------------------
      // 3. Suggested Prompts Isolation
      // ----------------------------------------------------
      await test("USER.05", "Suggested prompts are separated between Blair and Scott", async () => {
        const blairPrompts = await getSuggestedPrompts("blair");
        const scottPrompts = await getSuggestedPrompts("scott");

        expect(blairPrompts.length > 0).toBe(true);
        expect(scottPrompts.length > 0).toBe(true);

        const blairTexts = blairPrompts.map((p) => p.prompt);
        const scottTexts = scottPrompts.map((p) => p.prompt);

        expect(blairTexts.some((p) => p.includes("airplane"))).toBe(true);
        expect(scottTexts.some((p) => p.includes("France"))).toBe(true);

        // Create prompt for Scott
        const testPrompt = await createSuggestedPrompt({
          prompt: "What was your first house in Santa Clarita like?",
          suggested_by: "James",
          category: "Family & California",
          status: "pending",
        }, "scott");

        const refreshedBlair = await getSuggestedPrompts("blair");
        const refreshedScott = await getSuggestedPrompts("scott");

        expect(refreshedScott.some((p) => p.id === testPrompt.id)).toBe(true);
        expect(refreshedBlair.some((p) => p.id === testPrompt.id)).toBe(false);

        // Clean up
        await deleteSuggestedPrompt(testPrompt.id, "scott");
      });

      // ----------------------------------------------------
      // 4. Chapter Isolation
      // ----------------------------------------------------
      await test("USER.06", "Chapters are isolated between users", async () => {
        const blairChapters = await getChaptersWithStories("blair");
        const scottChapters = await getChaptersWithStories("scott");

        expect(blairChapters.length > 0).toBe(true);
        expect(scottChapters.length > 0).toBe(true);

        const blairChapterTitles = blairChapters.map((c) => c.title);
        const scottChapterTitles = scottChapters.map((c) => c.title);

        expect(blairChapterTitles).toContain("Formative Years in Idaho and Waterton");
        expect(scottChapterTitles).toContain("From Lethbridge to Provo");
        expect(blairChapterTitles).not.toContain("From Lethbridge to Provo");
      });

      // ----------------------------------------------------
      // 5. Interview Session & Save Story Isolation
      // ----------------------------------------------------
      await test("USER.07", "Interview session saveStoryFromTranscript targets the correct user", async () => {
        const session = await createInterviewSession("explore_era", "High school at LCI", "scott");
        expect(session.id).toBeDefined();

        const story = await saveStoryFromTranscript(
          session,
          "Graduating from LCI in 1999 was a huge milestone. We celebrated with friends all summer.",
          "Memories of graduating from Lethbridge Collegiate Institute in 1999.",
          "Graduation at LCI",
          "scott"
        );

        const scottStories = await getStories(undefined, "scott");
        const blairStories = await getStories(undefined, "blair");

        expect(scottStories.some((s) => s.id === story.id)).toBe(true);
        expect(blairStories.some((s) => s.id === story.id)).toBe(false);

        // Clean up
        await deleteStory(story.id, "scott");
      });

      // ----------------------------------------------------
      // 6. API Route User Filtering
      // ----------------------------------------------------
      await test("USER.08", "GET /api/stories?userId=scott returns Scott's stories", async () => {
        const scottReq = new NextRequest("http://localhost:3000/api/stories?userId=scott");
        const scottRes = await getStoriesRoute(scottReq);
        const scottData = await scottRes.json();

        expect(scottRes.status).toBe(200);
        expect(scottData.stories.length).toBeGreaterThan(0);
        expect(scottData.stories[0].title).toBe("A Life from Lethbridge to California");

        const blairReq = new NextRequest("http://localhost:3000/api/stories?userId=blair");
        const blairRes = await getStoriesRoute(blairReq);
        const blairData = await blairRes.json();

        expect(blairRes.status).toBe(200);
        expect(blairData.stories.length).toBeGreaterThan(0);
        expect(blairData.stories.some((s: any) => s.title === "A Life Between Idaho and Alberta")).toBe(true);
      });
    }
  );
}

// Self-executing runner
runMultiUserTests().then(() => {
  const summary = globalTestContext.getSummary();
  const { text, success } = formatTerminalSummary(summary);
  console.log(text);
  process.exit(success ? 0 : 1);
}).catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
