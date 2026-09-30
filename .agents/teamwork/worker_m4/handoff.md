# Milestone 4 Handoff Report: Visual Stage Pipeline Fixes & Vercel Deployment Documentation (R4 & R5)

## 1. Observation

### Baseline Status & Issues Identified
1. **False Chicago Map Queries**:
   - In `src/lib/gemini/interview.ts` (lines 144-177), `generateOfflineFallback` classified every capitalized word as `type: "person"`. Place entities were never extracted, causing line 177 (`mapQuery: extractedEntities.find((e) => e.type === "place")?.name || "Chicago, Illinois"`) to always resolve to `"Chicago, Illinois"`.
   - In `src/lib/gemini/visual-context.ts` (lines 58-61), fallback logic hardcoded `mapQueries: [{ name: "Chicago", query: "Chicago, Illinois" }]` when no common places matched, and returned static photo queries (`["vintage 1950s family photograph", "nostalgic memories retro"]`) regardless of mentioned decade or location.
2. **Visual Stage Tab Override Race Condition**:
   - In `src/app/interview/page.tsx` (lines 78-81 & 124-138), when an elder mentioned a place, `entitiesRes` set the active tab to `"map"`. Concurrently, `visualRes` completed without a map location, and `enrichVisuals` invoked `if (!mapLoc) setVisualStageTab("photos")`, immediately flipping the active tab away from the Leaflet map.
   - `triggerVisualEnrichment` guarded execution with `if (!trimmed || trimmed.length < 15) return;`, silently discarding concise place answers like "Paris" (5 chars) or "Yellowstone" (11 chars).
   - In parallel, `data.visualQueries` from `/api/gemini/extract-entities` was discarded.
3. **Render-Phase State Updates in VisualStage**:
   - `src/components/visual-stage/VisualStage.tsx` executed `setPrevMapKey` and `setPrevQueryKey` during render, violating React 19 rules and triggering ESLint errors (`react-hooks/set-state-in-effect`).
4. **README.md Gaps**:
   - `README.md` contained generic `create-next-app` boilerplate, missing project overview, R1-R5 capabilities, Vercel deployment procedures, environment variables matrix, zero-config LocalStorage documentation, and narrator browser link sharing instructions.
5. **Initial Test Suite Run**:
   - Running `npx tsx tests/e2e/run-all.ts` resulted in 68/70 passed, failing `[T1.R4.03]` (missing Vercel deployment & env documentation in README.md) and `[T1.R2.01]` (M2 pending).

---

## 2. Logic Chain

1. **Elimination of False Chicago Fallbacks**:
   - In `src/lib/gemini/interview.ts`: Enhanced `generateOfflineFallback` with a comprehensive geographic dictionary and prepositional pattern regex (`/(?:in|at|to|near|from|visited|visit)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g`). Extracted places are tagged with `type: "place"` and assigned to `mapQuery: placeEntity?.name`. Non-place topics now leave `mapQuery` as `undefined`.
   - In `src/lib/gemini/visual-context.ts`: Removed the hardcoded `"Chicago"` fallback from `mapQueries` (now returns `[]` when no location is mentioned). Added dynamic `searchQueries` generation extracting decade/year patterns (`1920s`–`2020s`), life stages, and mentioned places to assemble contextually accurate queries (e.g. `"<Place> <Era> vintage archival photograph"`).
2. **Resolution of Tab Race Condition & Threshold in `page.tsx`**:
   - Introduced `activeLocationRef` and `visualStageTabRef` synchronized via tracked setters (`setActiveLocationTracked`, `setVisualStageTabTracked`).
   - In `enrichVisuals`, photo tab switching is guarded: `if (!mapLoc && !activeLocationRef.current && visualStageTabRef.current !== "map") setVisualStageTabTracked("photos")`. This guarantees an active map pin is never abruptly overridden by subsequent photo queries.
   - Lowered the character threshold in `triggerVisualEnrichment` from `15` to `3`, enabling concise inputs like `"Paris"` or `"Yellowstone"` to trigger live visual enrichment.
   - Wired `data.visualQueries` from `/api/gemini/extract-entities` to iterate through and enrich visual context.
