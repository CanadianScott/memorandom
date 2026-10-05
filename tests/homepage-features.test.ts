/**
 * Memorandom Homepage New Features Verification Test Suite
 * Covers:
 * 1. Delete Story from Homepage
 * 2. Suggest Prompts for Dad on Homepage
 *
 * Usage:
 *   npx tsx tests/homepage-features.test.ts
 */

import { suite, test, expect, globalTestContext, formatTerminalSummary } from "./e2e/framework";
import {
  getStories,
  createStory,
  deleteStory,
  getSuggestedPrompts,
  createSuggestedPrompt,
  updateSuggestedPrompt,
  deleteSuggestedPrompt,
  linkStoryEntities,
} from "@/lib/supabase/client";
import {
  localGetStories,
  localCreateStory,
  localDeleteStory,
  localGetStoryEntities,
  localGetSuggestedPrompts,
  localCreateSuggestedPrompt,
  localUpdateSuggestedPrompt,
  localDeleteSuggestedPrompt,
} from "@/lib/supabase/local-store";
import { createInterviewSession } from "@/lib/interview/session";
import {
  GET as getPromptsRoute,
  POST as postPromptsRoute,
  PATCH as patchPromptsRoute,
  DELETE as deletePromptsRoute,
} from "@/app/api/prompts/route";
import {
  GET as getStoriesRoute,
  POST as postStoriesRoute,
  DELETE as deleteStoriesRoute,
} from "@/app/api/stories/route";
import { NextRequest } from "next/server";

