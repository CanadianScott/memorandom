# Progress — Worker M3 (Historically-Grounded Interview Prompts)

Last visited: 2026-09-29T19:02:00Z

## Status
- [x] Read DISPATCH.md, ORIGINAL_REQUEST.md, PROJECT.md, and explorer handoff report
- [x] Initialize BRIEFING.md and progress.md
- [x] 1. Create `src/types/historical-context.ts`
- [x] 2. Implement `src/lib/gemini/historical-context.ts`
  - [x] Infantile amnesia cutoff (`birthYear + 5`)
  - [x] Reminiscence bump prioritization (ages 10-25)
  - [x] Birth year / decade inference from BKG era entities (e.g., "1950s Childhood" -> 1945)
  - [x] Gemini 3.8 Flash invocation with Google Search grounding (`tools: [{ googleSearch: {} }]`)
  - [x] Deterministic offline fallback matrix covering decades 1930s-1990s across Chicago, NY, Midwest, and National
- [x] 3. Create route handler `src/app/api/gemini/historical-context/route.ts`
- [x] 4. In `src/lib/interview/knowledge-graph.ts`, add `getBiographicalProfile()`
- [x] 5. In `src/app/interview/page.tsx`:
  - [x] `turnCount` tracking across conversation turns
  - [x] Historical prompt injection when `turnCount >= 4` and `(turnCount % 6 === 0 || turnCount % 7 === 0)`
  - [x] VisualStage tab update (`map` or `photos`), visual queries enrichment, and `artPrompt` setting
  - [x] Audio synthesis via `classicSpeak`
  - [x] "🏛️ Memory Spark: [Event Name]" UI badge above the prompt heading
- [x] 6. Verification:
  - [x] Ran 12/12 E2E historical tests in `tests/e2e/historical.test.ts` (100% pass)
  - [x] Ran NextRequest route handler test against `/api/gemini/historical-context`
  - [x] Ran `npm run build` with exit code 0
- [x] 7. Write handoff report and notify parent
