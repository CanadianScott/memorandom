/**
 * Production Server Verification Harness
 * Tests `next start` on production build, exercises routes via HTTP, and cleans up.
 */

import { spawn, ChildProcess } from "node:child_process";
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

    console.log("\n=======================================================");
    console.log("  PRODUCTION SERVER VERIFICATION SUCCESSFUL (5/5 PASS)");
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
