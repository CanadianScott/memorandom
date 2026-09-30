# Memorandom

> **Preserving cherished family memories through voice-first life-story interviews, interactive visual context, and living biographical sketches.**

Memorandom is an empathetic oral history and biographical keepsake Progressive Web Application (PWA) built with **Next.js 16 (App Router)**, **React 19**, the **Google Gemini API**, and a **dual-tier data architecture** featuring Supabase PostgreSQL paired with a complete **zero-config LocalStorage fallback**.

Designed specifically for elder narrators and their families, Memorandom allows an interviewer or narrator (such as an aging parent or grandparent) to speak naturally about their life experiences. As memories are shared, the system dynamically extracts biographical entities, pins geographic locations to an interactive map, surfaces vintage archival photographs, injects contextual historical prompts, and compiles an enduring, printable biographical sketch.

---

## Table of Contents

- [Core Capabilities & Features (R1–R5)](#core-capabilities--features-r1r5)
- [Zero-Config LocalStorage Fallback](#zero-config-localstorage-fallback)
- [Step-by-Step Vercel Deployment Guide](#step-by-step-vercel-deployment-guide)
- [Environment Variables Matrix](#environment-variables-matrix)
- [Narrator Link Sharing & Browser URL Access](#narrator-link-sharing--browser-url-access)
- [Local Development & Verification](#local-development--verification)
- [Architecture & Tech Stack](#architecture--tech-stack)

---

## Core Capabilities & Features (R1–R5)

### R1. Sortable Story Catalog
The front-page catalog (`/`) presents the narrator's entire life story collection with rich metadata:
- **Comprehensive Listing**: Displays all recorded stories without arbitrary volume limits.
- **Multidimensional Sorting**: Sort by **Recency** (`created_at` timestamp), **Location** (grouped by mentioned place entities), **People** (grouped by family members and companions), and **Timeline** (chronological order by era tags and decades).
- **Interactive Entity Tag Filtering**: Click any entity badge (person, place, era, event) on a story card to instantly filter the catalog to stories mentioning that entity.
- **Responsive Layout**: Optimized for both tablet touch screens (e.g. iPad in landscape) and desktop displays.

### R2. Persistent Biographical Sketch Document
Accessible from the main navigation at `/biography`, this living document aggregates and synthesizes life details into an archival reference:
- **Four Core Sections**:
  1. *Timeline*: Chronological progression through decades (e.g., 1940s Childhood, 1950s Youth, 1960s Early Career) linked directly to recorded stories.
  2. *People & Relationships*: Family members, childhood friends, and mentors with relational metadata.
  3. *Places Lived & Visited*: Cities, hometowns, and national parks with historical era context.
  4. *Key Events & Turning Points*: Milestone moments with narrative excerpts.
- **Printable Keepsake**: Dedicated print stylesheet (`print.css`) formats the biography for clean physical printing or browser export to PDF.

### R3. Historically-Grounded Interview Prompts
The interview engine periodically introduces contextual historical sparks (`/api/gemini/historical-context`) to stimulate vivid memories:
- **Two-Source Grounding**: Blends Gemini knowledge of historical eras with live web search and archival newspaper knowledge of local towns and cities.
- **Cognitive Science Principles**: Respects the *Infantile Amnesia cutoff* (never asking about events before `birthYear + 5`) and prioritizes the *Reminiscence Bump* (ages 10–25, when autobiographical memory encoding is strongest).
- **Hyperlocal & National Scope**: Combines historic milestones (e.g. 1969 Moon Landing) with local city context (e.g. blizzards, civic openings, local industries).

### R4. Vercel Deployment & Pure Web Link Sharing
Engineered for zero-friction access on any modern web browser:
- **One-Click Link Access**: The narrator opens a standard HTTPS URL in mobile Safari, Chrome, or Edge—no app store downloads or mandatory installation gates.
- **Elder-Accessible UI**: High-contrast typography (Lora and Plus Jakarta Sans), large touch targets (>=44px), and clear voice feedback.
- **Vercel Ready**: Builds cleanly with Turbopack (`npm run build`) and runs effortlessly on Vercel's Edge/Serverless platform.

### R5. Visual Stage End-to-End Pipeline
During conversation mode, a synchronized split-screen Visual Stage enriches the interview in real time:
- **📍 Interactive Leaflet Map**: Automatically geocodes place names mentioned by the narrator and displays geographic pins with smooth bounding transitions.
- **📷 Archival Photo Carousel**: Queries Wikimedia Commons and Unsplash for era-specific photographs of mentioned locations and historical scenes.
- **🎨 AI Illustration Studio**: Transforms oral memories into custom digital keepsakes across artistic styles (Kodachrome, Watercolor, Oil Painting, Vintage Storybook).

---

## Zero-Config LocalStorage Fallback

Memorandom is **100% functional out of the box with zero external configuration or cloud credentials**:

1. **No Database Setup Required**: When Supabase environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are not provided, the app automatically activates the resilient LocalStorage data tier (`src/lib/supabase/local-store.ts`).
2. **Pre-Seeded Biographical Data**: The local store includes sample stories ("Sandlot Baseball on Miller's Field", "The Great Yellowstone Road Trip of '65") and knowledge graph entities (Billy Miller, Yellowstone National Park, Grandma Rose, Chicago, 1950s Childhood) so all features can be explored immediately.
3. **Resilient Offline Fallbacks**: If `GEMINI_API_KEY` is not configured, the interview system seamlessly switches to rule-based empathetic questions, entity extraction, dynamic photo queries, and offline art generation.
4. **Server-Side Rendering (SSR) Safe**: The storage adapter safeguards execution during Next.js server rendering when browser `window` is undefined, then transparently hydrates on the client.

---

## Step-by-Step Vercel Deployment Guide

Deploying Memorandom to Vercel takes less than two minutes:

### Option 1: Deploy via Vercel Web Dashboard (Recommended)

1. **Push to Git**: Push your Memorandom codebase to GitHub, GitLab, or Bitbucket.
2. **Import Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/new).
   - Select **Import Project** and choose your `memorandom` repository.
3. **Configure Project Settings**:
   - **Framework Preset**: `Next.js` (automatically detected).
   - **Root Directory**: `./` (default).
   - **Build Command**: `npm run build` (or leave default).
   - **Output Directory**: `.next` (default).
   - **Install Command**: `npm install` (default).
4. **Configure Environment Variables** (Optional, see matrix below):
   - In the **Environment Variables** section, add `GEMINI_API_KEY` if you have one.
   - Add Supabase or Unsplash keys if using cloud persistence and photography services.
   - *Note*: If no environment variables are set, the app will deploy and operate perfectly in **Zero-Config LocalStorage mode**.
5. **Deploy**:
   - Click **Deploy**. Vercel will build the project and provide a public production URL (e.g. `https://memorandom-xyz.vercel.app`).

### Option 2: Deploy via Vercel CLI

```bash
# 1. Install Vercel CLI globally (if not already installed)
npm install -g vercel

# 2. Login to your Vercel account
vercel login

# 3. Deploy preview build
vercel

# 4. Deploy production build
vercel --prod
```

---

## Environment Variables Matrix

All environment variables in Memorandom are optional. The table below details each variable, its purpose, and its fallback behavior:

| Variable Name | Required? | Purpose | Default / Fallback Behavior |
|---|---|---|---|
| `GEMINI_API_KEY` | Optional | Powers Gemini Live Voice, Gemini Flash interview questions, entity extraction, historical context, and AI art. | Intelligent offline fallback with rule-based empathetic questioning, regex entity detection, and dynamic visual queries. |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL for cloud PostgreSQL database and asset storage. | Activates **Zero-Config LocalStorage**, storing all entities, stories, and chapters directly in browser storage. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anonymous public API key. | Activates **Zero-Config LocalStorage**. |
| `UNSPLASH_ACCESS_KEY` | Optional | Unsplash API Access Key for high-resolution archival and historical photos. | Gracefully falls back to Wikimedia Commons public domain archival photo search (requires no API key). |

### Example `.env.local` File

To test with full API features locally, create a `.env.local` file in the project root:

```env
# Gemini API Key (get from https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Supabase credentials (get from https://supabase.com/)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Unsplash API access key (get from https://unsplash.com/developers)
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```

---

## Narrator Link Sharing & Browser URL Access

Memorandom is designed so family members can share a single link with an elder narrator (e.g. a parent or grandparent) without any installation hurdles:

1. **Direct URL Access**:
   - Copy the deployed Vercel URL (e.g. `https://your-memorandom-app.vercel.app`).
   - Send the link to the narrator via SMS, iMessage, email, or a saved bookmark.
2. **Supported Browsers & Devices**:
   - **iPad & Tablets**: Safari or Chrome in landscape orientation provides the optimal split-screen interview and visual stage layout.
   - **Smartphones**: Mobile Safari (iOS) and Mobile Chrome (Android) provide a responsive, vertically stacked interface.
   - **Laptops & Desktops**: Chrome, Edge, Safari, and Firefox with microphone access enabled.
3. **No App Store or PWA Installation Barrier**:
   - The app functions immediately as a standard responsive web application.
   - While a Progressive Web App service worker is registered for background caching, the narrator **does not** need to tap "Add to Home Screen" or install anything.
4. **Voice & Text Input Modes**:
   - Narrators can speak naturally using voice recognition (Web Speech API in Classic Mode or WebSocket in Gemini Live Mode).
   - A convenient manual text input drawer is always accessible for typing or quiet environments.

---

## Local Development & Verification

### Prerequisites
- Node.js 20.x or 22.x
- npm 10.x or higher

### Setup & Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

### Production Build & Verification
```bash
# Run production build (must succeed with exit code 0)
npm run build

# Start production server locally
npm start

# Run comprehensive E2E test suite (Tiers 1–4)
npx tsx tests/e2e/run-all.ts
```

---

## Architecture & Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Interactive Maps**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/) (OpenStreetMap tiles)
- **AI & Multimodal Intelligence**: [Google Gen AI SDK](https://www.npmjs.com/package/@google/genai) (`gemini-3.8-flash`)
- **Data Layer**: [Supabase](https://supabase.com/) (`@supabase/supabase-js`) + In-Memory/LocalStorage Fallback
- **Media Enrichment**: Wikimedia Commons API & Unsplash API
- **Testing**: Zero-dependency Node/TypeScript test harness (`tests/e2e/framework.ts`)
