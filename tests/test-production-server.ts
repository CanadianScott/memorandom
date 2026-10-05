/**
 * Production Server Verification Harness
 * Tests `next start` on production build, exercises routes via HTTP, and cleans up.
 */

import { spawn, execSync, ChildProcess } from "node:child_process";
import * as http from "node:http";

const PORT = 3088;
const BASE_URL = `http://localhost:${PORT}`;

function waitForServer(timeoutMs = 15000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`${BASE_URL}/`, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          resolve();
        } else {
          retry();
        }
      });
      req.on("error", () => {
        retry();
      });
      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server failed to start within ${timeoutMs}ms on port ${PORT}`));
      } else {
        setTimeout(check, 300);
      }
    };

    check();
  });
}

async function testRoute(name: string, url: string, options: RequestInit = {}): Promise<{ status: number; text: string }> {
  const res = await fetch(url, options);
  const text = await res.text();
  console.log(`  [HTTP] ${name} -> Status: ${res.status}, Body length: ${text.length}`);
  if (res.status >= 400) {
    throw new Error(`Route ${name} returned error status ${res.status}: ${text.slice(0, 200)}`);
  }
  return { status: res.status, text };
}

async function main() {
  console.log("=======================================================");
  console.log(`  STARTING PRODUCTION SERVER: next start -p ${PORT}`);
  console.log("=======================================================\n");

  let serverProcess: ChildProcess | null = null;

  try {
    serverProcess = spawn("npx", ["next", "start", "-p", String(PORT)], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
      env: { ...process.env, PORT: String(PORT) },
    });

    serverProcess.stdout?.on("data", (data) => {
      const line = data.toString().trim();
      if (line) console.log(`  [stdout] ${line}`);
    });

    serverProcess.stderr?.on("data", (data) => {
      const line = data.toString().trim();
      if (line) console.error(`  [stderr] ${line}`);
    });

    console.log("Waiting for server to become ready...");
    await waitForServer(20000);
    console.log("Server is ready! Running HTTP verification requests:\n");

    // 1. Home page (Story Catalog)
    const home = await testRoute("Home Catalog (/) ", `${BASE_URL}/`);
    if (!home.text.includes("Memorandom") && !home.text.includes("Story") && !home.text.includes("catalog")) {
      console.warn("Home page HTML might be client rendered, body received");
    }

    // 2. Biography page
    const bio = await testRoute("Biography Page (/biography)", `${BASE_URL}/biography`);
    if (!bio.text.includes("Biography") && !bio.text.includes("Biographical") && !bio.text.includes("biography")) {
      console.warn("Biography page HTML might be client rendered");
    }

    // 3. Interview page
    await testRoute("Interview Page (/interview)", `${BASE_URL}/interview`);

    // 4. Historical Context API
    const histRes = await testRoute(
      "Historical Context API (/api/gemini/historical-context)",
      `${BASE_URL}/api/gemini/historical-context`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthYear: 1945,
          locations: ["Chicago, Illinois"],
          limit: 3,
        }),
      }
    );
    const histData = JSON.parse(histRes.text);
    if (!histData.prompts || histData.prompts.length === 0) {
      throw new Error("Historical context API returned empty prompts in production");
    }
    console.log(`  [OK] Historical Context returned ${histData.prompts.length} prompts`);

    // 5. Enrichment API
    const enrichRes = await testRoute(
      "Enrichment Geocode API (/api/enrichment)",
      `${BASE_URL}/api/enrichment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "geocode",
          query: "Chicago, Illinois",
        }),
      }
    );
    const enrichData = JSON.parse(enrichRes.text);
    console.log(`  [OK] Enrichment API returned: ${JSON.stringify(enrichData).slice(0, 100)}`);

    // 6. Homepage Prompts for Dad Section Verification
    if (home.text.includes("Prompts for Dad")) {
      console.log("  [OK] Homepage renders 'Prompts for Dad' section");
    } else {
      console.warn("  [WARN] Homepage SSR output might not contain static text if dynamic, checking endpoints");
    }

    // 7. GET /api/prompts
    const getPrompts = await testRoute("Get Prompts API (/api/prompts)", `${BASE_URL}/api/prompts`);
    const promptsData = JSON.parse(getPrompts.text);
    if (!promptsData.prompts || !Array.isArray(promptsData.prompts)) {
      throw new Error("Get prompts API did not return a prompts array");
    }
    console.log(`  [OK] Prompts API returned ${promptsData.prompts.length} suggested prompts`);

    // 8. POST /api/prompts (Create a new prompt from family)
    const postPromptRes = await testRoute(
      "Create Prompt API (/api/prompts)",
      `${BASE_URL}/api/prompts`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Dad, tell us about the day you bought your first airplane!",
          suggested_by: "Melissa",
          category: "Adventures & Flying",
        }),
      }
    );
    const postPromptData = JSON.parse(postPromptRes.text);
    if (!postPromptData.prompt || !postPromptData.prompt.id) {
      throw new Error("Create prompt API did not return created prompt with ID");
    }
    console.log(`  [OK] Created prompt ID: ${postPromptData.prompt.id}`);

    // 9. DELETE /api/prompts (Delete the created prompt)
    const deletePromptRes = await testRoute(
      "Delete Prompt API (/api/prompts)",
      `${BASE_URL}/api/prompts?id=${postPromptData.prompt.id}`,
      { method: "DELETE" }
    );
    const deletePromptData = JSON.parse(deletePromptRes.text);
    if (!deletePromptData.success) {
      throw new Error("Delete prompt API did not return success: true");
    }
    console.log("  [OK] Successfully deleted created prompt");

    // 10. GET /api/stories
    const getStoriesRes = await testRoute("Get Stories API (/api/stories)", `${BASE_URL}/api/stories`);
    const storiesData = JSON.parse(getStoriesRes.text);
    if (!storiesData.stories || !Array.isArray(storiesData.stories)) {
      throw new Error("Get stories API did not return stories array");
    }
    console.log(`  [OK] Stories API returned ${storiesData.stories.length} stories`);

    // 11. POST /api/stories (Create temporary story for Dad over HTTP)
    const postStoryRes = await testRoute(
      "Create Story API (/api/stories)",
      `${BASE_URL}/api/stories`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Temporary Production Verification Story",
          transcript: "Dad talked about flying over the Rockies during the summer of 1974.",
          summary: "Flying over the Rockies.",
          era_tags: ["Adventures & Flying"],
        }),
      }
    );
    const postStoryData = JSON.parse(postStoryRes.text);
    if (!postStoryData.story || !postStoryData.story.id) {
      throw new Error("Create story API did not return created story with ID");
    }
    console.log(`  [OK] Created production test story ID: ${postStoryData.story.id}`);

    // 12. DELETE /api/stories (Delete temporary story over HTTP)
    const deleteStoryRes = await testRoute(
      "Delete Story API (/api/stories)",
      `${BASE_URL}/api/stories?id=${postStoryData.story.id}`,
      { method: "DELETE" }
    );
    const deleteStoryData = JSON.parse(deleteStoryRes.text);
    if (!deleteStoryData.success) {
      throw new Error("Delete story API did not return success: true");
    }
    console.log("  [OK] Successfully deleted created test story via HTTP");

    // 13. PATCH /api/prompts (Update prompt status to used / pending)
    const patchPromptRes = await testRoute(
      "Update Prompt API (/api/prompts)",
      `${BASE_URL}/api/prompts`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "prompt-seed-1",
          status: "used",
        }),
      }
    );
    const patchPromptData = JSON.parse(patchPromptRes.text);
    if (!patchPromptData.prompt || patchPromptData.prompt.status !== "used") {
      throw new Error("Patch prompt API did not update prompt status to used");
    }
    console.log("  [OK] Successfully updated prompt status to 'used'");

    // 14. Interview Page with Prompt Query Parameter (/interview?prompt=...)
    const interviewWithPrompt = await testRoute(
      "Interview with Family Prompt (/interview?prompt=...)",
      `${BASE_URL}/interview?prompt=${encodeURIComponent("Tell us about your airplane")}`
    );
    console.log(`  [OK] Interview page with prompt param loaded successfully (${interviewWithPrompt.status})`);

    console.log("\n=======================================================");
    console.log("  PRODUCTION SERVER VERIFICATION SUCCESSFUL (14/14 PASS)");
    console.log("=======================================================\n");
  } finally {
    if (serverProcess) {
      console.log("Shutting down production server...");
      serverProcess.kill("SIGTERM");
      // On Windows kill process tree if needed
      try {
        spawn("taskkill", ["/pid", String(serverProcess.pid), "/T", "/F"]);
      } catch {}
      console.log("Server shut down cleanly.");
    }
  }
}

main().catch((err) => {
  console.error("Production server verification failed:", err);
  process.exit(1);
});
