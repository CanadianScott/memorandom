# Explorer Survey Report: Sortable Story Catalog (R1) & Persistent Biographical Sketch (R2)

## 1. Observation

### 1.1 Existing Architecture & File Inventory
The Memorandom application is built on Next.js 16.3.7 (Turbopack), React 19.2.8, Tailwind CSS v4 (`@theme`), Lucide React v1.48.0, and Supabase client v2.117.2 with a full local-storage fallback.

Key investigated files and line references:
- **`src/app/page.tsx`** (115 lines):
  - Line 4: `import { getStories, getEntities } from "@/lib/supabase/client";`
  - Lines 7-8: `const stories = await getStories({ limit: 5 }).catch(() => []); const allStories = await getStories().catch(() => []);`
  - Lines 17-26: Navigation element:
    ```tsx
    <nav className="p-6 flex justify-end gap-6 border-b border-warm-brown/10">
      <Link href="/upload" className="flex items-center gap-2 text-warm-brown hover:text-warm-brown/80 font-medium">
        <Upload className="w-4 h-4" />
        Upload
      </Link>
      <Link href="/memoir" className="flex items-center gap-2 text-warm-brown hover:text-warm-brown/80 font-medium">
        <BookOpen className="w-4 h-4" />
        Memoir
      </Link>
    </nav>
    ```
  - Lines 89-110: "Recent Stories" section rendering a flat list limited to `stories` (`limit: 5`) with title, transcript snippet (line-clamp-1), and date badge, but **no entity tags**, **no sorting controls**, and **no filtering**.
- **`src/lib/supabase/local-store.ts`** (362 lines):
  - Lines 15-23: `STORAGE_KEYS` includes `ENTITIES`, `STORIES`, `STORY_ENTITIES`.
  - Lines 39-90: `SEED_ENTITIES` contains 5 entities:
    1. `entity-seed-1`: "Billy Miller" (`type: "person"`, `metadata: { relationship: "Childhood best friend" }`)
    2. `entity-seed-2`: "Yellowstone National Park" (`type: "place"`, `metadata: { location: "Wyoming", context: "1965 family road trip" }`)
    3. `entity-seed-3`: "Grandma Rose" (`type: "person"`, `metadata: { relationship: "Maternal grandmother" }`)
    4. `entity-seed-4`: "Chicago, Illinois" (`type: "place"`, `metadata: { context: "Hometown neighborhood" }`)
    5. `entity-seed-5`: "1950s Childhood" (`type: "era"`, `metadata: { years: "1950-1960" }`)
    *(Note: 0 entities of `type: "event"` exist in the initial seed)*.
  - Lines 92-117: `SEED_STORIES` contains 2 stories:
    1. `story-seed-1`: "Sandlot Baseball on Miller's Field", `era_tags: ["1950s Childhood"]`
    2. `story-seed-2`: "The Great Yellowstone Road Trip of '65", `era_tags: ["1960s Travels"]`
  - Line 30: `memoryStore[STORAGE_KEYS.STORY_ENTITIES]: []` (No seed links!).
  - Lines 281-291:
    ```ts
    export function localLinkStoryEntities(storyId: string, entityIds: string[]): StoryEntity[] {
      const links = getArray<StoryEntity>(STORAGE_KEYS.STORY_ENTITIES);
      const newLinks: StoryEntity[] = entityIds.map((entityId) => ({
        story_id: storyId,
        entity_id: entityId,
        confidence: 1.0,
      }));
      links.push(...newLinks);
      saveArray(STORAGE_KEYS.STORY_ENTITIES, links);
      return newLinks;
    }
    ```
    *(Note: There is NO `localGetStoryEntities` function exported anywhere in `local-store.ts`)*.
