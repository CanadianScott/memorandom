## 2026-09-29T19:03:15Z

You are the Worker implementing Milestone 4 (Visual Stage Pipeline Fixes & Vercel Deployment Documentation, R4 & R5) for Memorandom.
Your working directory is: c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\worker_m4

MANDATORY: Read the authoritative user request at:
c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\ORIGINAL_REQUEST.md
and the master project specification at:
c:\Users\goate\Coding Projects\memorandom\PROJECT.md
and the survey report at:
c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\explorer_survey_deployment_visual\handoff.md
and the test infrastructure at:
c:\Users\goate\Coding Projects\memorandom\TEST_INFRA.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusively owned files:
- src/lib/gemini/interview.ts
- src/lib/gemini/visual-context.ts
- src/components/visual-stage/VisualStage.tsx
- src/app/interview/page.tsx
- README.md

Your task:
1. Fix Visual Stage End-to-End Pipeline (R5):
   - In `src/lib/gemini/interview.ts`: in `generateOfflineFallback`, do NOT hardcode `mapQuery: "Chicago, Illinois"` on every turn. Extract genuine place names if present; otherwise set `mapQuery` to `""` / `undefined`.
   - In `src/lib/gemini/visual-context.ts`: remove hardcoded `"Chicago"` fallback from `mapQueries`. Generate dynamic `searchQueries` matching the narrator's era and mentioned places.
   - In `src/app/interview/page.tsx`:
     - Fix tab override race condition: in `enrichVisuals`, do NOT flip the tab back to `"photos"` if a place location was just extracted or an active map pin is displayed.
     - In `triggerVisualEnrichment`: lower character threshold from 15 to 3 so concise place answers ("Paris", "Yellowstone") trigger visual enrichment.
     - Leverage `data.visualQueries` from `/api/gemini/extract-entities`.
   - In `src/components/visual-stage/VisualStage.tsx`:
     - Clean up render-phase `setState` (lines 64-81) to adhere to React 19 standards.
     - Ensure map pin rendering and archival photo carousels work seamlessly without runtime errors.
2. Vercel Deployment Documentation & Link Sharing (R4):
   - Replace generic create-next-app `README.md` with comprehensive documentation:
     - Project overview: Memorandom life-story interview PWA (Next.js 16, React 19, Gemini API, Supabase + LocalStorage fallback).
     - Features R1-R5 overview.
     - Step-by-step Vercel deployment guide (connecting repo, root directory, build command `npm run build`).
     - Environment variables matrix (`GEMINI_API_KEY`, optional `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, optional `UNSPLASH_ACCESS_KEY`).
     - Zero-config LocalStorage fallback documentation: explains that the app is 100% functional out of the box with zero credentials.
     - Browser URL access: instructions for sharing link with narrator (e.g. father on tablet/mobile Safari or Chrome without PWA installation).
3. Verification:
   - Run `npx tsx tests/e2e/run-all.ts` and verify that all 70/70 tests pass (including `[T1.R4.03]`).
   - Run `npm run build` and ensure exit code 0.
4. Write handoff report to:
c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\worker_m4\handoff.md
- Send a message to parent when done.
