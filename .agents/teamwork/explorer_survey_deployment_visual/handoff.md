# Codebase Survey Report: Memorandom R4 & R5

## 1. Observation

### R4: Vercel Deployment & Link Sharing

1. **Build Execution & Output**:
   - Running `npm run build` executed `next build` (Next.js 16.3.7, Turbopack) on Windows:
     ```
     ✓ Compiled successfully in 1383ms
     Finished TypeScript in 1754ms
     ✓ Generating static pages using 16 workers (15/15) in 975ms
     ```
     Result: **Exit Code 0**, 15 total routes generated (4 static routes `/`, `/interview`, `/memoir`, `/upload`; 7 dynamic API routes `/api/enrichment`, `/api/gemini/*`).
   - Production server test (`npx next start -p 3005`): Server started in 194ms. `curl.exe -I http://localhost:3005` returned `HTTP/1.1 200 OK` (Content-Length: 22815, Content-Type: text/html; charset=utf-8).

2. **Linting Execution & Output**:
   - Running `npm run lint` (`eslint`) exited with **code 1 (8 errors, 8 warnings)**.
   - Identified errors:
     - `src/hooks/useTextToSpeech.ts:123:7`: `processQueue` accessed before it is declared (`react-hooks/immutability`).
     - `src/components/visual-stage/VisualStage.tsx:48:7`: Calling `setActiveTabState(selectedTab)` synchronously in `useEffect` (`react-hooks/set-state-in-effect`).
     - `src/components/visual-stage/ArtGenerator.tsx:33:7 & 76:7`: Calling `setPrompt` and `handleGenerate` synchronously within `useEffect` (`react-hooks/set-state-in-effect`).
     - `src/app/upload/page.tsx:48:5`: Calling `fetchMedia()` synchronously within `useEffect`.
     - `src/components/OfflineBanner.tsx:12:7`: Calling `setIsOffline(true)` synchronously within `useEffect`.
     - `src/lib/interview/knowledge-graph.ts:11:52`: `@typescript-eslint/no-explicit-any`.

3. **Configuration & Dependencies**:
   - `package.json`: Next.js 16.3.7, React 19.2.8, `@google/genai` 2.24.0, `@supabase/supabase-js` 2.117.2, `leaflet` 1.9.4, `react-leaflet` 5.0.0, `lucide-react` 1.48.0, `zod` 4.6.5.
   - `next.config.ts`: `remotePatterns` configured for `images.unsplash.com`, `upload.wikimedia.org`, `*.supabase.co`.
   - `tsconfig.json`: `target: ES2017`, `moduleResolution: "bundler"`, `@/* -> ./src/*`.

4. **Environment Variables & LocalStorage Fallback**:
   - In `src/lib/supabase/client.ts` (lines 34-62):
     ```ts
     const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
     const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
     export const isSupabaseConfigured = isValidUrl && isValidKey;
     ```
     When Supabase is not configured, operations cleanly route to `src/lib/supabase/local-store.ts`.
   - `src/lib/supabase/local-store.ts`: Out-of-the-box seed data contains 5 entities (Billy Miller, Yellowstone National Park, Grandma Rose, Chicago, 1950s Childhood), 2 stories ("Sandlot Baseball on Miller's Field", "The Great Yellowstone Road Trip of '65"), and 2 chapters. Full CRUD operations operate seamlessly in memory and `localStorage`.
   - `process.env.GEMINI_API_KEY`: Used in `src/lib/gemini/client.ts`, `interview.ts`, `entities.ts`, `visual-context.ts`, `art.ts`, `document-extractor.ts`, `privacy-scanner.ts`. All endpoints have intelligent offline/rule-based fallbacks when the key is omitted or placeholder.

5. **README.md Gaps**:
   - `README.md` is the generic `create-next-app` template. Zero mentions of Memorandom, Vercel deployment procedures, environment variables, zero-config local storage, or browser link sharing.

