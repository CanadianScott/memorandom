# Handoff Report: R3 Historically-Grounded Interview Prompts Survey

**Date**: 2026-09-29T18:47:00Z  
**Author**: Explorer Subagent (`explorer_survey_historical_prompts`)  
**Recipient**: Orchestrator Parent Agent (`parent`)  
**Mission**: Codebase survey for Milestone R3: Historically-Grounded Interview Prompts in Memorandom

---

## 1. Observation

### 1.1 Gemini API Endpoint Structure & Configuration
- **SDK Version**: `@google/genai` version `^2.24.0` is installed (`[package.json](file:///c:/Users/goate/Coding%20Projects/memorandom/package.json#L12)`).
- **Client Factory**:
  - `[src/lib/gemini/client.ts](file:///c:/Users/goate/Coding%20Projects/memorandom/src/lib/gemini/client.ts#L1-L15)` instantiates `new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "placeholder-key" })` and exports `client`.
- **Existing Endpoint Pattern**:
  Every endpoint under `src/app/api/gemini/` follows a consistent 2-tier design:
  1. **Route Handler (`route.ts`)**: Parses JSON body, validates input, delegates to a library function in `src/lib/gemini/`, and returns `NextResponse.json(...)`.
  2. **Library Function (`src/lib/gemini/*.ts`)**: Checks `isKeyAvailable`, invokes Gemini via `@google/genai`, and falls back to a deterministic offline heuristic generator if the API key is missing or an error occurs.
- **Current Model Allocations**:
  - `src/lib/gemini/interview.ts` (L62): `client.interactions.create` with `model: "gemini-3.8-flash"`.
  - `src/lib/gemini/entities.ts` (L13): `client.interactions.create` with `model: "gemini-3.8-flash"`.
  - `src/lib/gemini/visual-context.ts` (L14): `client.interactions.create` with `model: "gemini-3.8-flash"`.
  - `src/lib/gemini/art.ts` (L36): `client.interactions.create` with `model: "gemini-3.1-flash-image"` (Google Nano Banana 2).
  - `src/lib/gemini/document-extractor.ts` (L19): `client.interactions.create` with `model: "gemini-3.8-flash"`.
  - `src/lib/gemini/privacy-scanner.ts` (L13): `client.interactions.create` with `model: "gemini-3.8-flash"`.
  - `src/app/api/gemini/live-token/route.ts` (L17-40): `new GoogleGenAI({ apiKey, apiVersion: "v1alpha" })` calling `ai.authTokens.create(...)` targeting `model: "gemini-3.1-flash-live-preview"`.

### 1.2 BKG (Biographical Knowledge Graph) Architecture
- **Schema & Types**:
  - `[src/types/database.ts](file:///c:/Users/goate/Coding%20Projects/memorandom/src/types/database.ts#L78-L87)` defines `Entity` (`id`, `type`: `'person' | 'place' | 'era' | 'event'`, `name`, `metadata`, `first_mentioned_at`, `mention_count`, `created_at`, `updated_at`).
  - Specialized metadata types exist for `EraMetadata` (`start_year`, `end_year`, `label`) and `PlaceMetadata` (`city`, `country`, `lat`, `lng`).
- **Storage Layer**:
  - Dual layer: Supabase PostgreSQL `entities` table with complete LocalStorage fallback via `[src/lib/supabase/local-store.ts](file:///c:/Users/goate/Coding%20Projects/memorandom/src/lib/supabase/local-store.ts#L183-L221)`.
  - Key seed entities present out of the box (`local-store.ts` L39-90):
    1. `"Billy Miller"` (`type: "person"`, `metadata: { relationship: "Childhood best friend" }`)
    2. `"Yellowstone National Park"` (`type: "place"`, `metadata: { location: "Wyoming", context: "1965 family road trip" }`)
    3. `"Grandma Rose"` (`type: "person"`, `metadata: { relationship: "Maternal grandmother" }`)
    4. `"Chicago, Illinois"` (`type: "place"`, `metadata: { context: "Hometown neighborhood" }`)
    5. `"1950s Childhood"` (`type: "era"`, `metadata: { years: "1950-1960" }`)
