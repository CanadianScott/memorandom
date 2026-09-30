# Project: Memorandom Feature Enhancement (R1-R5)

## Architecture
Memorandom is a Next.js 16 (Turbopack) and React 19 life-story interview PWA with dual data layers (Supabase PostgreSQL + zero-config LocalStorage fallback) and multimodal Gemini capabilities (Google GenAI SDK `@google/genai`).

Key subsystem boundaries:
1. **Catalog & Presentation Layer**:
   - `src/app/page.tsx` Server Component feeding `src/components/catalog/StoryCatalog.tsx` Client Component.
   - `src/app/biography/page.tsx` structured reference document with `src/app/biography/print.css`.
2. **Data & Storage Layer**:
   - `src/lib/supabase/local-store.ts`: In-memory and browser localStorage store with seed entities and stories.
   - `src/lib/supabase/client.ts`: Dual-mode client dispatching between live Supabase and local store.
3. **Gemini & Historical Intelligence Layer**:
   - `src/app/api/gemini/historical-context/route.ts`: New endpoint for era/location grounded prompts.
   - `src/lib/gemini/historical-context.ts`: Gemini 3.8 Flash + Google Search grounding (`tools: [{ googleSearch: {} }]`) + deterministic offline fallback matrix.
4. **Interview & Visual Stage Pipeline**:
   - `src/app/interview/page.tsx`: Interview coordinator managing conversation turns, BKG extraction, and historical prompt cadence.
   - `src/components/visual-stage/VisualStage.tsx`: Map (Leaflet), Archival Photos (Wikimedia/Unsplash), and AI Art (Imagen 3 / Nano Banana).
5. **Deployment & Environment**:
   - Vercel-ready Next.js 16 build (`npm run build`).
   - Zero-config LocalStorage fallback with no mandatory Supabase credentials.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Story Catalog Listing | Display all stories (not limited to 5) with entity tag chips on cards | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Catalog Sorting Controls | Sort controls for Recency, Location, People, and Timeline | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Entity Tag Filtering | Click entity tag to filter stories mentioning that entity; clear filter banner | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Seed Data Linkages | Seed story-entity linkages in `local-store.ts` so zero-config LocalStorage works with R1/R2 | M1 | Explorer 1 Survey |
| 5 | Catalog Responsive Layout | Mobile 1-col and tablet/desktop 2-col responsive grid with touch targets | M1 | ORIGINAL_REQUEST §R1 |
| 6 | Biography Route & Nav | `/biography` route with navigation link in top navbar | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Biographical Timeline Section | Chronological vertical timeline of eras, events, and linked story snippets | M2 | ORIGINAL_REQUEST §R2 |
| 8 | People & Relationships Section | Person cards with relationship metadata, mention count, and linked stories | M2 | ORIGINAL_REQUEST §R2 |
| 9 | Places Lived & Visited Section | Place cards with context, era associations, and linked stories | M2 | ORIGINAL_REQUEST §R2 |
| 10 | Key Events Section | Milestone event cards with dates, locations, and linked stories | M2 | ORIGINAL_REQUEST §R2 |
| 11 | Print/PDF Export Stylesheet | Dedicated print stylesheet for `/biography` (`print.css`) with page break rules | M2 | ORIGINAL_REQUEST §R2 |
| 12 | Historical Context API Endpoint | `/api/gemini/historical-context` accepting eras/locations/birthDecade | M3 | ORIGINAL_REQUEST §R3 |
| 13 | Dual-Source Gemini & Web Search | Gemini 3.8 Flash + Google Search grounding for hyperlocal news + offline fallback | M3 | ORIGINAL_REQUEST §R3 |
| 14 | Age/Era Appropriateness | Infantile amnesia cutoff (birthYear + 5) and reminiscence bump prioritization | M3 | ORIGINAL_REQUEST §R3 |
| 15 | Interview Loop Cadence | Turn count tracking and historical prompt injection at ~1 in 5-8 questions | M3 | ORIGINAL_REQUEST §R3 |
| 16 | Historical Visual Stage Triggers | Historical prompt metadata feeds Leaflet map query, archival photo query, art prompt | M3 | ORIGINAL_REQUEST §R3 |
| 17 | Visual Stage Tab Race Fix | Prevent photo query completion from overriding active Map tab on place mentions | M4 | Explorer 3 Survey (R5) |
| 18 | Remove False Chicago Fallback | Fix `interview.ts` and `visual-context.ts` to avoid forcing Chicago pins | M4 | Explorer 3 Survey (R5) |
| 19 | Visual Stage Pipeline Hardening | Use `visualQueries` from extraction, lower character guard, fix render setState | M4 | Explorer 3 Survey (R5) |
| 20 | Vercel Deployment Documentation | Comprehensive deployment instructions, env var matrix, link sharing in README.md | M4 | ORIGINAL_REQUEST §R4 |
| 21 | Clean Production Build Verification | Zero-error Turbopack build (`npm run build`) and production server verification | M5 | ORIGINAL_REQUEST §R4 |
| 22 | E2E Test Suite Execution | Pass 100% of requirement-driven E2E tests (Tiers 1-4) | M5 | Project Pattern |
| 23 | Adversarial Coverage Hardening | White-box stress testing and gap closure (Tier 5) | M5 | Project Pattern |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Data Layer & Story Catalog | F1, F2, F3, F4, F5 | none | DONE |
| M2 | Persistent Biographical Sketch | F6, F7, F8, F9, F10, F11 | M1 | DONE |
| M3 | Historically-Grounded Prompts | F12, F13, F14, F15, F16 | none | DONE |
| M4 | Visual Stage Fixes & Deployment | F17, F18, F19, F20 | M3 | DONE |
| M5 | Final Acceptance & E2E Test Pass | F21, F22, F23 | M1, M2, M3, M4 | DONE |