- **`src/lib/supabase/client.ts`** (456 lines):
  - Lines 143-151:
    ```ts
    export type StoryWithDetails = Story & {
      story_entities: (StoryEntity & { entities: Entity | null })[];
      story_media: {
        story_id: string;
        media_id: string;
        display_order: number;
        media: Media | null;
      }[];
    };
    ```
  - Lines 203-230 (`getLocalStoriesWithDetails`):
    ```ts
    function getLocalStoriesWithDetails(options?: GetStoriesOptions): StoryWithDetails[] {
      let stories = localGetStories();
      ...
      const allEntities = localGetEntities();
      return stories.map((s) => ({
        ...s,
        story_entities: (s.era_tags || []).map((tag) => {
          const matchedEntity = allEntities.find((e) => e.name === tag) || null;
          return {
            id: `link-${s.id}-${tag}`,
            story_id: s.id,
            entity_id: matchedEntity?.id || tag,
            confidence: 1.0,
            created_at: s.created_at,
            entities: matchedEntity,
          };
        }),
        story_media: [],
      }));
    }
    ```
    *(Direct observation: `getLocalStoriesWithDetails` completely ignores `STORAGE_KEYS.STORY_ENTITIES`. It only maps `s.era_tags`. For `story-seed-1`, it produces only 1 entity (`1950s Childhood`), missing Billy Miller and Chicago. For `story-seed-2`, `era_tags` is `["1960s Travels"]` which does not match any entity in `SEED_ENTITIES`, producing `entities: null`)*.
- **`src/app/memoir/page.tsx` & `src/app/memoir/print.css`**:
  - `page.tsx` is `"use client"` and uses `useEffect` to call `getStories()` and `getEntities()`.
  - Line 62-64: `handlePrint = () => { window.print(); }`
  - `print.css` (28 lines): Sets `@media print` with `@page { margin: 2cm; }`, background white, color black, `.print-chapter-break { page-break-before: always; }`, `.print-story-break { page-break-inside: avoid; margin-bottom: 3rem; }`, `overflow: visible !important`.
- **`src/types/database.ts`**:
  - Entity types: `'person' | 'place' | 'era' | 'event'`.
  - Metadata interfaces: `PersonMetadata` (relationship, birth_year), `PlaceMetadata` (location, context, lat, lng), `EraMetadata` (start_year, end_year, label, years), `EventMetadata` (date, location).
- **Build & Verification Runs**:
  - `npm run build`: Exit code 0. Next.js 16 compiled 15 static routes successfully in Turbopack.
  - `npm run lint`: Flagged existing React 19 hook issues in `ArtGenerator.tsx` and `VisualStage.tsx` where synchronous `setState` in `useEffect` violates the new lint rules. Any new client components for R1 & R2 must avoid synchronous `setState` in `useEffect` (derive state during render or use async completion / event handlers).

---

## 2. Logic Chain

### 2.1 The Data Seam Deficiency (Why R1 & R2 would fail with initial seed data)
1. **Fact**: R1 acceptance criteria states: *"Home page displays all stories (not limited to 5) with entity tags visible on each card"*, *"Sort controls present: location, people, timeline, recency"*, *"Clicking an entity tag filters the story list"*, and *"Must work with both the LocalStorage seed data (which has 2 seed stories and 5 seed entities) and live Supabase data."*
2. **Fact**: In `local-store.ts`, `SEED_STORIES` has 2 stories, but `STORAGE_KEYS.STORY_ENTITIES` has no seed records.
3. **Fact**: In `client.ts:203-230`, `getLocalStoriesWithDetails` constructs `story_entities` purely by checking `s.era_tags`.
4. **Deduction**: In the current zero-config LocalStorage fallback:
   - `story-seed-1` has ZERO person tags and ZERO place tags.
   - `story-seed-2` has ZERO matched tags at all (`1960s Travels` has no matching entity in `SEED_ENTITIES`).
   - If a user sorts by "people", both stories fail to group under "Billy Miller" or "Grandma Rose".
   - If a user sorts by "location", both stories fail to group under "Chicago, Illinois" or "Yellowstone National Park".
   - If a user clicks the "Billy Miller" tag, no stories match.
5. **Solution Required**:
   - Add `SEED_STORY_ENTITIES` linking `story-seed-1` to Billy Miller (`entity-seed-1`), Chicago (`entity-seed-4`), and 1950s Childhood (`entity-seed-5`); and linking `story-seed-2` to Yellowstone (`entity-seed-2`) and Grandma Rose (`entity-seed-3`).
   - Export `localGetStoryEntities(storyId?: string)` from `local-store.ts`.
   - Update `getLocalStoriesWithDetails` in `src/lib/supabase/client.ts` to retrieve links from `localGetStoryEntities()`, join with `localGetEntities()`, and merge any era tags.

