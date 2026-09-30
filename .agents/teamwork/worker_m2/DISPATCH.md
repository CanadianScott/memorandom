## 2026-09-29T19:03:15Z
You are the Worker implementing Milestone 2 (Persistent Biographical Sketch, R2) for Memorandom.
Your working directory is: c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\worker_m2

MANDATORY: Read the authoritative user request at:
c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\ORIGINAL_REQUEST.md
and the master project specification at:
c:\Users\goate\Coding Projects\memorandom\PROJECT.md
and the survey report at:
c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\explorer_survey_catalog_bio\handoff.md
and the test infrastructure at:
c:\Users\goate\Coding Projects\memorandom\TEST_INFRA.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusively owned files:
- src/app/biography/page.tsx
- src/app/biography/print.css
- src/app/page.tsx (to add Biography link in navigation bar)
- public/sw.js (to append /biography to STATIC_ASSETS)

Your task:
1. In `src/app/page.tsx`:
   - Add a `<Link href="/biography">` navigation link in the top navigation bar alongside Upload and Memoir (using a BookUser or ScrollText icon from lucide-react).
2. Create `src/app/biography/page.tsx` ("use client"):
   - Maintain a running biographical sketch auto-populated from all BKG entities and stories (via getStories() and getEntities() from @/lib/supabase/client).
   - Render 4 structured sections:
     - **Timeline**: Chronological sequence of life eras and events from earliest to latest, with decade markers and linked story excerpts.
     - **People & Relationships**: Person entity cards with relationship context from metadata.relationship (e.g. "Childhood best friend", "Maternal grandmother"), mention counts, and linked stories.
     - **Places Lived & Visited**: Place entity cards with location/context from metadata, era associations, and linked stories.
     - **Key Events**: Event entity cards with dates, locations, descriptions, and linked stories (including deriving milestone events from seed road trip story if event entities are not yet created).
   - Include a Print / PDF Export button calling `window.print()`.
   - Provide jump navigation links (`#timeline`, `#people`, `#places`, `#events`).
   - Include top navigation bar with links to Home, Upload, Memoir.
   - Adhere strictly to React 19 / Next.js 16: derive sorted/filtered lists using useMemo; avoid synchronous setState in useEffect.
3. Create `src/app/biography/print.css`:
   - Clean, professional print stylesheet adapting src/app/memoir/print.css.
   - Sets `@page { size: letter portrait; margin: 1.5cm; }`.
   - Hides navigation buttons, print trigger, and jump links (`print:hidden`).
   - Prevents breaking cards or timeline entries across page breaks (`break-inside: avoid; page-break-inside: avoid;`).
4. In `public/sw.js`:
   - Append `'/biography'` to `STATIC_ASSETS`.
5. Verification:
   - Run `npx tsx tests/e2e/run-all.ts` and verify that `[T1.R2.01]` and all biography tests pass.
   - Run `npm run build` and verify clean Turbopack compile with exit code 0.
6. Write handoff report to:
c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\worker_m2\handoff.md
- Send a message to parent when done.