6. **Web App & Mobile Accessibility**:
   - Fully accessible via standard browser URL on desktop and mobile Safari/Chrome.
   - `src/components/PwaRegister.tsx`: Registers `/sw.js` non-blockingly without installation gate.
   - `src/app/layout.tsx:24-26`: Sets `maximumScale: 1, userScalable: false`. This disables pinch-to-zoom for elder accessibility.
   - `public/manifest.json`: References `/icon-192.png` and `/icon-512.png`, but neither exists in `/public/`.
   - `public/sw.js`: `STATIC_ASSETS = ['/', '/interview', '/upload', '/memoir']`. Does not yet include the upcoming `/biography` page.

---

### R5: Visual Stage End-to-End Verification

1. **Subcomponent Architecture**:
   - `src/components/visual-stage/VisualStage.tsx`: Tabbed container (📍 Map, 📷 Photos, 🎨 Art) plus entity badges.
   - `src/components/visual-stage/StoryMap.tsx`: Dynamically imports `StoryMapInner.tsx` with `{ ssr: false }`.
   - `src/components/visual-stage/StoryMapInner.tsx`: Leaflet map container with OpenStreetMap tiles, `FitBounds`, and default marker icon override using `cdnjs.cloudflare.com`.
   - `src/components/visual-stage/ImageCarousel.tsx`: Auto-advancing (5s) or swipeable carousel with Next.js unoptimized `<Image>`, title, and attribution overlay.
   - `src/components/visual-stage/ArtGenerator.tsx`: Style selector (`kodachrome`, `watercolor`, `oil_painting`, `storybook`), scene prompt textarea, generates image via `/api/gemini/generate-art`, and saves to memoir storage via `uploadMedia`.

2. **Live Backend Route Verification**:
   - Geocoding (`/api/enrichment` type "geocode"): Query `"Yellowstone National Park"` returned HTTP 200 with `{ lat: 44.6200885, lng: -110.5606893, displayName: "Yellowstone National Park, Wyoming, United States" }`.
   - Wikimedia (`/api/enrichment` type "wikimedia"): Query `"Yellowstone National Park vintage"` returned HTTP 200 with archival images from `upload.wikimedia.org`.
   - Unsplash (`/api/enrichment` type "unsplash"): Gracefully returned `{ results: [] }` when `UNSPLASH_ACCESS_KEY` is absent.
   - Gemini Entity Extraction (`/api/gemini/extract-entities`): Input with Yellowstone and Billy Miller returned HTTP 200 with extracted entities, relationships, `visualQueries`, and `mapLocations`.
   - Gemini Visual Context (`/api/gemini/visual-context`): Returned HTTP 200 with `searchQueries` and `mapQueries`.
   - Gemini Art Generation (`/api/gemini/generate-art`): Returned HTTP 200 with base64 encoded image data and model tag.
   - Gemini Interview Question (`/api/gemini/interview`): Returned HTTP 200 with next empathetic biographer question, follow-ups, and metadata.