## Interface Contracts

### local-store ↔ client
```typescript
export function localGetStoryEntities(storyId?: string): StoryEntity[];
export function localLinkStoryEntities(storyId: string, entityIds: string[]): StoryEntity[];
```

### StoryCatalog Props
```typescript
export interface StoryCatalogProps {
  initialStories: StoryWithDetails[];
  initialEntities: Entity[];
}
```

### /api/gemini/historical-context Contract
```typescript
export interface HistoricalContextRequest {
  eras?: string[];
  locations?: string[];
  birthDecade?: string;
  birthYear?: number;
  limit?: number;
  excludeEventNames?: string[];
}

export interface HistoricalPromptItem {
  id: string;
  question: string;
  historicalEvent: string;
  yearOrEra: string;
  location: string;
  scope: "local" | "national";
  sourceType: "gemini_knowledge" | "web_search" | "fallback_matrix";
  sourceDetails?: string;
  followUps: string[];
  visualQuery: string;
  mapQuery: string;
  artPrompt: string;
}

export interface HistoricalContextResponse {
  prompts: HistoricalPromptItem[];
  metadata: {
    inferredBirthYear?: number;
    erasCovered: string[];
    locationsCovered: string[];
  };
}
```

## Code Layout
- `src/app/page.tsx`: Home page entry point hosting `<StoryCatalog />` and top nav
- `src/components/catalog/StoryCatalog.tsx`: Reactive story catalog with sort/filter controls
- `src/components/catalog/StoryCard.tsx`: Story card with tag chips and excerpt expander
- `src/app/biography/page.tsx`: Biographical sketch document page
- `src/app/biography/print.css`: Print / PDF stylesheet for biography
- `src/app/api/gemini/historical-context/route.ts`: Historical context API route
- `src/lib/gemini/historical-context.ts`: Core prompt generation logic and offline fallback matrix
- `src/lib/supabase/local-store.ts`: LocalStorage fallback store with seed entities & linkages
- `src/lib/supabase/client.ts`: Supabase & local-store unified client
- `src/app/interview/page.tsx`: Interview flow with turn counting and VisualStage coordination
- `src/components/visual-stage/VisualStage.tsx`: Multi-tab visual stage component
- `README.md`: Project documentation and Vercel deployment guide
- `tests/e2e/`: Opaque-box E2E test suites (Tiers 1-4)
