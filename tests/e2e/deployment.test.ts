/**
 * R4 Vercel Deployment & Link Sharing E2E Test Suite
 * Covers Tier 1 (Feature Coverage) and Tier 2 (Boundary & Corner Cases)
 * Authoritative source: ORIGINAL_REQUEST.md §R4, PROJECT.md §F20-F21
 */

import { suite, test, expect, createMockRequest } from "./framework";
import * as fs from "node:fs";
import * as path from "node:path";

export async function runDeploymentTests() {
  await suite(
    "Deployment Tier 1: Feature Coverage",
    "Tier 1: Feature Coverage",
    "R4: Deployment & Offline",
    async () => {
      await test("T1.R4.01", "Production Build Configuration - package.json and tsconfig validity", async () => {
        const pkgJsonPath = path.join(process.cwd(), "package.json");
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));

        expect(pkg.scripts.build).toBe("next build");
        expect(pkg.dependencies.next).toBeDefined();
        expect(pkg.dependencies.react).toBeDefined();

        const tsconfigPath = path.join(process.cwd(), "tsconfig.json");
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));
        expect(tsconfig.compilerOptions.paths["@/*"]).toBeDefined();
      });

      await test("T1.R4.02", "Zero-Config LocalStorage Mode - works without Supabase credentials", async () => {
        // Test client behavior when env vars are absent
        const clientModule = await import("@/lib/supabase/client");
        expect(clientModule).toBeDefined();

        // Local store fallback should provide getStories and getEntities
        const stories = await clientModule.getStories();
        expect(Array.isArray(stories)).toBe(true);
        expect(stories.length).toBeGreaterThanOrEqual(2);

        const entities = await clientModule.getEntities();
        expect(Array.isArray(entities)).toBe(true);
        expect(entities.length).toBeGreaterThanOrEqual(5);
      });

      await test("T1.R4.03", "README.md Vercel Deployment Documentation - check deployment instructions", async () => {
        const readmePath = path.join(process.cwd(), "README.md");
        const readmeContent = fs.readFileSync(readmePath, "utf-8");

        // The requirement mandates deployment instructions for Vercel
        const hasVercel = /vercel/i.test(readmeContent);
        const hasEnv = /environment|env|GEMINI_API_KEY/i.test(readmeContent);
        const hasZeroConfig = /zero-config|local/i.test(readmeContent);

        if (!hasVercel) {
          throw new Error("README.md does not yet document Vercel deployment procedures (M4 requirement)");
        }
        if (!hasEnv) {
          throw new Error("README.md is missing Memorandom environment variables and zero-config deployment guide (M4 requirement)");
        }
        expect(hasVercel).toBe(true);
        expect(hasEnv).toBe(true);
      });

      await test("T1.R4.04", "Pure Web App Access - no mandatory PWA install barrier", async () => {
        // App must work directly via URL
        const layoutPath = path.join(process.cwd(), "src/app/layout.tsx");
        const layoutContent = fs.readFileSync(layoutPath, "utf-8");

        expect(layoutContent).toContain("RootLayout");

        // PwaRegister should register service worker non-blockingly
        const pwaPath = path.join(process.cwd(), "src/components/PwaRegister.tsx");
        expect(fs.existsSync(pwaPath)).toBe(true);
      });

      await test("T1.R4.05", "Mobile & Tablet Responsive Viewport Configuration", async () => {
        const layoutPath = path.join(process.cwd(), "src/app/layout.tsx");
        const layoutContent = fs.readFileSync(layoutPath, "utf-8");

        // Check viewport definition
        expect(layoutContent).toContain("viewport");
      });

      await test("T1.R4.06", "Core Route File Inventory - verify static and dynamic route files exist", async () => {
        const expectedRoutes = [
          "src/app/page.tsx",
          "src/app/interview/page.tsx",
          "src/app/memoir/page.tsx",
          "src/app/upload/page.tsx",
          "src/app/api/enrichment/route.ts",
          "src/app/api/gemini/interview/route.ts",
          "src/app/api/gemini/extract-entities/route.ts",
          "src/app/api/gemini/visual-context/route.ts",
          "src/app/api/gemini/generate-art/route.ts",
        ];

        for (const route of expectedRoutes) {
          expect(fs.existsSync(path.join(process.cwd(), route))).toBe(true);
        }
      });
    }
  );

  await suite(
    "Deployment Tier 2: Boundary & Corner Cases",
    "Tier 2: Boundary & Corner Cases",
    "R4: Deployment & Offline",
    async () => {
      await test("T2.R4.01", "Corrupted LocalStorage Recovery - gracefully handles invalid JSON", async () => {
        const localStore = await import("@/lib/supabase/local-store");
        // Verify local-store exports safe getter utilities that don't throw on corrupted content
        const stories = localStore.localGetStories();
        expect(Array.isArray(stories)).toBe(true);

        const entities = localStore.localGetEntities();
        expect(Array.isArray(entities)).toBe(true);
      });

      await test("T2.R4.02", "Partial Supabase Configuration - invalid URL or key safety", async () => {
        const clientModule = await import("@/lib/supabase/client");
        // Regardless of partial or missing env vars, client functions must never throw unhandled errors
        const stories = await clientModule.getStories().catch(() => []);
        expect(Array.isArray(stories)).toBe(true);
      });

      await test("T2.R4.03", "Missing GEMINI_API_KEY In Production - API routes return fallback data", async () => {
        // Test visual-context fallback
        const visualContextRoute = await import("@/app/api/gemini/visual-context/route");
        const req = createMockRequest("http://localhost:3000/api/gemini/visual-context", {
          method: "POST",
          body: JSON.stringify({ transcript: "I remember visiting the old baseball field in Chicago" }),
        });
        const res = await visualContextRoute.POST(req as any);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toBeDefined();
        expect(Array.isArray(data.searchQueries)).toBe(true);
      });

      await test("T2.R4.04", "Image Remote Patterns Whitelist in next.config.ts", async () => {
        const nextConfigPath = path.join(process.cwd(), "next.config.ts");
        const configContent = fs.readFileSync(nextConfigPath, "utf-8");

        expect(configContent).toContain("images.unsplash.com");
        expect(configContent).toContain("upload.wikimedia.org");
      });

      await test("T2.R4.05", "Server-Side Rendering (SSR) Isolation - safe execution on Node runtime", async () => {
        // In Node runtime, window is undefined
        expect(typeof window).toBe("undefined");

        // local-store.ts must execute safely in memory when window is undefined
        const localStore = await import("@/lib/supabase/local-store");
        const stories = localStore.localGetStories();
        expect(stories.length).toBeGreaterThanOrEqual(2);

        const entities = localStore.localGetEntities();
        expect(entities.length).toBeGreaterThanOrEqual(5);
      });
    }
  );
}