3. **Identified Pipeline Breakages & Flaws**:
   - **Flaw 1 (Critical): Automatic Tab Override Race Condition in `src/app/interview/page.tsx`**:
     - At lines 116-121, when `entitiesRes` detects a place, it executes `setVisualStageTab("map")`.
     - In parallel, `visualRes` finishes and calls `enrichVisuals(q, vData.mapQueries?.[0]?.name)` (lines 127-129). If `vData.mapQueries` is empty, `mapLoc` is `undefined`.
     - Inside `enrichVisuals` (lines 70-72), upon receiving Wikimedia images:
       ```ts
       if (!mapLoc) {
         setVisualStageTab("photos");
       }
       ```
     - **Result**: `enrichVisuals` immediately overrides the active tab back to `"photos"`, switching away from the Map tab that was just displayed for the place mention!
   - **Flaw 2 (Critical): False "Chicago, Illinois" Fallback on Every Turn in `src/lib/gemini/interview.ts`**:
     - In `generateOfflineFallback` (lines 144-159), words in transcript are parsed and ALL capitalized words are pushed with `type: "person"`. Place entities are never extracted.
     - Line 177:
       ```ts
       mapQuery: extractedEntities.find((e) => e.type === "place")?.name || "Chicago, Illinois",
       ```
       Since `type === "place"` is never found, `mapQuery` ALWAYS resolves to `"Chicago, Illinois"`.
     - In `src/app/interview/page.tsx` line 258:
       ```ts
       if (interviewData.visualQuery || interviewData.mapQuery) {
         enrichVisuals(interviewData.visualQuery, interviewData.mapQuery);
       }
       ```
     - **Result**: Every turn in Classic mode in offline fallback forces `"Chicago, Illinois"` as `mapLoc`, resetting the map and overwriting the narrator's actual location!
   - **Flaw 3 (Major): Hardcoded "Chicago" and Non-Dynamic Photos in `src/lib/gemini/visual-context.ts`**:
     - Lines 59-61: If transcript does not match `commonPlaces`, fallback returns:
       ```ts
       searchQueries: ["vintage 1950s family photograph", "nostalgic memories retro"],
       mapQueries: mapQueries.length > 0 ? mapQueries : [{ name: "Chicago", query: "Chicago, Illinois" }],
       ```
       Defaults to Chicago pins for non-matching stories, and returns completely static search queries ignoring whatever era the user mentioned.
   - **Flaw 4 (Moderate): Discarded `visualQueries` from `extract-entities` in `src/app/interview/page.tsx`**:
     - `/api/gemini/extract-entities` produces context-aware `visualQueries`, but lines 105-122 in `page.tsx` only inspect `entities` and `mapLocations`. `data.visualQueries` is discarded.
   - **Flaw 5 (Moderate): Duplicate Wikimedia Fetches in `page.tsx` vs `VisualStage.tsx`**:
     - `page.tsx:60-74` calls `/api/enrichment` (type "wikimedia") and sets `images`.
     - `VisualStage.tsx:155-234` also calls `/api/enrichment` for each query in `searchQueries` (both wikimedia and unsplash) and sets `fetchedPhotos`.
     - `VisualStage.tsx:236`: `const displayedImages = fetchedPhotos.length > 0 ? fetchedPhotos : images;`
     - **Result**: Wikimedia is fetched twice for the same query, and the `images` prop is immediately shadowed.
   - **Flaw 6 (Moderate): Minimum 15-character guard in `triggerVisualEnrichment`**:
     - `src/app/interview/page.tsx:85`: `if (!trimmed || trimmed.length < 15) return;`
     - Concise place answers like "Trip to Paris" (13 chars) or "Grand Canyon" (12 chars) are silently ignored.
   - **Flaw 7 (Minor): Full Re-Geocoding Loop on Every Location State Change**:
     - `VisualStage.tsx:109-133`: Loops over all `effectiveLocations` sequentially on every change without caching. Nominatim rate-limits (1 req/sec) may cause 429 errors if multiple locations accumulate.
   - **Flaw 8 (Minor): Render-Phase State Update in `VisualStage.tsx`**:
     - `VisualStage.tsx:64-81`: Directly executes `setPrevMapKey` and `setActiveTab` during component render, which invokes parent `onTabChange` callback during render.

---

## 2. Logic Chain

1. **R4 Build & Vercel Readiness**:
   - `npm run build` succeeds cleanly with Turbopack in 1.38s with zero errors across all 15 routes.
   - Production server (`next start -p 3005`) serves HTTP 200 OK.
   - LocalStorage fallback is robust: works out-of-the-box with seed stories and entities when Supabase is not configured.
   - However, `README.md` lacks all Vercel deployment documentation, and `npm run lint` fails on React 19 / Next.js 16 rules. If Vercel or CI runs `npm run lint`, deployment will fail unless fixed or configured.

2. **R5 Visual Stage Pipeline**:
   - The subcomponents (`StoryMapInner`, `ImageCarousel`, `ArtGenerator`) work correctly in isolation, and their underlying API endpoints (`/api/enrichment`, `/api/gemini/*`) are functional.
   - However, during live conversation in `src/app/interview/page.tsx`, when a user speaks or types a memory:
     - If they mention a place (e.g. Yellowstone), `entitiesRes` sets the tab to `"map"`.
     - Shortly after, `visualRes` returns images and triggers `enrichVisuals`, which sees no location on the photo query and flips the tab back to `"photos"`.
     - In offline mode, `generateOfflineFallback` in `interview.ts` always forces a map pin to Chicago.
     - Therefore, the Visual Stage pipeline currently fails to reliably maintain map pins on place mentions and photo carousels on era mentions without unwanted tab overrides and false Chicago pins.

