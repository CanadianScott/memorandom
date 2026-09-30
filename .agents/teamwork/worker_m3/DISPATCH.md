## 2026-09-29T18:51:41Z

You are the Worker implementing Milestone 3 (Historically-Grounded Interview Prompts, R3) for Memorandom.
Your working directory is: c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\worker_m3

MANDATORY: Read the authoritative user request at:
c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\ORIGINAL_REQUEST.md
and the master project specification at:
c:\Users\goate\Coding Projects\memorandom\PROJECT.md
and the survey report at:
c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\explorer_survey_historical_prompts\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusively owned files:
- src/types/historical-context.ts
- src/lib/gemini/historical-context.ts
- src/app/api/gemini/historical-context/route.ts
- src/lib/interview/knowledge-graph.ts
- src/app/interview/page.tsx

Your task:
1. Create `src/types/historical-context.ts` defining contracts for `HistoricalContextRequest`, `HistoricalPromptItem`, `HistoricalContextResponse`.
2. Implement `src/lib/gemini/historical-context.ts`:
   - Age/era heuristics: infer birth year from BKG era entities (e.g. "1950s Childhood" -> ~1945); enforce infantile amnesia cutoff (never ask about events before `birthYear + 5`); prioritize reminiscence bump (ages 10-25).
   - Dual-source prompt generation: use Gemini 3.8 Flash model invocation via `@google/genai` with Google Search grounding (`tools: [{ googleSearch: {} }]`) for hyperlocal events (newspaper archives, local openings, weather).
   - Provide an extensive deterministic offline fallback matrix (decades 1930s-1990s, Chicago/NY/Midwest/National) so it returns rich local and national historical prompts even without API keys or when offline.
   - Return valid `question`, `visualQuery`, `mapQuery`, `artPrompt`.
3. Create route handler `src/app/api/gemini/historical-context/route.ts`.
4. In `src/lib/interview/knowledge-graph.ts`: add helper `getBiographicalProfile()` extracting known eras, places, and estimated birth decade from current BKG state.
5. In `src/app/interview/page.tsx`:
   - Add `turnCount` tracking.
   - When `turnCount >= 4` and `(turnCount % 6 === 0 || turnCount % 7 === 0)` (~1 in 5-8 questions) and BKG has >= 1 era or place entity, inject historical prompt into `currentPrompt`.
   - In Classic mode: speak the historical question via `classicSpeak`, update VisualStage tab and enrich visuals with `mapQuery` and `visualQuery`, and set `artPrompt`.
   - Display a visual UI indicator ("🏛️ Memory Spark: [Event Name]") above the prompt.
6. Verification:
   - Run `npm run build` and test the endpoint. Verify exit code 0.
   - Document verification results in your handoff report.
7. Write your handoff report to:
c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\worker_m3\handoff.md
- Send a message to parent when done.