- **Extraction & Linking**:
  - During interview turns, user transcripts are sent to `/api/gemini/extract-entities` (`[src/app/interview/page.tsx](file:///c:/Users/goate/Coding%20Projects/memorandom/src/app/interview/page.tsx#L93-L123)`).
  - Stories and entities are linked via `saveStoryFromTranscript` (`[src/lib/interview/session.ts](file:///c:/Users/goate/Coding%20Projects/memorandom/src/lib/interview/session.ts#L35-L54)`), which invokes `upsertExtractedEntities` in `[src/lib/interview/knowledge-graph.ts](file:///c:/Users/goate/Coding%20Projects/memorandom/src/lib/interview/knowledge-graph.ts#L5-L17)`.
  - `getGraphSummary()` (`[src/lib/interview/knowledge-graph.ts](file:///c:/Users/goate/Coding%20Projects/memorandom/src/lib/interview/knowledge-graph.ts#L19-L35)`) returns a string summary: `"Known people: ... Known places: ... Known eras: ... Known events: ..."`.

### 1.3 Interview Flow in `src/app/interview/page.tsx`
- **Dual Conversation Modes**:
  1. **Classic Mode** (`engineMode === "classic"`):
     - Uses Web Speech API via `useSpeechRecognition` (`[src/hooks/useSpeechRecognition.ts](file:///c:/Users/goate/Coding%20Projects/memorandom/src/hooks/useSpeechRecognition.ts)`) with fallback textarea input (`manualText`, L469-489).
     - Execution handler `handleClassicProcess(textToProcess)` (L221-274):
       1. Triggers `triggerVisualEnrichment(textToProcess)`.
       2. Saves story turn via `saveStoryFromTranscript(activeSession, textToProcess)`.
       3. Invokes `fetch("/api/gemini/interview", { transcript, knowledgeGraphSummary, mode })` to obtain `nextQ`.
       4. Updates `currentPrompt` and triggers TTS via `classicSpeak(nextQ)`.
     - **Observation**: Currently, there is NO turn counter state tracking how many questions have been asked in the session.
  2. **Gemini Live Mode** (`engineMode === "gemini_live"`):
     - Uses `useGeminiLiveConversation` (`[src/hooks/useGeminiLiveConversation.ts](file:///c:/Users/goate/Coding%20Projects/memorandom/src/hooks/useGeminiLiveConversation.ts)`) over real-time WebSockets to `gemini-3.1-flash-live-preview`.
     - Completes turns via `handleLiveTurnComplete(userText, geminiText)` (L139-159), saving story turns and updating visuals.

### 1.4 Visual Stage Integration
- `[src/components/visual-stage/VisualStage.tsx](file:///c:/Users/goate/Coding%20Projects/memorandom/src/components/visual-stage/VisualStage.tsx)` displays 3 tabs:
  - **Map**: Geocodes `mapLocations` or `activeLocation` via `/api/enrichment` (`type: "geocode"`).
  - **Photos**: Queries Wikimedia Commons & Unsplash via `/api/enrichment` using `searchQueries`.
  - **Art**: Generates Imagen 3 / Nano Banana images via `/api/gemini/generate-art`.
- When an interview prompt includes `visualQuery` and `mapQuery`, `enrichVisuals(visualQuery, mapQuery)` (page.tsx L46-79) automatically feeds these into the Visual Stage.

---

## 2. Logic Chain

