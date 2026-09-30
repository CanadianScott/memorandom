# BRIEFING — 2026-09-29T19:02:00Z

## Mission
Implement Milestone 3 (Historically-Grounded Interview Prompts, R3) for Memorandom: contracts, Gemini search-grounded logic, deterministic offline fallback matrix, biographical profile helper, and interview flow integration.

## 🔒 My Identity
- Archetype: implementer
- Roles: implementer, qa, specialist
- Working directory: c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\worker_m3
- Original parent: 3d0ea5da-8a06-4d98-a014-ecc1fb35d339
- Milestone: Milestone 3 (Historically-Grounded Interview Prompts, R3)

## 🔒 Key Constraints
- Exclusively owned files:
  - `src/types/historical-context.ts`
  - `src/lib/gemini/historical-context.ts`
  - `src/app/api/gemini/historical-context/route.ts`
  - `src/lib/interview/knowledge-graph.ts`
  - `src/app/interview/page.tsx`
- Age/era heuristics: infer birth year from BKG era entities (e.g. "1950s Childhood" -> ~1945); enforce infantile amnesia cutoff (never ask about events before `birthYear + 5`); prioritize reminiscence bump (ages 10-25).
- Dual-source prompt generation: use Gemini 3.8 Flash model invocation via `@google/genai` with Google Search grounding (`tools: [{ googleSearch: {} }]`) for hyperlocal events.
- Extensive deterministic offline fallback matrix (decades 1930s-1990s, Chicago/NY/Midwest/National) so it returns rich local and national historical prompts even without API keys or when offline.
- Return valid `question`, `visualQuery`, `mapQuery`, `artPrompt`.
- In `src/lib/interview/knowledge-graph.ts`: add helper `getBiographicalProfile()` extracting known eras, places, and estimated birth decade from current BKG state.
- In `src/app/interview/page.tsx`:
  - Add `turnCount` tracking.
  - When `turnCount >= 4` and `(turnCount % 6 === 0 || turnCount % 7 === 0)` (~1 in 5-8 questions) and BKG has >= 1 era or place entity, inject historical prompt into `currentPrompt`.
  - In Classic mode: speak the historical question via `classicSpeak`, update VisualStage tab and enrich visuals with `mapQuery` and `visualQuery`, and set `artPrompt`.
  - Display a visual UI indicator ("🏛️ Memory Spark: [Event Name]") above the prompt.
- Verification: Run `npm run build` and test the endpoint. Verify exit code 0.

## Current Parent
- Conversation ID: 3d0ea5da-8a06-4d98-a014-ecc1fb35d339
- Updated: 2026-09-29T19:02:00Z

## Task Summary
- **What to build**: Full R3 historical prompt system: TypeScript contracts, Gemini service with Google Search grounding & offline matrix, API route, BKG biographical profile extractor, and interview coordinator wiring with UI Memory Spark indicator.
- **Success criteria**: Age/era appropriate questions, search grounded / local events, offline fallback working, interview turn triggers, VisualStage updates, `npm run build` exits 0.
- **Interface contracts**: PROJECT.md § /api/gemini/historical-context Contract
- **Code layout**: PROJECT.md § Code Layout

## Key Decisions Made
- Used `@google/genai` SDK `client.models.generateContent` with `tools: [{ googleSearch: {} }]` for live search grounding.
- Designed comprehensive fallback database with 38 rich events across 1930s-1990s in Chicago, New York, Midwest, and National scopes.
- Applied infantile amnesia cutoff (`birthYear + 5`) and reminiscence bump weighting (`[birthYear + 10, birthYear + 25]`).
- Wired turn count tracking in `src/app/interview/page.tsx` and injected historical prompts at cadence `turnCount >= 4 && (turnCount % 6 === 0 || turnCount % 7 === 0)`.
- Added visual Memory Spark badge `"🏛️ Memory Spark: [Event Name]"` above the prompt in `page.tsx`.

## Change Tracker
- **Files modified**:
  - `src/types/historical-context.ts`: Contracts for request, prompt items, response, and biographical profile.
  - `src/lib/gemini/historical-context.ts`: Gemini 3.8 Flash search-grounding and 38-item deterministic offline fallback matrix.
  - `src/app/api/gemini/historical-context/route.ts`: POST route handler.
  - `src/lib/interview/knowledge-graph.ts`: Added `getBiographicalProfile()`.
  - `src/app/interview/page.tsx`: Turn counting, historical injection on turns 6, 7, 12, etc., VisualStage triggers, and Memory Spark UI badge.
- **Build status**: PASS (`npm run build` exit code 0).
- **Pending issues**: None.

## Quality Status
- **Build/test result**: Pass. 12/12 E2E tests in `tests/e2e/historical.test.ts` pass cleanly.
- **Lint status**: 0 errors.
- **Tests added/modified**: Verified against `tests/e2e/historical.test.ts`.

## Artifact Index
- `src/types/historical-context.ts` — Type definitions for historical prompt request and response
- `src/lib/gemini/historical-context.ts` — Inference heuristics, search-grounded Gemini generation & fallback matrix
- `src/app/api/gemini/historical-context/route.ts` — API route handler
- `src/lib/interview/knowledge-graph.ts` — `getBiographicalProfile()` implementation
- `src/app/interview/page.tsx` — Turn tracking, injection cadence, VisualStage sync, Memory Spark UI