### 2.2 R1 Architectural Design (Sortable Story Catalog on Front Page)
1. **Component Boundary**:
   - `src/app/page.tsx` is an async Server Component.
   - Sorting by recency/location/people/timeline and clicking entity tags to filter requires reactive client state (`useState`).
   - Browser `localStorage` is client-side only (`window.localStorage`). If the page were purely server-rendered, any new stories recorded during an interview session would not appear on the home page until a full server fetch occurred.
   - Therefore, create a dedicated `"use client"` component: `src/components/catalog/StoryCatalog.tsx`.
   - `src/app/page.tsx` passes `initialStories` and `initialEntities` to `<StoryCatalog />`.
   - On mount, `StoryCatalog` re-syncs with `getStories()` / `getEntities()` asynchronously, ensuring instantaneous initial paint (SSR) plus live updates from browser `localStorage`.
2. **Sorting Logic**:
   - **Recency** (default): Sort stories descending by `new Date(story.created_at).getTime()`.
   - **Location**: Group stories by place entity name (`entity.type === "place"`). Each location gets a distinct section header with MapPin icon and count; stories without a place entity are grouped into "Other Locations".
   - **People**: Group stories by person entity name (`entity.type === "person"`). Each person gets a section header with User icon and relationship context; stories without a person entity are grouped into "Solo / Other Memories".
   - **Timeline**: Order stories chronologically by era/decade (parsed from era tags/entities or years like `1950s`, `1960s`).
3. **Filtering Mechanism**:
   - Clicking an entity badge on any story card (or from an entity filter bar) sets `selectedEntity` (`Entity | null`).
   - An active filter banner displays: `"Filtered by: [Entity Name] ([Count] stories)"` with a `"Clear Filter"` button.
   - Only stories mentioning or linked to that entity are rendered, while maintaining the selected sort view.
4. **Responsive Layout**:
   - Grid layout: 1 column on mobile (`grid-cols-1`), 2 columns on tablet/desktop (`md:grid-cols-2`), with touch-friendly tag chips (padding, min 44px touch targets).

### 2.3 R2 Architectural Design (Persistent Biographical Sketch Document)
1. **Route & Page**:
   - Add `src/app/biography/page.tsx` with `"use client"`.
   - Auto-populates from `getStories()` and `getEntities()`.
   - Supports live print / PDF export via `window.print()` and a dedicated stylesheet `src/app/biography/print.css`.
2. **Navigation Seam**:
   - Add a "Biography" navigation link (`/biography`) to the main navigation bar alongside "Upload" and "Memoir".
   - Create a reusable `Navbar` component or embed in `src/app/page.tsx` and `src/app/biography/page.tsx`.
3. **Four Core Biographical Sections**:
   - **Section 1: Timeline (Chronological Life Events)**:
     - Aggregates era entities (e.g., "1950s Childhood"), event entities, and story dates.
     - Chronologically sorted from earliest to latest.
     - Visual vertical timeline with decade nodes, era titles, year spans, summaries, and associated story snippets.
   - **Section 2: People & Relationships**:
     - Aggregates all `type === "person"` entities.
     - Displays: Person Name, Relationship context from `metadata.relationship` (e.g., "Childhood best friend", "Maternal grandmother"), mention count, notes, and a list of stories involving this person with quick links/snippets.
   - **Section 3: Places Lived & Visited**:
     - Aggregates all `type === "place"` entities.
     - Displays: Place Name, context from `metadata.context` / `metadata.location` (e.g., "Hometown neighborhood", "Wyoming"), era context (which life era they were there), mention count, and linked stories.
   - **Section 4: Key Events**:
     - Aggregates all `type === "event"` entities.
     - Displays: Event Name, date/years from metadata, location, summary, and linked stories.
     - Empty state helper: Explains how major milestones recorded during interviews populate this section.
4. **Print / PDF Export (`print.css`)**:
   - Adapts the pattern from `src/app/memoir/print.css`.
   - Sets `@media print` with `@page { margin: 1.5cm; size: letter portrait; }`.
   - Prevents breaking cards or timeline items across page splits using `break-inside: avoid; page-break-inside: avoid;`.
   - Hides navigation buttons, print triggers, and jump links using `print:hidden`.
   - High-contrast ink on white background for crisp PDF generation.

---

## 3. Caveats
1. **Event Entity in Initial Seed Data**: The current `SEED_ENTITIES` has 5 items (2 people, 2 places, 1 era, 0 events). For R2's "Key Events" section to show immediate content with zero-config seed data, either:
   - A 6th seed entity (`type: "event"`, e.g. "1965 Yellowstone Road Trip", date: "July 1965") should be added, or
   - The UI should derive a key event entry from `story-seed-2` ("The Great Yellowstone Road Trip of '65") if no explicit event entities exist yet, plus provide a clean empty-state fallback. (Both recommended).