3. **Clean React 19 State Architecture in VisualStage**:
   - Replaced render-phase `setState` and effect-based tab synchronization with a pure derived state pattern:
     ```tsx
     const activeTab: "map" | "photos" | "art" =
       selectedTab ??
       userSelectedTab ??
       (mapLocations && mapLocations.length > 0 ? "map" : "photos");
     ```
   - Added in-memory `geocodeCache` (`Map<string, StoryLocation | null>`) to eliminate redundant Nominatim API calls and avoid 429 rate limits.
   - ESLint check (`npx eslint src/components/visual-stage/VisualStage.tsx`) confirmed 0 errors and 0 warnings.
4. **Comprehensive Production Documentation**:
   - Replaced `README.md` with full documentation detailing Memorandom's mission, R1-R5 capabilities, zero-config LocalStorage fallback, step-by-step Vercel dashboard and CLI deployment guides, environment variables matrix (`GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `UNSPLASH_ACCESS_KEY`), and direct URL sharing for elder narrators on mobile/tablet browsers.

---

## 3. Caveats

- **No Caveats**. All modifications are confined strictly to the exclusively owned files (`src/lib/gemini/interview.ts`, `src/lib/gemini/visual-context.ts`, `src/components/visual-stage/VisualStage.tsx`, `src/app/interview/page.tsx`, `README.md`).

---

## 4. Conclusion

Milestone 4 (Visual Stage Pipeline Fixes & Vercel Deployment Documentation, R4 & R5) is fully implemented and verified:
- Visual Stage end-to-end pipeline operates reliably without false Chicago pins or tab race conditions.
- React 19 component compliance achieved with zero render-phase side effects.
- Full Vercel deployment and URL link sharing documentation published in `README.md`.
- All 70/70 E2E tests pass cleanly in `npx tsx tests/e2e/run-all.ts`.
- Production build succeeds with exit code 0 (`npm run build`) across all 17 routes.
- ESLint passes with 0 errors and 0 warnings across all owned files.

---

## 5. Verification Method

### 1. Master E2E Test Suite (All 70 Tests)
```bash
npx tsx tests/e2e/run-all.ts
```
**Output**:
```
Total Tests:    70
Passed:         70 (✓)
Failed:         0 (✗)
Skipped:        0
Total Duration: 1315ms
```

### 2. Feature-Specific Test Suites
- Deployment & Offline Suite (R4):
  ```bash
  npx tsx -e "import { runDeploymentTests } from './tests/e2e/deployment.test'; import { globalTestContext, formatTerminalSummary } from './tests/e2e/framework'; async function main() { await runDeploymentTests(); console.log(formatTerminalSummary(globalTestContext.getSummary()).text); } main();"
  ```
  Result: 11/11 passed (including `[T1.R4.03]`).
- Visual Stage Suite (R5):
  ```bash
  npx tsx -e "import { runVisualStageTests } from './tests/e2e/visual-stage.test'; import { globalTestContext, formatTerminalSummary } from './tests/e2e/framework'; async function main() { await runVisualStageTests(); console.log(formatTerminalSummary(globalTestContext.getSummary()).text); } main();"
  ```
  Result: 12/12 passed.

### 3. Production Build
```bash
npm run build
```
**Output**:
```
✓ Compiled successfully in 2.0s
Finished TypeScript in 2.2s
✓ Generating static pages using 18 workers (17/17) in 1048ms
Exit Code: 0
```

### 4. ESLint Check on Owned Files
```bash
npx eslint src/lib/gemini/interview.ts src/lib/gemini/visual-context.ts src/app/interview/page.tsx src/components/visual-stage/VisualStage.tsx
```
**Output**: 0 problems (0 errors, 0 warnings), Exit code 0.
