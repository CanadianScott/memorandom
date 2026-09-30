## 2026-09-29T18:40:00Z
Enhance the existing Memorandom life-story interview PWA (Next.js 16, React 19, Gemini API, Supabase + LocalStorage) with four new capabilities:
- R1. Sortable Story Catalog on Front Page (all stories, entity tags, sort controls: location, people, timeline, recency; tag click filtering; works with LocalStorage seed data and Supabase; responsive)
- R2. Persistent Biographical Sketch Document (/biography route in main nav; structured reference document with Timeline, People & Relationships, Places Lived & Visited, Key Events auto-populated from BKG entities & stories; print/PDF export stylesheet)
- R3. Historically-Grounded Interview Prompts (/api/gemini/historical-context endpoint; dual-source Gemini era knowledge + web search for local context; age/era appropriate; location-specific local news/events; integrated into interview loop at ~1 per 5-8 questions)
- R4. Vercel Deployment & Link Sharing (clean build `npm run build`; pure web app access via URL on mobile/desktop; README.md Vercel deployment instructions; works with zero-config LocalStorage fallback)
- R5. Visual Stage End-to-End Verification (verify map updates with pins on place mentions, archival photos populate on era scenes, art prompt updates, zero runtime errors)
