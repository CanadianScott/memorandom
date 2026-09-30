# Memorandom E2E Test Infrastructure (Tiers 1–4)

## 1. Testing Philosophy

The Memorandom End-to-End (E2E) Test Suite is built on five core architectural principles:

1. **Opaque-Box Verification**:
   Tests interact exclusively with public contracts, HTTP route handlers (`NextRequest` / `NextResponse`), exported library entrypoints, storage layers, and DOM/CSS rendering contracts. No tests peer into private implementation closures.
2. **Authoritative Specification Derivation**:
   Every expected value, threshold, and boundary condition is derived directly from `ORIGINAL_REQUEST.md` and `PROJECT.md` specifications (e.g. Infantile Amnesia cutoff at `birthYear + 5`, Reminiscence Bump prioritization from ages 10 to 25, zero-config LocalStorage fallback, and non-blocking pure web URL access).
3. **Zero Facade Testing**:
   Tests must exercise real execution paths and validate real business logic. When an underlying feature is not yet implemented (e.g. Milestone 2 `/biography` page or Milestone 4 `README.md` deployment documentation), the test suite reports an honest, actionable failure rather than a false-positive pass.
4. **Progressive Testability & Zero-Dependency Execution**:
   The test framework harness (`tests/e2e/framework.ts`) runs natively via `npx tsx` on Node 22 without requiring heavy external browser automation drivers or separate database servers.
5. **Self-Contained & Isolated**:
   Every test creates its own inputs, isolates storage state, and cleans up after itself, preventing execution order dependencies.

---

## 2. 4-Tier Test Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Tier 4: Real-World Scenarios                                │
│ (Multi-turn elder narrator life journeys & family exports)  │
├─────────────────────────────────────────────────────────────┤
│ Tier 3: Cross-Feature Combinations                          │
│ (Pairwise interactions: Catalog + Bio + Historical + Visual)│
├─────────────────────────────────────────────────────────────┤
│ Tier 2: Boundary & Corner Cases                             │
│ (>=5 cases per feature: empty BKG, missing tags, offline)   │
├─────────────────────────────────────────────────────────────┤
│ Tier 1: Feature Coverage                                    │
│ (>=5 cases per feature: R1 Catalog, R2 Bio, R3 Hist, etc.)  │
└─────────────────────────────────────────────────────────────┘
```

### Tier 1: Feature Coverage (>=5 test cases per requirement)
- **R1: Story Catalog**: Full catalog listing without 5-story limit, recency sorting, location grouping, people grouping, timeline sorting, entity tag click filtering, and local-store linkage contracts.
- **R2: Persistent Biographical Sketch**: Main navigation seam, timeline chronological sorting, people & relationships metadata cards, places lived & visited context, key events / milestone stories, and dedicated print stylesheet (`print.css`).
- **R3: Historically-Grounded Prompts**: `/api/gemini/historical-context` route handler, prompt item schema validation, infantile amnesia cutoff, reminiscence bump weighting, hyperlocal vs national scope, and Visual Stage metadata.
- **R4: Vercel Deployment & Link Sharing**: Build configuration sanity, zero-config LocalStorage primary mode, README Vercel deployment documentation, pure web app URL access, and mobile responsive layout.
- **R5: Visual Stage End-to-End**: Geocoding pipeline (`/api/enrichment`), archival photo pipeline, AI art generation, entity extraction with visual queries, subcomponent contracts, and map coordinate resolution.

### Tier 2: Boundary & Corner Cases (>=5 test cases per requirement)
- **R1 Boundary**: Empty catalog, single-story catalog, missing place tags, missing person tags, ambiguous/non-standard decade labels, and large story volumes (20+ stories).
- **R2 Boundary**: Empty BKG state, missing metadata fields, zero event entities in seed data, discontinuous decade gaps, special characters / quotes / unicode escaping in oral transcripts, and mention count tracking.
- **R3 Boundary**: Deterministic offline fallback matrix without API keys, empty request handling, non-standard decade formats, unknown/unindexed geographic towns, deduplication via `excludeEventNames`, and extreme birth years (1915 centenarian vs 1980 narrator).
- **R4 Boundary**: Corrupted `localStorage` recovery, partial/invalid Supabase URLs, missing Gemini API keys, Next.js image remote pattern whitelisting, and Server-Side Rendering (SSR) Node runtime safety.
- **R5 Boundary**: Prevention of false "Chicago, Illinois" fallback pins, short input memory queries (<15 chars), ungeocodable/fictional locations, Unsplash fallback to Wikimedia, empty query 400 responses, and tab override precedence guards.

### Tier 3: Cross-Feature Combinations (Pairwise Interaction Tests)
- `T3.XF.01`: Tag click filter + Timeline sorting interaction (R1).
- `T3.XF.02`: Historical prompt injection + Visual Stage Leaflet & photo triggers (R3 + R5).
- `T3.XF.03`: Interview transcript -> BKG entity extraction -> Biography document auto-sync (R2 + R3).
- `T3.XF.04`: Historical prompt age filter grounded by BKG inferred era (R2 + R3).
- `T3.XF.05`: Biography document print mode + layout resilience (`print.css`) (R2 + R4).
- `T3.XF.06`: Zero-config LocalStorage + Catalog + Biography integration (R1 + R2 + R4).

### Tier 4: Real-World Scenarios (End-to-End Narrator Journeys)
- `T4.RW.01`: Journey 1: Childhood in Chicago & Sandlot Memories (First-time elder narrator voice turn -> BKG -> Map pin -> Catalog).
- `T4.RW.02`: Journey 2: Western Road Trip & Historical Prompt Injection (Multi-turn interview -> 1965 Yellowstone -> 1969 Apollo Moon Landing prompt -> Visual Stage archival photos).
- `T4.RW.03`: Journey 3: Family Keepsake & Biography Archival Review (Family member web access -> People filter -> Biography review -> Printable memoir).
- `T4.RW.04`: Journey 4: Zero-Config Tablet Offline Resilience (Zero keys, zero cloud database -> LocalStorage fallback -> Resilient interview flow).

---

## 3. Directory Layout

All E2E test files are organized under `tests/e2e/`:

```
tests/e2e/
├── framework.ts          # Zero-dependency test harness, assertions, runner context, reporter
├── catalog.test.ts       # R1: Story Catalog (Tier 1 & Tier 2)
├── biography.test.ts     # R2: Persistent Biographical Sketch (Tier 1 & Tier 2)
├── historical.test.ts    # R3: Historically-Grounded Prompts (Tier 1 & Tier 2)
├── deployment.test.ts    # R4: Vercel Deployment & Offline (Tier 1 & Tier 2)
├── visual-stage.test.ts  # R5: Visual Stage End-to-End (Tier 1 & Tier 2)
├── cross-feature.test.ts # Tier 3: Cross-Feature Combinations
├── real-world.test.ts    # Tier 4: Real-World Narrator Journeys
└── run-all.ts            # Master runner entrypoint
```

---

## 4. Test Runner Commands

### Run Full Test Suite (All Tiers & Features)
```bash
npx tsx tests/e2e/run-all.ts
```

### Run Individual Test Suites
```bash
# Story Catalog (R1)
npx tsx -e "import { runCatalogTests } from './tests/e2e/catalog.test'; import { globalTestContext, formatTerminalSummary } from './tests/e2e/framework'; async function main() { await runCatalogTests(); console.log(formatTerminalSummary(globalTestContext.getSummary()).text); } main();"