---

## 3. Caveats

1. **Unsplash API Key**:
   - `UNSPLASH_ACCESS_KEY` is not configured in `.env.local` (set to `your_unsplash_access_key_here`). As tested, it cleanly returns `[]` and falls back to Wikimedia Commons. Wikimedia Commons requires no API key and works immediately.
2. **Web Speech API**:
   - In Classic mode, browser voice input requires `webkitSpeechRecognition` or `SpeechRecognition` in the browser (Chrome/Edge/Safari). In Firefox or headless environments, the text input fallback handles inputs.
3. **PWA Offline Service Worker**:
   - `/sw.js` caches static routes (`['/', '/interview', '/upload', '/memoir']`). When `/biography` (Requirement R2) is implemented, it should be appended to `STATIC_ASSETS`.

---

## 4. Conclusion

1. **For R4 (Vercel Deployment & Link Sharing)**:
   - The application builds cleanly (`npm run build` passes).
   - Zero-config LocalStorage fallback functions properly without Supabase.
   - Action items needed:
     - Update `README.md` with complete step-by-step Vercel deployment instructions, environment variable matrix, zero-config explanation, and link sharing guidance.
     - Resolve ESLint errors in `useTextToSpeech.ts`, `VisualStage.tsx`, `ArtGenerator.tsx`, `upload/page.tsx`, `OfflineBanner.tsx` to prevent deployment/CI failures.
     - Add app icons in `public/` (`icon-192.png`, `icon-512.png`) to avoid 404s.
     - Consider removing `userScalable: false` in `src/app/layout.tsx` for elderly user accessibility.

2. **For R5 (Visual Stage End-to-End Verification)**:
   - All core rendering components (`StoryMapInner`, `ImageCarousel`, `ArtGenerator`) and API routes are operational.
   - Action items needed to achieve acceptance criteria:
     - In `src/app/interview/page.tsx`: Fix the tab-switching logic in `enrichVisuals` so it does not overwrite the Map tab when a location is active or has just been extracted.
     - In `src/lib/gemini/interview.ts`: In `generateOfflineFallback`, do NOT default `mapQuery` to `"Chicago, Illinois"`. Extract actual place names if present, otherwise set `mapQuery` to `""` / `undefined`.
     - In `src/lib/gemini/visual-context.ts`: Remove hardcoded `"Chicago"` fallback in `mapQueries`. Dynamically extract era and place from transcript for `searchQueries`.
     - In `src/app/interview/page.tsx`: Utilize `data.visualQueries` from `extract-entities`.
     - In `src/app/interview/page.tsx`: Lower the length guard from 15 to 3 characters in `triggerVisualEnrichment`.
     - In `src/components/visual-stage/VisualStage.tsx`: Clean up render-phase `setState` calls (lines 64-81) to adhere to React 19 standards.

---

## 5. Verification Method

1. **Verify Build**:
   ```bash
   npm run build
   ```
   Must succeed with Exit Code 0 and all pages generated.

2. **Verify Production Server & URL Access**:
   ```bash
   npx next start -p 3005
   curl.exe -I http://localhost:3005
   ```
   Must return HTTP 200 OK.

3. **Verify Lint**:
   ```bash
   npm run lint
   ```
   Verify all ESLint errors are resolved.

4. **Verify Visual Stage Pipeline (Manual / E2E)**:
   - Navigate to `/interview?mode=surprise_me`.
   - In Classic mode text input, enter: `"We took a road trip to Yellowstone National Park."`
   - Verify:
     - Map tab activates with a pin on Yellowstone National Park.
     - Map tab is NOT immediately flipped away by the photo query.
     - Archival photos of Yellowstone appear in the Photos tab.
     - Art prompt updates with the Yellowstone memory text in the Art tab.
     - No false Chicago pin appears.
   - Enter a non-geographic era memory: `"In the 1960s, I loved listening to vinyl records."`
     - Photos tab populates with 1960s archival photos.
     - No false Chicago map pin is generated.