export async function runHomepageFeaturesTests() {
  await suite(
    "Homepage Features: Delete Story & Family Prompts",
    "Tier 1: Feature Coverage",
    "R1: Story Catalog",
    async () => {
      // ----------------------------------------------------
      // Feature 1: Delete Story from Homepage
      // ----------------------------------------------------

      await test("DEL.01", "deleteStory contract: removes story and returns true", async () => {
        const testStory = await createStory({
          title: "Temporary Test Story for Deletion",
          transcript: "This is a memory meant to be deleted.",
          summary: "Summary of story to be deleted.",
          era_tags: ["1980s"],
        });

        expect(testStory).toBeDefined();
        expect(testStory.id).toBeDefined();

        // Verify it exists in store
        const storiesBefore = await getStories();
        expect(storiesBefore.some((s) => s.id === testStory.id)).toBe(true);

        // Delete the story
        const deleteSuccess = await deleteStory(testStory.id);
        expect(deleteSuccess).toBe(true);

        // Verify it was removed
        const storiesAfter = await getStories();
        expect(storiesAfter.some((s) => s.id === testStory.id)).toBe(false);
      });

      await test("DEL.02", "deleteStory cleans up linked story_entities junctions", async () => {
        const testStory = await createStory({
          title: "Story with Linked Entities",
          transcript: "Blair in Waterton with family.",
          summary: "Blair in Waterton.",
          era_tags: [],
        });

        // Link dummy entities
        await linkStoryEntities(testStory.id, ["entity-blair", "entity-waterton"]);
        const linksBefore = localGetStoryEntities(testStory.id);
        expect(linksBefore.length).toBe(2);

        // Delete story
        const deleteSuccess = await deleteStory(testStory.id);
        expect(deleteSuccess).toBe(true);

        // Linked junctions should be purged
        const linksAfter = localGetStoryEntities(testStory.id);
        expect(linksAfter.length).toBe(0);
      });

      await test("DEL.03", "deleteStory handles non-existent id gracefully", async () => {
        const fakeId = `non-existent-${Date.now()}`;
        const deleteSuccess = await deleteStory(fakeId);
        expect(deleteSuccess).toBe(false);
      });

      await test("DEL.04", "Multi-story deletion: deleting one leaves others intact", async () => {
        const s1 = await createStory({
          title: "Preserved Story Alpha",
          transcript: "Should remain untouched.",
          era_tags: [],
        });
        const s2 = await createStory({
          title: "Doomed Story Beta",
          transcript: "Should be deleted.",
          era_tags: [],
        });

        expect(await deleteStory(s2.id)).toBe(true);

        const currentStories = await getStories();
        expect(currentStories.some((s) => s.id === s1.id)).toBe(true);
        expect(currentStories.some((s) => s.id === s2.id)).toBe(false);

        // Cleanup s1
        await deleteStory(s1.id);
      });

      await test("DEL.05", "HTTP DELETE /api/stories route handler executes deletion", async () => {
        const apiStory = await createStory({
          title: "API Deletion Target",
          transcript: "Story to test API route.",
          era_tags: [],
        });

        // Call route handler with query parameter
        const req = new NextRequest(`http://localhost:3000/api/stories?id=${apiStory.id}`, {
          method: "DELETE",
        });
        const res = await deleteStoriesRoute(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);

        // Verify story no longer exists
        const all = await getStories();
        expect(all.some((s) => s.id === apiStory.id)).toBe(false);
      });

      await test("DEL.06", "HTTP DELETE /api/stories returns 400 if id missing", async () => {
        const req = new NextRequest("http://localhost:3000/api/stories", {
          method: "DELETE",
        });
        const res = await deleteStoriesRoute(req);
        expect(res.status).toBe(400);
      });

      // ----------------------------------------------------
      // Feature 2: Suggest Prompts for Dad on Homepage
      // ----------------------------------------------------

      await test("PRM.01", "Pre-seeded family prompts from daughters & sons exist", async () => {
        const prompts = await getSuggestedPrompts();
        expect(prompts.length).toBeGreaterThanOrEqual(2);

        // Check for daughter prompt
        const melissaPrompt = prompts.find((p) => p.suggested_by === "Melissa");
        expect(melissaPrompt).toBeDefined();
        expect(melissaPrompt?.prompt).toContain("airplane");

        const jessicaPrompt = prompts.find((p) => p.suggested_by === "Jessica");
        expect(jessicaPrompt).toBeDefined();
        expect(jessicaPrompt?.prompt).toContain("Waterton");
      });

      await test("PRM.02", "createSuggestedPrompt stores prompt with name and category", async () => {
        const customPrompt = await createSuggestedPrompt({
          prompt: "Dad, what was the biggest challenge you faced when starting out as an accountant?",
          suggested_by: "Scott",
          category: "Career & Accounting",
          status: "pending",
        });

        expect(customPrompt.id).toBeDefined();
        expect(customPrompt.suggested_by).toBe("Scott");
        expect(customPrompt.category).toBe("Career & Accounting");
        expect(customPrompt.prompt).toContain("accountant");

        // Verify retrieval
        const allPrompts = await getSuggestedPrompts();
        expect(allPrompts.some((p) => p.id === customPrompt.id)).toBe(true);

        // Cleanup
        await deleteSuggestedPrompt(customPrompt.id);
      });

      await test("PRM.03", "deleteSuggestedPrompt removes suggested prompt", async () => {
        const tempPrompt = await createSuggestedPrompt({
          prompt: "Temporary prompt to be deleted",
          suggested_by: "Guest",
        });

        const deleted = await deleteSuggestedPrompt(tempPrompt.id);
        expect(deleted).toBe(true);

        const currentPrompts = await getSuggestedPrompts();
        expect(currentPrompts.some((p) => p.id === tempPrompt.id)).toBe(false);
      });

      await test("PRM.04", "HTTP GET /api/prompts returns list of prompts", async () => {
        const res = await getPromptsRoute();
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.prompts).toBeDefined();
        expect(Array.isArray(data.prompts)).toBe(true);
        expect(data.prompts.length).toBeGreaterThanOrEqual(1);
      });

      await test("PRM.05", "HTTP POST /api/prompts creates prompt and validates input", async () => {
        // Valid POST
        const validReq = new NextRequest("http://localhost:3000/api/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: "Dad, tell us about your road trip with Uncle Bob in the 1970s!",
            suggested_by: "Jessica",
            category: "Adventures & Flying",
          }),
        });

        const res = await postPromptsRoute(validReq);
        expect(res.status).toBe(201);

        const data = await res.json();
        expect(data.prompt).toBeDefined();
        expect(data.prompt.suggested_by).toBe("Jessica");
        expect(data.prompt.prompt).toContain("Uncle Bob");

        // Invalid POST (<3 chars)
        const invalidReq = new NextRequest("http://localhost:3000/api/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: "hi" }),
        });
        const invalidRes = await postPromptsRoute(invalidReq);
        expect(invalidRes.status).toBe(400);

        // Cleanup
        await deleteSuggestedPrompt(data.prompt.id);
      });

      await test("PRM.06", "HTTP DELETE /api/prompts removes prompt via query param", async () => {
        const created = await createSuggestedPrompt({
          prompt: "To delete via API route",
          suggested_by: "Test",
        });

        const delReq = new NextRequest(`http://localhost:3000/api/prompts?id=${created.id}`, {
          method: "DELETE",
        });

        const delRes = await deletePromptsRoute(delReq);
        expect(delRes.status).toBe(200);

        const data = await delRes.json();
        expect(data.success).toBe(true);

        const prompts = await getSuggestedPrompts();
        expect(prompts.some((p) => p.id === created.id)).toBe(false);
      });

      await test("PRM.07", "Interview integration: createInterviewSession uses custom prompt", async () => {
        const familyPrompt = "Dad, tell us about the day you bought your first airplane!";
        const session = await createInterviewSession("surprise_me", familyPrompt);

        expect(session).toBeDefined();
        expect(session.currentTopic).toBe(familyPrompt);
        expect(session.questionHistory).toBeDefined();
        expect(session.questionHistory.includes(familyPrompt)).toBe(true);
      });

      // Edge Cases: Boundary & Corner Cases
      await test("PRM.08", "Prompt edge case: special characters, quotes, and unicode", async () => {
        const specialPrompt = await createSuggestedPrompt({
          prompt: "Dad, do you remember the 'Piper Cub' & the 1974 storm in Blackfoot?! ✈️🌲",
          suggested_by: "Melissa & Jessica",
        });

        expect(specialPrompt.prompt).toContain("Piper Cub");
        expect(specialPrompt.prompt).toContain("✈️");
        expect(specialPrompt.suggested_by).toBe("Melissa & Jessica");

        await deleteSuggestedPrompt(specialPrompt.id);
      });

      await test("PRM.09", "Prompt edge case: default anonymous family member and null category", async () => {
        const defaultPrompt = await createSuggestedPrompt({
          prompt: "What was your grandmother's name on your father's side?",
        });

        expect(defaultPrompt.suggested_by).toBe("Family Member");
        expect(defaultPrompt.category).toBeNull();

        await deleteSuggestedPrompt(defaultPrompt.id);
      });

      await test("PRM.10", "Prompt edge case: deleting non-existent prompt returns false", async () => {
        const nonExistent = await deleteSuggestedPrompt("fake-prompt-id-999");
        expect(nonExistent).toBe(false);
      });

      await test("DEL.07", "Story edge case: deleting story with era tags updates store cleanly", async () => {
        const taggedStory = await createStory({
          title: "Tagged Era Story",
          transcript: "Story with multiple era tags.",
          era_tags: ["Childhood in Blackfoot", "Marriage & Early Career"],
        });

        const deleted = await deleteStory(taggedStory.id);
        expect(deleted).toBe(true);

        const currentStories = await getStories();
        expect(currentStories.some((s) => s.id === taggedStory.id)).toBe(false);
      });

      await test("PRM.11", "updateSuggestedPrompt and PATCH /api/prompts updates status to 'used'", async () => {
        const testPrompt = await createSuggestedPrompt({
          prompt: "Dad, tell us about your accounting firm partners",
          suggested_by: "Scott",
          status: "pending",
        });

        // Test client layer update
        const updated = await updateSuggestedPrompt(testPrompt.id, { status: "used" });
        expect(updated).toBeDefined();
        expect(updated?.status).toBe("used");

        // Test PATCH route handler
        const patchReq = new NextRequest("http://localhost:3000/api/prompts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: testPrompt.id,
            status: "pending",
          }),
        });
        const patchRes = await patchPromptsRoute(patchReq);
        expect(patchRes.status).toBe(200);
        const patchData = await patchRes.json();
        expect(patchData.prompt.status).toBe("pending");

        await deleteSuggestedPrompt(testPrompt.id);
      });

      await test("PRM.12", "Deleting all prompts preserves empty list without resurrecting seeds", async () => {
        // Create an isolated temp prompt
        const isolatedPrompt = await createSuggestedPrompt({
          prompt: "Single isolated prompt for empty array test",
          suggested_by: "Test",
        });

        // Capture all current prompts and delete them all
        const allPrompts = await getSuggestedPrompts();
        for (const p of allPrompts) {
          await deleteSuggestedPrompt(p.id);
        }

        // Store must now contain 0 prompts and NOT resurrect seed prompts
        const remaining = await getSuggestedPrompts();
        expect(remaining.length).toBe(0);

        // Restore the original test seeds for subsequent suites
        await createSuggestedPrompt({
          id: "prompt-seed-1",
          prompt: "Dad, tell us about the day you bought your first airplane and took off from the grass runway in Idaho!",
          suggested_by: "Melissa",
          category: "Adventures & Flying",
        });
        await createSuggestedPrompt({
          id: "prompt-seed-2",
          prompt: "What is your favorite memory of hiking in Waterton with Mom when we were little?",
          suggested_by: "Jessica",
          category: "Waterton & Outdoors",
        });
        await createSuggestedPrompt({
          id: "prompt-seed-3",
          prompt: "How did you and Mom meet, and what was your first date like?",
          suggested_by: "Scott",
          category: "Family & Marriage",
        });
      });

      await test("DEL.08", "HTTP POST /api/stories creates story and DELETE /api/stories removes it", async () => {
        // Create story via POST /api/stories
        const postReq = new NextRequest("http://localhost:3000/api/stories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "HTTP REST API Story",
            transcript: "Transcript created via HTTP POST endpoint.",
            summary: "HTTP summary.",
            era_tags: ["Adventures"],
          }),
        });
        const postRes = await postStoriesRoute(postReq);
        expect(postRes.status).toBe(201);
        const postData = await postRes.json();
        expect(postData.story).toBeDefined();
        expect(postData.story.id).toBeDefined();

        // Delete story via DELETE /api/stories
        const delReq = new NextRequest(`http://localhost:3000/api/stories?id=${postData.story.id}`, {
          method: "DELETE",
        });
        const delRes = await deleteStoriesRoute(delReq);
        expect(delRes.status).toBe(200);
        const delData = await delRes.json();
        expect(delData.success).toBe(true);

        // Verify it was purged
        const current = await getStories();
        expect(current.some((s) => s.id === postData.story.id)).toBe(false);
      });
    }
  );
}

// Direct execution entrypoint
if (process.argv[1]?.includes("homepage-features.test")) {
  runHomepageFeaturesTests()
    .then(() => {
      const summary = globalTestContext.getSummary();
      const { text, success } = formatTerminalSummary(summary);
      console.log(text);
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      console.error("Test runner failed:", err);
      process.exit(1);
    });
}
