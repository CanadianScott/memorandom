## 2026-09-29T18:51:41Z

You are the Worker implementing Milestone 1 (Data Layer & Sortable Story Catalog, R1) for Memorandom.
Your working directory is: c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\worker_m1

MANDATORY: Read the authoritative user request at:
c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\ORIGINAL_REQUEST.md
and the master project specification at:
c:\Users\goate\Coding Projects\memorandom\PROJECT.md
and the survey report at:
c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\explorer_survey_catalog_bio\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusively owned files:
- src/lib/supabase/local-store.ts
- src/lib/supabase/client.ts
- src/components/catalog/StoryCatalog.tsx
- src/components/catalog/StoryCard.tsx
- src/app/page.tsx

Your task:
1. In `src/lib/supabase/local-store.ts`:
   - Add `SEED_STORY_ENTITIES` linking seed stories (`story-seed-1` and `story-seed-2`) to seed entities (Billy Miller, Chicago, 1950s Childhood, Yellowstone, Grandma Rose).
   - Initialize `memoryStore[STORAGE_KEYS.STORY_ENTITIES]` with `SEED_STORY_ENTITIES`.
   - Export `localGetStoryEntities(storyId?: string): StoryEntity[]`.
2. In `src/lib/supabase/client.ts`:
   - Update `getLocalStoriesWithDetails` to call `localGetStoryEntities()`, join with `localGetEntities()`, and merge any era tags into `story_entities`.
3. Create `src/components/catalog/StoryCatalog.tsx` ("use client") and `src/components/catalog/StoryCard.tsx`:
   - Display ALL stories (not limited to 5) with entity tags visible on each card (people, places, eras).
   - Sort controls: Location (grouped by place), People (grouped by person), Timeline (chronological by era/decade), and Recency (default, by created_at).
   - Entity tag clicking filters stories to only those mentioning the entity, with a clear filter banner showing active entity and story count.
   - Responsive grid: 1 column mobile, 2 columns tablet/desktop.
   - Adhere to React 19 / Next.js 16 rules: avoid synchronous setState in useEffect; compute sorted/filtered lists using useMemo.
4. In `src/app/page.tsx`:
   - Replace the 5-item Recent Stories section with `<StoryCatalog initialStories={allStories} initialEntities={entities} />`. Ensure the top navigation remains intact.
5. Verification:
   - Run `npm run build` and ensure exit code 0 with clean compile.
   - Document verification results in your handoff report.
6. Write your handoff report to:
c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\worker_m1\handoff.md
- Send a message to parent when done.
