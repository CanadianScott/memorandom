# Original User Request

## 2026-09-29T18:39:26Z

Enhance the existing Memorandom life-story interview PWA (Next.js 16, React 19, Gemini API, Supabase + LocalStorage) with four new capabilities: a sortable story catalog on the front page, a persistent biographical sketch document, historically-grounded interview prompts that use both Gemini's knowledge and web search for local newspaper archives, and Vercel deployment so the user's father can access the app by clicking a link.

This is a working demo / functional prototype — rough edges are acceptable; the user will iterate.

Working directory: c:\Users\goate\Coding Projects\memorandom
Integrity mode: development

## Key Context

This is an existing, substantial Next.js 16 codebase with:
- **App Router** structure under `src/app/` with pages: `/` (home), `/interview` (voice-first life story session), `/memoir` (digital keepsake book), `/upload` (photo/document ingestion)
- **Gemini API routes** under `src/app/api/gemini/` for interview, entity extraction, visual context, art generation, privacy scanning, live token
- **Dual data layer**: Supabase PostgreSQL (schema in `supabase/migrations/001_initial_schema.sql`) AND a complete LocalStorage fallback with seed data (`src/lib/supabase/local-store.ts`). LocalStorage should be primary for zero-config use; Supabase syncs when configured.
- **Biographical Knowledge Graph (BKG)**: Entities (person, place, era, event) extracted during interviews, stored in `entities` table / localStorage
- **Visual Stage**: Split-screen component (`src/components/visual-stage/VisualStage.tsx`) showing maps (Leaflet), archival photos (Wikimedia/Unsplash), and AI illustrations during interviews
- **Voice engines**: Gemini Live (WebSocket real-time) and Classic (Web Speech API turn-by-turn) modes in `src/app/interview/page.tsx`
- **Interview skill spec**: `.agents/skills/life-story-interviewer/SKILL.md` defines the empathetic biographer persona, 4-layer probing framework, and Visual Stage coordination
- **Environment**: `GEMINI_API_KEY`, optional `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, optional `UNSPLASH_ACCESS_KEY`
- **Build**: `npm run build`, `npm run dev`, `npm run lint`
- **Existing pre-ship blocker**: Topic Avoidance List (onboarding for off-limits topics) — documented in `handoff.md` but NOT in scope for this task

## Requirements

### R1. Sortable Story Catalog on Front Page
The existing home page (`src/app/page.tsx`) shows a flat "Recent Stories" list limited to 5 items. Replace it with a full story catalog showing ALL stories, where each card displays associated entity tags (people, places, eras). Add controls to sort by: **location** (group by place entities), **people** (group by person entities), **timeline** (chronological by era tags / decade), and **recency** (default, by `created_at`). Clicking an entity tag filters to show all stories mentioning that entity. Must work with both the LocalStorage seed data (which has 2 seed stories and 5 seed entities) and live Supabase data.

### R2. Persistent Biographical Sketch Document
Add a `/biography` page accessible from the main navigation. This page maintains a running biographical sketch — a structured reference document auto-populated from all BKG entities and stories collected across interview sessions. Sections: **Timeline** (chronological life events), **People & Relationships** (person entities with relationship context from metadata), **Places Lived & Visited** (place entities with era context), **Key Events** (event entities with stories linked). Include print/PDF export via a print stylesheet (pattern already exists in `src/app/memoir/print.css`). This is the "document of story and biographical details we can come back to later."

### R3. Historically-Grounded Interview Prompts
Once the BKG has enough data to establish a rough biographical sketch (birth decade, places lived), the interview system should periodically inject historically-grounded questions. Use a two-source approach:
1. **Gemini knowledge**: Ask Gemini to generate era-appropriate prompts based on the narrator's known locations + eras (e.g., "Where were you when Neil Armstrong walked on the moon in July 1969?", "Do you remember the blizzard of '78?")
2. **Web search for local context**: When a narrator lived in a specific city during a specific decade, search publicly available sources (newspaper archives, Wikipedia local history) for notable local events from that era to generate hyperlocal prompts (e.g., "The new civic center opened in your hometown in 1972 — did you go to the grand opening?")

Add a `/api/gemini/historical-context` endpoint. Integrate into the interview flow so roughly 1 in every 5-8 questions references a historical event contextually relevant to the narrator's life. Historical prompts must be age-appropriate (don't ask about events before the narrator was born or too young to remember).

### R4. Vercel Deployment & Link Sharing
Ensure `npm run build` succeeds cleanly. The app must work as a pure web app via URL in mobile Safari and Chrome — no "Add to Home Screen" required, no app store. Add deployment instructions to `README.md` for Vercel (free tier). The existing PWA manifest and service worker in `public/` are bonuses but not required for basic web access.

### R5. Visual Stage End-to-End Verification
Verify the Visual Stage works during conversation mode. The existing code in `src/app/interview/page.tsx` already wires entity extraction → map updates, visual queries → photo carousel, and art prompts. Ensure this pipeline works end-to-end: when a user mentions a place in Classic mode (text input), a map pin should appear; when they mention an era-specific scene, archival photos should populate. Fix any broken connections in the pipeline.

## Acceptance Criteria

### Story Catalog
- [ ] Home page displays all stories (not limited to 5) with entity tags visible on each card
- [ ] Sort controls present: location, people, timeline, recency
- [ ] Clicking an entity tag filters the story list to stories mentioning that entity
- [ ] Works with LocalStorage seed data (2 stories, 5 entities) out of the box
- [ ] Tablet-friendly responsive layout

### Biographical Sketch
- [ ] `/biography` page renders structured biographical document with Timeline, People, Places, Events sections
- [ ] Content auto-populates from existing BKG entities and stories in localStorage/Supabase
- [ ] Print/PDF export works via browser print
- [ ] Navigation link added to main nav bar

### Historical Prompts
- [ ] `/api/gemini/historical-context` endpoint exists, accepts narrator's eras/locations, returns contextual prompts
- [ ] Interview flow integrates historical prompts at ~1 per 5-8 questions when BKG data is sufficient
- [ ] Prompts are age/era-appropriate (no events before narrator's likely memory)
- [ ] At least some prompts reference location-specific events (not just national headlines)

### Deployment
- [ ] `npm run build` succeeds with zero errors
- [ ] App loads and functions in a browser via URL (verified by running `npm run build && npm start`)
- [ ] README.md includes Vercel deployment steps
- [ ] App works without Supabase configured (LocalStorage fallback handles everything)

### Visual Stage
- [ ] In Classic mode, typing a memory about a specific place updates the map with a pin
- [ ] Typing an era-specific memory triggers archival photo search
- [ ] Art prompt state updates with narrative content
- [ ] No runtime errors in the Visual Stage component pipeline