### 2.1 Implementing `/api/gemini/historical-context`
1. **Endpoint Location & Contract**:
   - Create `src/app/api/gemini/historical-context/route.ts` and `src/lib/gemini/historical-context.ts`.
   - **Request Payload**:
     ```typescript
     export interface HistoricalContextRequest {
       eras?: string[];              // e.g. ["1950s Childhood", "1960s Travels"]
       locations?: string[];          // e.g. ["Chicago, Illinois", "Yellowstone National Park"]
       birthDecade?: string;         // e.g. "1940s"
       birthYear?: number;           // e.g. 1945
       limit?: number;               // default 3-5
       excludeEventNames?: string[]; // avoid repeating prompts
     }
     ```
   - **Response Payload**:
     ```typescript
     export interface HistoricalPromptItem {
       id: string;
       question: string;               // Empathetic, conversational, single-part question
       historicalEvent: string;        // Name of event (e.g., "Chicago Blizzard of 1967")
       yearOrEra: string;              // e.g. "1967"
       location: string;               // e.g. "Chicago, Illinois"
       scope: "local" | "national";    // Hyperlocal vs national milestone
       sourceType: "gemini_knowledge" | "web_search";
       sourceDetails?: string;         // e.g. "Chicago Tribune archives, Jan 26, 1967"
       followUps: string[];
       visualQuery: string;            // Archival photo query for Visual Stage
       mapQuery: string;               // Map location for Leaflet
       artPrompt: string;              // Artistic memory prompt for Nano Banana
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

2. **Two-Source Generation Strategy**:
   - **Source 1: Gemini Knowledge (Broad & Era-Defining)**:
     - Leverages Gemini 3.8 Flash's internal pre-trained memory for major national milestones, music, cultural phenomena, and technological shifts (e.g. Apollo 11 Moon landing in 1969, Blizzard of '78, 1964 NY World's Fair, color television adoption).
   - **Source 2: Web Search Grounding (Hyperlocal & Newspaper Archives)**:
     - The `@google/genai` SDK allows grounding with Google Search via `client.models.generateContent` with `tools: [{ googleSearch: {} }]`.
     - When a narrator has a known city (e.g. "Chicago") and decade (e.g. "1960s"), the prompt directs Gemini to use search grounding to locate specific events from local newspaper archives, local landmark dedications (e.g. Daley Plaza Picasso 1967, Marina City opening 1964), neighborhood festivals, or local severe weather.
     - Gemini returns the verified local event and source attribution (e.g., newspaper archive or historical record).
   - **Source 3: Deterministic Offline Fallback**:
     - When `process.env.GEMINI_API_KEY` is not configured or network requests fail, the endpoint uses an extensive internal historical matrix indexed by decade (1930s to 1990s) and region/city (Chicago, New York, Boston, Midwest, West Coast, South, National).
     - Because the seed data contains `"Chicago, Illinois"` and `"1950s Childhood"`, the fallback immediately yields high-quality Chicago 1950s/1960s local events (e.g. Riverview Amusement Park, Blizzard of '67, Sandlot baseball) alongside national touchstones.

### 2.2 Chronological & Age-Appropriateness Heuristics
1. **Infantile Amnesia Cutoff**:
   - Humans cannot recall episodic autobiographical memories from before age 4-5.
   - Heuristic constraint: `minEventYear = birthYear + 5`. Never prompt an event before `birthYear + 5`.
2. **The Reminiscence Bump (Ages 10–25)**:
   - Psychological oral history research confirms that elderly narrators have the most vivid, emotionally resonant memories from ages 10 to 25 (adolescence through early adulthood).
   - Weight events occurring in `[birthYear + 10, birthYear + 25]` as highest priority.
3. **Inferring Birth Year / Decade from BKG**:
   - If an entity of type `era` mentions "Childhood" or "Youth" with a decade (e.g. `"1950s Childhood"`):
     `estimatedBirthYear = 1950 - 5 = 1945` (birth decade = 1940s).
   - If an entity of type `era` has metadata `years: "1950-1960"`:
     Extract the earliest year.
   - If no era is specified in BKG, default to the standard elder narrator baseline (born ~1945–1950; age 75–81 in 2026).

### 2.3 Injection Seams in `src/app/interview/page.tsx`
1. **Turn Counting**:
   - Add state: `const [turnCount, setTurnCount] = useState(0)` and `const [historicalPromptQueue, setHistoricalPromptQueue] = useState<HistoricalPromptItem[]>([])`.
2. **Data Establishment Gate**:
   - Check if BKG data is established: `hasEstablishedBkg = entities.some(e => e.type === "era") || entities.some(e => e.type === "place")`.
   - In seed data mode, `entities` already has "1950s Childhood" and "Chicago, Illinois", so it is established immediately.
3. **Injection Cadence (1 per 5–8 questions)**:
   - When `turnCount >= 4` and `(turnCount % 6 === 0 || turnCount % 7 === 0)`:
     - Instead of the generic follow-up from `/api/gemini/interview`, pick the next historical prompt from the queue or fetch on-demand from `/api/gemini/historical-context`.
     - Set `currentPrompt` to `historicalPrompt.question`.
     - Automatically update `VisualStage`:
       - If `historicalPrompt.mapQuery` exists: calls `enrichVisuals(undefined, historicalPrompt.mapQuery)` to pan Leaflet map.
       - If `historicalPrompt.visualQuery` exists: calls `enrichVisuals(historicalPrompt.visualQuery)` to fetch archival photos.
       - Set `artPrompt` to `historicalPrompt.artPrompt`.
     - In Classic mode: speak `historicalPrompt.question` via `classicSpeak`.
     - Add visual UI indicator: A warm keepsake pill above the prompt: `"🏛️ Memory Spark: Chicago Blizzard of '67 (Historical Context)"`.
4. **Gemini Live Mode Harmony**:
   - In Live Mode, streaming voice is driven by the Gemini Live session.
   - Seam:
     - Render a clickable "Historical Spotlight" card in the UI when a historical prompt is triggered:
       `[✨ Ask narrator about: 1969 Apollo Moon Landing]`
     - Optionally send guidance to the live model via `session.sendClientContent` with interviewer steering notes: `"[Interviewer Note: Gently invite the narrator to share what they remember about the 1969 Moon Landing.]"`.

---

## 3. Caveats

1. **Google Search Grounding in Client Interactions vs Models API**:
   - In `@google/genai`, Google Search grounding is supported in `client.models.generateContent({ model: "gemini-3.8-flash", config: { tools: [{ googleSearch: {} }] } })`.
   - When Google Search grounding is active, the response candidate contains `groundingMetadata.webSearchQueries` and `groundingChunks`.
   - In environments where Google Search tools are rate-limited or Vertex AI permissions differ, the deterministic fallback bank must be fully populated.
2. **Seed Data vs Dynamic Extraction**:
   - In zero-config mode, the seed data in `src/lib/supabase/local-store.ts` already contains "Chicago, Illinois" and "1950s Childhood".
   - If a brand-new session is started without seed data and no entities are yet extracted (questions 1–3), historical injection must safely wait until at least 1 place or era entity is recognized.
3. **Lint Warnings in Codebase**:
   - `npm run build` succeeds completely (exit code 0), but `npm run lint` flags some React 19 / Compiler effect rules (e.g. setState in useEffect in `ArtGenerator.tsx` and `VisualStage.tsx`). The new historical endpoint and hooks should be cleanly written to avoid introducing additional lint issues.

---

## 4. Conclusion

- **Readiness**: All foundational pieces (Gemini client, `@google/genai` SDK, BKG entities, LocalStorage fallback, Visual Stage integration, speech recognition/synthesis) are already in place and well-architected.
- **Implementation Strategy**:
  1. Add types in `src/types/historical-context.ts` (or `src/types/interview.ts`).
  2. Implement `src/lib/gemini/historical-context.ts` with:
     - Birth year / decade inference from BKG entities
     - Gemini 3.8 Flash model invocation with Google Search grounding
     - Curated deterministic fallback bank for offline / zero-config reliability
  3. Create route `src/app/api/gemini/historical-context/route.ts`.
  4. Add BKG helper `getBiographicalProfile()` in `src/lib/interview/knowledge-graph.ts`.
  5. Wire `turnCount` and historical prompt injection into `src/app/interview/page.tsx` for Classic mode (~1 per 5–8 questions) and add UI spotlight badge for both Classic and Live modes.
  6. Connect historical prompt metadata (`visualQuery`, `mapQuery`, `artPrompt`) to the Visual Stage.

---

## 5. Verification Method

1. **Endpoint Verification**:
   - Execute a POST request via curl/fetch to `http://localhost:3000/api/gemini/historical-context` with payload:
     ```json
     {
       "eras": ["1950s Childhood", "1960s Travels"],
       "locations": ["Chicago, Illinois", "Yellowstone National Park"],
       "birthDecade": "1940s"
     }
     ```
   - Verify returned JSON matches `HistoricalContextResponse`, containing prompts for both local Chicago events and national 1950s/1960s events, with valid `question`, `visualQuery`, `mapQuery`, and `artPrompt`.
2. **Interview Flow Progression Test**:
   - In `src/app/interview/page.tsx` (Classic mode with text input):
     - Submit 5–7 memories.
     - Observe that on turn ~6, the prompt heading updates to a historically-grounded prompt (e.g. Chicago Blizzard or Moon Landing).
     - Verify Visual Stage automatically responds: map pans to the historical location, and archival photo tab queries historical imagery.
3. **Age Appropriateness Test**:
   - Supply `birthDecade: "1950s"`. Confirm no prompts reference events prior to 1955.
4. **Build Verification**:
   - Run `npm run build` to confirm zero compilation errors.