2. **React 19 / ESLint 9 Strictness**: ESLint 9 in this repo enforces `react-hooks/set-state-in-effect`. Implementing agents MUST avoid calling `setState` synchronously within the body of a `useEffect`. Instead, derive filtered/sorted data directly with `useMemo` in render, and only call `setState` inside asynchronous completion handlers (`await getStories()`).
3. **No Existing Shared Navbar**: Currently each route (`/`, `/memoir`, `/upload`, `/interview`) handles its own navigation header independently. Adding a shared `Navbar` component or updating `src/app/page.tsx` and adding a consistent header on `/biography` will fulfill the requirement without breaking existing layouts.

---

## 4. Conclusion & Concrete Implementation Recommendations

### 4.1 Recommended File Structure & Changes

```
src/
├── app/
│   ├── page.tsx                           # Replace flat Recent Stories with <StoryCatalog initialStories={...} initialEntities={...} />
│   │                                      # Add Biography link in top <nav>
│   └── biography/
│       ├── page.tsx                       # NEW: Persistent Biographical Sketch document
│       └── print.css                      # NEW: Print/PDF export stylesheet
├── components/
│   ├── catalog/
│   │   ├── StoryCatalog.tsx               # NEW: Client component with sorting, filtering, responsive grid
│   │   └── StoryCard.tsx                  # NEW: Story card with entity badges and expand/collapse
│   └── layout/
│       └── Navbar.tsx                     # Optional/Recommended: Unified navigation bar
├── lib/
│   └── supabase/
│       ├── local-store.ts                 # Add SEED_STORY_ENTITIES, export localGetStoryEntities()
│       └── client.ts                      # Update getLocalStoriesWithDetails to join story_entities
└── types/
    └── database.ts                        # Existing types fully support Entity, Story, StoryEntity
```

### 4.2 Step-by-Step Implementation Guide for Downstream Agents

#### Step 1: Update `src/lib/supabase/local-store.ts`
1. Define `SEED_STORY_ENTITIES`:
   ```ts
   const SEED_STORY_ENTITIES: StoryEntity[] = [
     { story_id: "story-seed-1", entity_id: "entity-seed-1", confidence: 1.0 }, // Billy Miller
     { story_id: "story-seed-1", entity_id: "entity-seed-4", confidence: 1.0 }, // Chicago, Illinois
     { story_id: "story-seed-1", entity_id: "entity-seed-5", confidence: 1.0 }, // 1950s Childhood
     { story_id: "story-seed-2", entity_id: "entity-seed-2", confidence: 1.0 }, // Yellowstone National Park
     { story_id: "story-seed-2", entity_id: "entity-seed-3", confidence: 1.0 }, // Grandma Rose
   ];
   ```
2. Initialize `memoryStore[STORAGE_KEYS.STORY_ENTITIES] = [...SEED_STORY_ENTITIES];`.
3. Add and export `localGetStoryEntities`:
   ```ts
   export function localGetStoryEntities(storyId?: string): StoryEntity[] {
     const all = getArray<StoryEntity>(STORAGE_KEYS.STORY_ENTITIES, SEED_STORY_ENTITIES);
     if (storyId) {
       return all.filter((se) => se.story_id === storyId);
     }
     return all;
   }
   ```
4. Optional: Add a seed event entity to `SEED_ENTITIES` (e.g. `entity-seed-6`: "The Great Yellowstone Road Trip", `type: "event"`, `metadata: { date: "July 1965", location: "Yellowstone National Park" }`) and link to `story-seed-2`.

#### Step 2: Update `src/lib/supabase/client.ts`
1. Import `localGetStoryEntities` from `./local-store`.
2. In `getLocalStoriesWithDetails(options?: GetStoriesOptions)`:
   - Retrieve all links: `const allLinks = localGetStoryEntities();`
   - Retrieve all entities: `const allEntities = localGetEntities();`
   - For each story `s`:
     - Filter links: `const storyLinks = allLinks.filter(l => l.story_id === s.id);`
     - Map each link to `{ ...link, entities: allEntities.find(e => e.id === link.entity_id) || null }`.
     - Also merge any tags in `s.era_tags` if not already represented.
     - Return the fully enriched `StoryWithDetails`.

