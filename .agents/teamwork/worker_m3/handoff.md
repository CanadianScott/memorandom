# Milestone 3 Handoff Report: Historically-Grounded Interview Prompts (R3)

**Date**: 2026-09-29T19:03:00Z  
**Worker**: `worker_m3`  
**Milestone**: M3 (Historically-Grounded Interview Prompts, Features F12–F16)  
**Recipient**: `parent` (Orchestrator)  

---

## 1. Observation

All dispatch requirements for Milestone 3 (R3) have been implemented and verified in the codebase:

1. **Contracts Defined (`src/types/historical-context.ts`)**:
   - Declared `HistoricalContextRequest` (eras, locations, birthDecade, birthYear, limit, excludeEventNames).
   - Declared `HistoricalPromptItem` (id, question, historicalEvent, yearOrEra, location, scope, sourceType, sourceDetails, followUps, visualQuery, mapQuery, artPrompt).
   - Declared `HistoricalContextResponse` (prompts, metadata with inferredBirthYear, erasCovered, locationsCovered).
   - Declared `BiographicalProfile` (eras, places, estimatedBirthDecade, estimatedBirthYear).

2. **Core Logic & Offline Matrix (`src/lib/gemini/historical-context.ts`)**:
   - `inferBirthYearAndDecade`: Accurately maps era strings such as `"1950s Childhood"` to `birthYear: 1945` and `birthDecade: "1940s"`, and `"1960s College"` to `birthYear: 1940`.
   - Infantile amnesia cutoff: Guarantees no questions are generated for events before `birthYear + 5` (e.g. for born 1960, no events prior to 1965).
   - Reminiscence bump prioritization: Prioritizes memories formed between ages 10 and 25 (`[birthYear + 10, birthYear + 25]`).
   - Dual-source Gemini generation: Invokes `client.models.generateContent` with `model: "gemini-3.8-flash"` and Google Search Grounding (`tools: [{ googleSearch: {} }]`).
   - Deterministic offline matrix (`HISTORICAL_FALLBACK_MATRIX`): 38 evocative events spanning decades 1930s through 1990s across Chicago, New York, the Midwest, and National milestones (e.g., Chicago Blizzard of '67, Riverview Amusement Park, Marina City corncob towers, Daley Plaza Picasso, O'Hare 1955, Apollo 11, Beatles on Ed Sullivan, US Bicentennial, Blizzard of '78, 1985 Bears Super Bowl, 1991 Bulls).
   - Returns valid `question`, `visualQuery`, `mapQuery`, and `artPrompt` for each item.

3. **API Route Handler (`src/app/api/gemini/historical-context/route.ts`)**:
   - Implemented `POST` handler receiving `HistoricalContextRequest` payload, validating inputs, executing `getHistoricalContext`, and returning JSON matching `HistoricalContextResponse`.
   - Graceful fallback with HTTP 200 even on unexpected errors.

4. **Biographical Knowledge Graph Helper (`src/lib/interview/knowledge-graph.ts`)**:
   - Exported `getBiographicalProfile()` to extract known eras, places, and estimated birth decade/year from BKG state.

5. **Interview Flow Integration (`src/app/interview/page.tsx`)**:
   - Added `turnCount` tracking (via `turnCount` state and `turnCountRef` to prevent stale closures).
   - Added cadence check: Injects historical prompt when `turnCount >= 4 && (turnCount % 6 === 0 || turnCount % 7 === 0)` (~1 in 5-8 questions) and BKG has $\ge 1$ era or place entity.
   - In Classic mode: Speaks the historical question via `classicSpeak(nextQ)`, updates VisualStage tab (`setVisualStageTab("map" | "photos")`), triggers `enrichVisuals(item.visualQuery, item.mapQuery)`, and updates `artPrompt` with `item.artPrompt`.
   - UI Indicator: Displays a distinctive keepsake badge above the prompt heading:  
     `🏛️ Memory Spark: [Event Name]`.

---

## 2. Logic Chain

1. **Age and Memory Appropriateness**:
   - Elder autobiographical recall follows established cognitive science: infantile amnesia blocks episodic memory prior to age ~4-5, while the reminiscence bump produces peak vividness between ages 10 and 25.
   - Computing `minYear = birthYear + 5` filters out events the narrator could not remember.
   - Scoring candidate events with bonus points for `[birthYear + 10, birthYear + 25]` guarantees that the most emotionally resonant life-chapter prompts surface first.

2. **Zero-Config & Offline Reliability**:
   - In offline or zero-config environments (missing or invalid `GEMINI_API_KEY`), the app must continue working seamlessly without errors.
   - The deterministic offline fallback matrix covers all decades from the 1930s to the 1990s, matching the seed BKG entities (`"Chicago, Illinois"`, `"Yellowstone National Park"`, `"1950s Childhood"`).

3. **Interview Cadence & Conversational Continuity**:
   - A life-story interview should feel like a natural conversation rather than a rigid history quiz.
   - Injecting historical prompts at turns 6, 7, 12, 14 ensures a smooth cadence (~1 in 5-8 turns) that sparks memory without overwhelming the narrator's personal narrative.
   - Tagging prompts with `activeMemorySpark` renders a clear UI indicator so the narrator understands why the question is being asked.

---

## 3. Caveats

- In environments without an active Google GenAI API key, the system transparently utilizes the deterministic offline fallback matrix.
- When Google Search grounding is utilized via the Gemini API, network latency can vary depending on upstream response times; our fallback mechanism ensures no unhandled rejections occur.
- No changes were made outside the assigned exclusively owned files.

---

## 4. Conclusion

Milestone 3 (Historically-Grounded Interview Prompts, R3) is complete, robustly tested, and fully integrated into Memorandom. All 12 automated E2E tests pass cleanly, and the production build completes with zero errors.

---

## 5. Verification Method

1. **Automated E2E Historical Test Suite**:
   ```powershell
   npx tsx -e "import { runHistoricalTests } from './tests/e2e/historical.test'; import { globalTestContext, formatTerminalSummary } from './tests/e2e/framework'; async function main() { await runHistoricalTests(); const s = globalTestContext.getSummary(); const out = formatTerminalSummary(s); console.log(out.text); if (!out.success) process.exit(1); } main();"
   ```
   **Result**: 12/12 passed (6/6 Tier 1 Feature Coverage, 6/6 Tier 2 Boundary & Corner Cases).

2. **Endpoint Contract & NextRequest Verification**:
   - Successfully called `POST` on `/api/gemini/historical-context` with payload `{"eras": ["1950s Childhood"], "locations": ["Chicago, Illinois"]}`.
   - Confirmed status 200, inferred birth year 1945, and received local Chicago prompts (e.g., Marina City, Chicago Blizzard of '67, Daley Plaza Picasso) with complete metadata (`visualQuery`, `mapQuery`, `artPrompt`).

3. **Production Turbopack Build**:
   ```powershell
   npm run build
   ```
   **Result**: Clean compilation, TypeScript check passed in 1.9s, static page generation passed (16/16), exit code 0.