# Biography Document (R2)
npx tsx -e "import { runBiographyTests } from './tests/e2e/biography.test'; import { globalTestContext, formatTerminalSummary } from './tests/e2e/framework'; async function main() { await runBiographyTests(); console.log(formatTerminalSummary(globalTestContext.getSummary()).text); } main();"

# Historical Prompts (R3)
npx tsx -e "import { runHistoricalTests } from './tests/e2e/historical.test'; import { globalTestContext, formatTerminalSummary } from './tests/e2e/framework'; async function main() { await runHistoricalTests(); console.log(formatTerminalSummary(globalTestContext.getSummary()).text); } main();"

# Deployment & Offline (R4)
npx tsx -e "import { runDeploymentTests } from './tests/e2e/deployment.test'; import { globalTestContext, formatTerminalSummary } from './tests/e2e/framework'; async function main() { await runDeploymentTests(); console.log(formatTerminalSummary(globalTestContext.getSummary()).text); } main();"

# Visual Stage (R5)
npx tsx -e "import { runVisualStageTests } from './tests/e2e/visual-stage.test'; import { globalTestContext, formatTerminalSummary } from './tests/e2e/framework'; async function main() { await runVisualStageTests(); console.log(formatTerminalSummary(globalTestContext.getSummary()).text); } main();"

# Cross-Feature Combinations (Tier 3)
npx tsx -e "import { runCrossFeatureTests } from './tests/e2e/cross-feature.test'; import { globalTestContext, formatTerminalSummary } from './tests/e2e/framework'; async function main() { await runCrossFeatureTests(); console.log(formatTerminalSummary(globalTestContext.getSummary()).text); } main();"

# Real-World Scenarios (Tier 4)
npx tsx -e "import { runRealWorldTests } from './tests/e2e/real-world.test'; import { globalTestContext, formatTerminalSummary } from './tests/e2e/framework'; async function main() { await runRealWorldTests(); console.log(formatTerminalSummary(globalTestContext.getSummary()).text); } main();"
```

---

## 5. Coverage Thresholds & Quality Gates

| Metric | Target Threshold | Baseline Status | Notes |
|--------|------------------|-----------------|-------|
| **Total Test Count** | >= 60 tests | **70 tests** | Exceeds target |
| **Tier 1 (Feature Coverage)** | >= 5 per feature (>=25 total) | **31 tests** (29 passed, 2 pending M2/M4) | Exceeds target |
| **Tier 2 (Boundary & Corner)** | >= 5 per feature (>=25 total) | **29 tests** (29 passed) | 100% pass |
| **Tier 3 (Cross-Feature)** | >= 5 tests | **6 tests** (6 passed) | 100% pass |
| **Tier 4 (Real-World)** | >= 4 tests | **4 tests** (4 passed) | 100% pass |
| **Execution Duration** | < 10 seconds | **~3.2 seconds** | Ultra-fast execution |