#### Step 3: Create `src/components/catalog/StoryCatalog.tsx`
1. `"use client"` directive.
2. Accepts `initialStories: StoryWithDetails[]` and `initialEntities: Entity[]`.
3. State:
   - `sortBy`: `"recency" | "location" | "people" | "timeline"` (default `"recency"`).
   - `selectedEntity`: `Entity | null`.
   - `searchQuery`: `string` (optional nice-to-have quick text search).
4. `useMemo` hooks to compute:
   - Filtered stories based on `selectedEntity` (checks both `story_entities` and `era_tags`).
   - Grouped stories when `sortBy === "location"` (grouped by place name).
   - Grouped stories when `sortBy === "people"` (grouped by person name).
   - Chronologically sorted stories when `sortBy === "timeline"` (earliest decade first).
5. Controls UI:
   - Segmented buttons / pills for Recency, People, Location, Timeline with active states.
   - Filter banner when `selectedEntity` is active with clear button.
6. Story Card:
   - Title, transcript/summary, date.
   - Tag chips for People (amber/user icon), Places (emerald/pin icon), Eras (purple/clock icon), Events (rose/star icon).
   - Clicking tag invokes `setSelectedEntity(entity)`.
   - Expandable transcript for long stories.
   - Tablet-friendly grid: `grid grid-cols-1 md:grid-cols-2 gap-6`.

#### Step 4: Update `src/app/page.tsx`
1. Add `<Link href="/biography">` in the top navigation bar.
2. Replace lines 89-110 (the 5-item Recent Stories list) with:
   ```tsx
   <StoryCatalog initialStories={allStories} initialEntities={entities} />
   ```

#### Step 5: Create `src/app/biography/page.tsx` & `src/app/biography/print.css`
1. Route: `src/app/biography/page.tsx` (`"use client"`).
2. Header:
   - "Back to Home" button.
   - "Print / Save PDF" button (`window.print()`).
   - Quick jump anchor links: `[Timeline]`, `[People & Relationships]`, `[Places Lived & Visited]`, `[Key Events]`.
   - Document title: "Biographical Sketch" with narrator metadata and summary statistics.
3. Four Render Sections:
   - **Timeline**: Chronological flow of eras, decades, and milestone stories.
   - **People & Relationships**: Cards for each person with relationship metadata, mention count, and linked story cards/quotes.
   - **Places Lived & Visited**: Cards for each place with context, era associations, and linked stories.
   - **Key Events**: Cards for key events with dates, locations, descriptions, and linked stories.
4. `src/app/biography/print.css`:
   - Enforce page breaks, remove overflowing wrappers, hide buttons, clean typography for letter portrait printing.

---

## 5. Verification Method

To independently verify these findings and subsequent implementations:

1. **Verify TypeScript & Production Build**:
   ```powershell
   npm run build
   ```
   *Expected result*: Build exits with code 0, and the new `/biography` static route appears in the generated routes table.

2. **Verify Zero-Config LocalStorage Seed Data**:
   Run the dev server:
   ```powershell
   npm run dev
   ```
   Inspect in a browser with no Supabase environment variables set:
   - Navigate to `http://localhost:3000/`.
   - Verify all stories are listed (not capped at 5).
   - Verify each card shows entity tags for Billy Miller, Chicago, Illinois, 1950s Childhood, Yellowstone, etc.
   - Click the "location" sort control: verify stories group under "Chicago, Illinois" and "Yellowstone National Park".
   - Click the "people" sort control: verify stories group under "Billy Miller" and "Grandma Rose".
   - Click the "timeline" sort control: verify stories order chronologically (1950s before 1960s).
   - Click the "Billy Miller" tag on a card: verify only the sandlot baseball story is displayed, and a filter banner appears.
   - Click "Clear": verify all stories return.

3. **Verify Biographical Sketch & Print Export**:
   - On the home page, verify the "Biography" link exists in the top navigation.
   - Click "Biography" to navigate to `http://localhost:3000/biography`.
   - Verify the 4 sections render: Timeline, People & Relationships, Places Lived & Visited, Key Events.
   - Click "Print / Save PDF": verify browser print preview opens with clean letter formatting, no clipped text, no broken cards, and UI navigation hidden.

4. **Invalidation Conditions**:
   - If `npm run build` fails with hydration or SSR errors due to localStorage access during server rendering.
   - If story cards show zero entity tags when running out-of-the-box without Supabase.
   - If sorting by location or people groups everything into "Unspecified" because `story_entities` links were not seeded or joined.
