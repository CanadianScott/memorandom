# Memorandom - Digital Memoir & Life Story Interviewer

## Purpose
A voice-first tablet web application (PWA) designed for an elderly father to naturally narrate his life stories. The app acts as an empathetic, curious biographer that extracts biographical details (people, places, eras, events), conducts real-time visual enrichment during interviews (maps, historical photos, AI illustrations), enforces strict privacy checks on uploads, and compiles stories into an elegant keepsake digital memoir.

---

## Domain Vocabulary

- **Memoir**: The overarching digital book composed of chapters, stories, multimedia, and biographical entities.
- **Story Session**: An interactive, voice-driven interview round focused on a specific prompt, event, or memory thread.
- **Biographical Knowledge Graph (BKG)**:
  - **Entity (Person)**: Individuals mentioned (e.g., family members, childhood friends, coworkers) with relationships and life eras.
  - **Entity (Place)**: Locations (hometowns, vacation spots, military bases, schools) with coordinates and historical context.
  - **Entity (Era/Time Period)**: Decades or life phases (e.g., "Childhood in Chicago (1950-1962)", "Navy Years (1968-1972)").
  - **Entity (Event)**: Specific occurrences (e.g., "The Blizzard of '67", "Trip to Yellowstone").
- **Visual Stage**: The split-screen dynamic canvas that surfaces real-time contextual media (maps, Wikimedia/Unsplash photos, Imagen 3 illustrations) while the user narrates.
- **Privacy Scanner**: Gemini Vision pre-flight guardian that inspects uploaded documents/photos for PII (SSN, medical records, financial info) and blocks risky uploads.
- **Storyteller Voice & TTS**: The warm audio narration persona that speaks questions aloud to the user.
- **Memoir Chapter Reader**: The interactive digital keepsake book presenting chapters, hero imagery, quotes, and exportable print/PDF layouts.

---

## Architecture & Technology Stack

1. **Frontend / Application Shell**:
   - Next.js (App Router, React 19) + TypeScript + Tailwind CSS + Lucide Icons.
   - PWA manifests & mobile-touch optimizations for tablet browsers (iPad Safari & Android Chrome).
2. **AI & Intelligence**:
   - Google Gemini Live API (`gemini-3.1-flash-live-preview`) for real-time bidirectional voice conversation with native speech in/out, automatic Voice Activity Detection (VAD), and live audio transcription.
   - Google Gemini 3.8 Flash (via `@google/genai` SDK) for entity extraction, adaptive interview prompts, and context query generation.
   - Google Imagen 3 for generating custom story illustrations across selected artistic styles (Vintage 1960s Kodachrome, Watercolor, Oil Painting, Storybook Illustration).
   - Gemini Vision for pre-upload sensitive document & PII scanning.
3. **Data Layer**:
   - Supabase (PostgreSQL schema for Stories, Entities, Relations, Media) + Supabase Storage for uploaded photos and generated illustrations.
   - Client-side IndexedDB / LocalStorage fallback cache for immediate offline responsiveness and zero-configuration local demos.
4. **Visual Enrichment**:
   - Wikimedia Commons API & Unsplash API for historical/location photo search.
   - Leaflet + OpenStreetMap for live interactive maps of mentioned places.
5. **Speech & Audio (Conversational Engine)**:
   - Primary: Gemini Live WebSockets with 16kHz PCM streaming input, 24kHz native audio playback, and interruption handling.
   - Ephemeral token service (`/api/gemini/live-token`) for secure direct browser-to-Gemini connection.
   - Fallback: Web Speech API (`SpeechRecognition` / `SpeechSynthesis`) for classic turn-by-turn mode.

---

## Feature Specifications

1. **Adaptive Interview Experience**:
   - "Continue a Thread": Follows up on existing entities in the graph (e.g., "Last time you mentioned your cousin Jim and Yellowstone...").
   - "Explore a Life Era": Childhood, school days, romance, career, travels, traditions.
   - "Surprise Me": Spontaneous nostalgic questions.
   - Live transcription display with large font sizes and accessible controls.
2. **Real-Time Visual Stage (Split Screen)**:
   - Live entity extraction during speech.
   - Automatic fetching and carousel display of maps and landmark photos.
   - On-demand or automatic AI illustration generation in desired art styles.
3. **Photo & Document Ingestion Guardrails**:
   - Big, friendly upload screen with plain-language guidelines.
   - Gemini Vision safety scan checking for SSNs, medical forms, tax returns, credit cards.
   - Immediate warning & blocking if sensitive data is detected.
4. **Digital Memoir Book & Export**:
   - Chapter organization with illustrated covers.
   - Story reader with pull-quotes, photos, interactive maps, and audio snippets.
   - Print/PDF export stylesheet.
5. **First-Run Onboarding & Topic Avoidance (Pre-Ship Requirement)**:
   - Initial onboarding setup flow where the user/family defines explicit off-limits topics (e.g., painful estrangements, sensitive personal history, medical trauma).
   - Hard negative-constraint injection into Gemini interviewer prompts to prevent bringing up or steering towards excluded subjects.

---

## Pre-Shipping Launch Blockers
- [ ] **Topic Avoidance List**: Build onboarding screen/settings enabling user to configure off-limits topics before the first interview session.
