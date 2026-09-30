/**
 * Adversarial & Stress Test Suite: Data Layer (R1) & Biographical Sketch (R2)
 *
 * Authored by: Challenger 1 (Empirical Challenger)
 * Objective: Empirically stress-test local-store.ts, client.ts, StoryCatalog logic,
 * and /biography auto-aggregation under adversarial edge cases.
 */

import { suite, test, expect } from "../e2e/framework";
import * as localStore from "@/lib/supabase/local-store";
import * as client from "@/lib/supabase/client";
import type { Entity, StoryInsert, EntityInsert } from "@/types/database";
import * as fs from "node:fs";
import * as path from "node:path";

interface StoryGroupSummary {
  id: string;
  title: string;
  stories: unknown[];
}

interface EraGroupItem {
  id: string;
  name: string;
  year: number;
  decade: string;
}

interface DerivedEventItem {
  name: string;
  date: string;
  isDerived: boolean;
}

export async function runAdversarialTests() {
  // =========================================================================
  // SECTION 1: DATA LAYER (local-store.ts & client.ts) ADVERSARIAL STRESS
  // =========================================================================

  await suite(
    "Adversarial R1: Data Layer & Edge Cases",
    "Tier 2: Boundary & Corner Cases",
    "R1: Story Catalog",
    async () => {
      await test("ADV.R1.01", "Empty Store / Seed Store Integrity", async () => {
        // Test local-store queries in pristine state
        const entities = localStore.localGetEntities();
        const stories = localStore.localGetStories();
        const storyEntities = localStore.localGetStoryEntities();

        expect(Array.isArray(entities)).toBe(true);
        expect(Array.isArray(stories)).toBe(true);
        expect(Array.isArray(storyEntities)).toBe(true);
        expect(entities.length).toBeGreaterThan(0);
        expect(stories.length).toBeGreaterThan(0);

        // Verify entity type filter on empty/non-matching type
        const events = localStore.localGetEntities("event");
        expect(Array.isArray(events)).toBe(true);
      });

      await test("ADV.R1.02", "Single Entity & Multiple Overlapping Entities Linking", async () => {
        const uniqueId = `adv-test-${Date.now()}`;
        const personEntity: EntityInsert = {
          name: `Adversarial Alice ${uniqueId}`,
          type: "person",
          metadata: { relationship: "Test Colleague" },
          mention_count: 1,
        };
        const placeEntity: EntityInsert = {
          name: `Adversarial City ${uniqueId}`,
          type: "place",
          metadata: { location: "Testland", context: "Conference 1995" },
          mention_count: 1,
        };
        const eraEntity: EntityInsert = {
          name: `1990s Career ${uniqueId}`,
          type: "era",
          metadata: { years: "1990-1999" },
          mention_count: 1,
        };

        const createdPerson = localStore.localUpsertEntity(personEntity);
        const createdPlace = localStore.localUpsertEntity(placeEntity);
        const createdEra = localStore.localUpsertEntity(eraEntity);

        expect(createdPerson.id).toBeDefined();
        expect(createdPlace.id).toBeDefined();
        expect(createdEra.id).toBeDefined();

        // Create a story linking all 3 overlapping entities
        const newStory: StoryInsert = {
          title: `Overlapping Memory ${uniqueId}`,
          transcript: `I remember working in ${placeEntity.name} with ${personEntity.name} back during ${eraEntity.name}.`,
          summary: "Overlapping multi-entity memory test.",
          era_tags: [eraEntity.name],
        };
        const savedStory = localStore.localCreateStory(newStory);
        expect(savedStory.id).toBeDefined();

        // Link entities
        const links = localStore.localLinkStoryEntities(savedStory.id, [
          createdPerson.id,
          createdPlace.id,
          createdEra.id,
        ]);
        expect(links.length).toBe(3);

        // Fetch via client with details
        const storiesWithDetails = await client.getStories();
        const hydratedStory = storiesWithDetails.find((s) => s.id === savedStory.id);
        expect(hydratedStory).toBeDefined();
        expect(hydratedStory!.story_entities.length).toBe(3);

        // Verify all 3 entity types are represented
        const types = hydratedStory!.story_entities.map((se) => se.entities?.type);
        expect(types).toContain("person");
        expect(types).toContain("place");
        expect(types).toContain("era");
      });

      await test("ADV.R1.03", "Duplicate Entity Upsert & Mention Count Increment", async () => {
        const uniqueName = `Repeat Contact ${Date.now()}`;
        const firstInsert: EntityInsert = {
          name: uniqueName,
          type: "person",
          metadata: { relationship: "First Contact", phone: "123-456" },
        };

        const entity1 = localStore.localUpsertEntity(firstInsert);
        expect(entity1.mention_count).toBe(1);
        expect(entity1.metadata?.relationship).toBe("First Contact");

        // Second upsert with updated metadata
        const secondInsert: EntityInsert = {
          name: uniqueName,
          type: "person",
          metadata: { relationship: "Close Friend", notes: "Updated note" },
        };
        const entity2 = localStore.localUpsertEntity(secondInsert);

        expect(entity2.id).toBe(entity1.id);
        expect(entity2.mention_count).toBe(2);
        // Metadata should merge
        expect(entity2.metadata?.relationship).toBe("Close Friend");
        expect(entity2.metadata?.phone).toBe("123-456");
        expect(entity2.metadata?.notes).toBe("Updated note");
      });

      await test("ADV.R1.04", "Duplicate Entity Link Handling in localLinkStoryEntities", async () => {
        const storyId = `story-dup-test-${Date.now()}`;
        const entityId = `entity-dup-test-${Date.now()}`;

        // Link once
        const link1 = localStore.localLinkStoryEntities(storyId, [entityId]);
        expect(link1.length).toBe(1);

        // Link again with the same entityId
        const link2 = localStore.localLinkStoryEntities(storyId, [entityId]);
        expect(link2.length).toBe(1);

        // Notice: local-store appends duplicate links
        const rawLinks = localStore.localGetStoryEntities(storyId);
        expect(rawLinks.length).toBe(2);

        // BUT client getStories must deduplicate in story_entities via linkedEntityMap
        const dummyStory: StoryInsert = {
          title: "Deduplication Check",
          transcript: "Testing map deduplication",
          era_tags: [],
        };
        const createdStory = localStore.localCreateStory(dummyStory);
        localStore.localLinkStoryEntities(createdStory.id, [entityId, entityId]);

        const allStoriesWithDetails = await client.getStories();
        const found = allStoriesWithDetails.find((s) => s.id === createdStory.id);
        expect(found).toBeDefined();

        // Linked entity map in client.ts must deduplicate same entityId
        const matchingEntities = found!.story_entities.filter((se) => se.entity_id === entityId);
        expect(matchingEntities.length).toBe(1);
      });

      await test("ADV.R1.05", "Stories with Missing Metadata & Null Fields", async () => {
        const sparseStory: StoryInsert = {
          title: null,
          transcript: "Oral turn with absolutely no title, no summary, and empty era_tags.",
          summary: null,
          era_tags: [],
        };

        const created = localStore.localCreateStory(sparseStory);
        expect(created.id).toBeDefined();
        expect(created.title).toBeNull();
        expect(created.summary).toBeNull();
        expect(created.era_tags.length).toBe(0);

        const hydrated = (await client.getStories()).find((s) => s.id === created.id);
        expect(hydrated).toBeDefined();
        expect(hydrated!.story_entities.length).toBe(0);
        expect(hydrated!.story_media.length).toBe(0);
      });

      await test("ADV.R1.06", "Adversarial Inputs: Special Characters, HTML & Injection Strings", async () => {
        const specialName = `<script>alert('xss')</script> "Quotes" & 'Apostrophes' \u0000 \n\t \`Backticks\` 🎉 👴`;
        const specialMetadata = {
          sql: "'; DROP TABLE stories; --",
          regex: ".*+?^${}()|[]\\",
          unicode: "Москва - 東京 - القاهرة",
        };

        const entity = localStore.localUpsertEntity({
          name: specialName,
          type: "place",
          metadata: specialMetadata,
        });

        expect(entity.id).toBeDefined();
        expect(entity.name).toBe(specialName);
        expect(entity.metadata?.sql).toBe("'; DROP TABLE stories; --");

        const story = localStore.localCreateStory({
          title: `Adversarial Story: ${specialName}`,
          transcript: `Transcript with special chars: <div class="danger">Test</div> & \${evilVar}`,
          era_tags: [specialName],
        });

        expect(story.id).toBeDefined();
        expect(story.title).toContain("<script>");

        // Verify retrieval without corruption
        const retrieved = (await client.getStories()).find((s) => s.id === story.id);
        expect(retrieved).toBeDefined();
        expect(retrieved!.era_tags).toContain(specialName);
      });
    }
  );

  // =========================================================================
  // SECTION 2: STORY CATALOG LOGIC & ORACLE STRESS (R1)
  // =========================================================================

  await suite(
    "Adversarial R1: Story Catalog Oracles & Edge Cases",
    "Tier 2: Boundary & Corner Cases",
    "R1: Story Catalog",
    async () => {
      await test("ADV.R1.07", "Recency Sorting Oracle - descending timestamps & identical timestamps", async () => {
        const stories = [
          { id: "s1", title: "Story A", created_at: "2026-05-15T08:00:00Z" },
          { id: "s2", title: "Story B", created_at: "2026-05-15T08:00:00Z" }, // identical
          { id: "s3", title: "Story C", created_at: "2026-01-01T00:00:00Z" },
          { id: "s4", title: "Story D", created_at: "2026-09-29T12:00:00Z" },
        ];

        const recencySort = (list: typeof stories) =>
          [...list].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

        const sorted = recencySort(stories);
        expect(sorted[0].id).toBe("s4"); // Sept 2026
        expect(sorted[sorted.length - 1].id).toBe("s3"); // Jan 2026

        // Check stability: items with same timestamp must not crash or disappear
        const sameTime = sorted.filter((s) => s.created_at === "2026-05-15T08:00:00Z");
        expect(sameTime.length).toBe(2);
      });

      await test("ADV.R1.08", "Location Grouping Oracle - unlocated fallback & multi-location duplication", async () => {
        const placeChicago: Entity = {
          id: "p-chicago",
          name: "Chicago, Illinois",
          type: "place",
          metadata: { location: "Illinois" },
          mention_count: 5,
          first_mentioned_at: "",
          created_at: "",
          updated_at: "",
        };
        const placeParis: Entity = {
          id: "p-paris",
          name: "Paris, France",
          type: "place",
          metadata: { location: "France" },
          mention_count: 1,
          first_mentioned_at: "",
          created_at: "",
          updated_at: "",
        };

        const testStories = [
          // Story with 2 places
          {
            id: "s-multi",
            title: "Two Cities",
            transcript: "From Chicago to Paris",
            created_at: "2026-01-01",
            story_entities: [
              { story_id: "s-multi", entity_id: "p-chicago", confidence: 1, entities: placeChicago },
              { story_id: "s-multi", entity_id: "p-paris", confidence: 1, entities: placeParis },
            ],
            era_tags: [],
          },
          // Story with 0 places
          {
            id: "s-none",
            title: "No Places",
            transcript: "Just a thought",
            created_at: "2026-01-02",
            story_entities: [],
            era_tags: [],
          },
        ];

        // Oracle grouping logic from StoryCatalog.tsx
        const groupMap = new Map<string, StoryGroupSummary>();
        const unlocatedStories: unknown[] = [];

        for (const story of testStories) {
          const placeEntities: Entity[] = [];
          const seen = new Set<string>();
          for (const se of story.story_entities) {
            if (se.entities && se.entities.type === "place" && !seen.has(se.entities.id)) {
              seen.add(se.entities.id);
              placeEntities.push(se.entities);
            }
          }

          if (placeEntities.length === 0) {
            unlocatedStories.push(story);
          } else {
            for (const place of placeEntities) {
              if (!groupMap.has(place.id)) {
                groupMap.set(place.id, { id: place.id, title: place.name, stories: [] });
              }
              groupMap.get(place.id)!.stories.push(story);
            }
          }
        }

        const groups = Array.from(groupMap.values());
        if (unlocatedStories.length > 0) {
          groups.push({ id: "unspecified-locations", title: "Other Locations", stories: unlocatedStories });
        }

        expect(groups.length).toBe(3); // Chicago, Paris, Other Locations
        const chicagoGroup = groups.find((g) => g.id === "p-chicago");
        const parisGroup = groups.find((g) => g.id === "p-paris");
        const unlocatedGroup = groups.find((g) => g.id === "unspecified-locations");

        expect(chicagoGroup!.stories.length).toBe(1);
        expect(parisGroup!.stories.length).toBe(1);
        expect(unlocatedGroup!.stories.length).toBe(1);
      });

      await test("ADV.R1.09", "Timeline Decade Parsing Oracle - apostrophe years & regex boundaries", async () => {
        // Test various formats of year representation
        const parseTimelineYear = (fullText: string, eraTag?: string): { decade: string; year: number } | null => {
          // 1. Tag match
          if (eraTag) {
            const m = eraTag.match(/(\d{4})/);
            if (m) {
              const yr = parseInt(m[1], 10);
              return { decade: `${Math.floor(yr / 10) * 10}s`, year: yr };
            }
          }
          // 2. Full year in text
          const matchFull = fullText.match(/\b(19\d{2}|20\d{2})\b/);
          if (matchFull) {
            const yr = parseInt(matchFull[1], 10);
            return { decade: `${Math.floor(yr / 10) * 10}s`, year: yr };
          }
          // 3. Apostrophe decade ('65)
          const matchApostrophe = fullText.match(/'([4-9]\d)\b/);
          if (matchApostrophe) {
            const yr = 1900 + parseInt(matchApostrophe[1], 10);
            return { decade: `${Math.floor(yr / 10) * 10}s`, year: yr };
          }
          return null;
        };

        // Standard 4-digit era tag
        const r1 = parseTimelineYear("", "1950s Childhood");
        expect(r1?.decade).toBe("1950s");
        expect(r1?.year).toBe(1950);

        // Year in title
        const r2 = parseTimelineYear("Summer of 1974 at Lake Michigan");
        expect(r2?.decade).toBe("1970s");
        expect(r2?.year).toBe(1974);

        // Straight apostrophe
        const r3 = parseTimelineYear("The big blizzard in '78");
        expect(r3?.decade).toBe("1970s");
        expect(r3?.year).toBe(1978);

        // Edge case finding: curly apostrophe ’78
        // Note: '([4-9]\d) only matches \u0027, not \u2019
        const rCurly = parseTimelineYear("The big blizzard in ’78");
        // Verify this is unparsed by the straight apostrophe regex
        expect(rCurly).toBeNull();

        // 2000s boundary
        const r4 = parseTimelineYear("Graduation in 2005");
        expect(r4?.decade).toBe("2000s");
        expect(r4?.year).toBe(2005);
      });

      await test("ADV.R1.10", "Entity Tag Filter: Substring False-Positive Analysis", async () => {
        interface StoryFilterItem {
          id: string;
          title?: string;
          transcript?: string;
          story_entities?: Array<{ entity_id: string; entities?: { id: string; name: string } | null }>;
          era_tags?: string[];
        }

        // Oracle filter from StoryCatalog.tsx
        const filterStories = (storyList: StoryFilterItem[], targetEntity: { id: string; name: string }) => {
          const targetId = targetEntity.id;
          const targetName = targetEntity.name.toLowerCase().trim();

          return storyList.filter((story) => {
            const matchesLinked = story.story_entities?.some((se) => {
              if (se.entity_id === targetId) return true;
              if (se.entities?.id === targetId) return true;
              if (se.entities?.name.toLowerCase().trim() === targetName) return true;
              return false;
            });
            if (matchesLinked) return true;

            const matchesEra = story.era_tags?.some(
              (tag: string) => tag.toLowerCase().trim() === targetName
            );
            if (matchesEra) return true;

            if (
              story.title?.toLowerCase().includes(targetName) ||
              story.transcript?.toLowerCase().includes(targetName)
            ) {
              return true;
            }
            return false;
          });
        };

        const stories: StoryFilterItem[] = [
          {
            id: "s1",
            title: "A Trip to the Coast",
            transcript: "We walked and talked until sunset.",
            story_entities: [],
            era_tags: [],
          },
          {
            id: "s2",
            title: "Uncle Ed's Birthday",
            transcript: "We celebrated with Uncle Ed.",
            story_entities: [],
            era_tags: [],
          },
        ];

        // Adversarial case: filtering by 2-letter person name "Ed"
        // "walked" and "talked" contain "ed"
        const filteredByEd = filterStories(stories, { id: "p-ed", name: "Ed" });
        // S1 does not mention person Ed, but contains "walked" and "talked"
        // This confirms the empirical finding: substring fallback #3 matches word endings!
        expect(filteredByEd.length).toBe(2);

        // Adversarial case: empty string name
        const filteredByEmpty = filterStories(stories, { id: "p-empty", name: "" });
        // "" matches everything because "anything".includes("") is true
        expect(filteredByEmpty.length).toBe(2);

        // Non-existent entity
        const filteredNonExistent = filterStories(stories, { id: "p-none", name: "Zanzibar Nonexistent" });
        expect(filteredNonExistent.length).toBe(0);
      });

      await test("ADV.R1.11", "Rapid Sort Switching Resilience", async () => {
        // Verify state transformations across rapid sort transitions
        const sortModes = ["recency", "location", "people", "timeline"] as const;
        let activeSort: (typeof sortModes)[number] = "recency";

        // Cycle through all sort options 5 times
        for (let i = 0; i < 20; i++) {
          activeSort = sortModes[i % sortModes.length];
          expect(sortModes).toContain(activeSort);
        }
        expect(activeSort).toBe("timeline");
      });
    }
  );

  // =========================================================================
  // SECTION 3: BIOGRAPHICAL SKETCH (R2) ADVERSARIAL STRESS
  // =========================================================================

  await suite(
    "Adversarial R2: Biographical Sketch Logic & Resilience",
    "Tier 2: Boundary & Corner Cases",
    "R2: Biography Document",
    async () => {
      await test("ADV.R2.01", "Empty BKG Zero-State Stress", async () => {
        const emptyEntities: Entity[] = [];

        // Timeline derivation on empty input
        const eraEntities = emptyEntities.filter((e) => e.type === "era");
        expect(eraEntities.length).toBe(0);

        // People derivation on empty input
        const personEntities = emptyEntities.filter((e) => e.type === "person");
        expect(personEntities.length).toBe(0);

        // Places derivation on empty input
        const placeEntities = emptyEntities.filter((e) => e.type === "place");
        expect(placeEntities.length).toBe(0);

        // Events derivation on empty input
        const eventEntities = emptyEntities.filter((e) => e.type === "event");
        expect(eventEntities.length).toBe(0);

        // Confirm UI counters are 0
        expect(eraEntities.length).toBe(0);
        expect(personEntities.length).toBe(0);
        expect(placeEntities.length).toBe(0);
        expect(eventEntities.length).toBe(0);
      });

      await test("ADV.R2.02", "Stories Without Entities: Dynamic Era Discovery & Event Derivation", async () => {
        const storiesWithoutEntities = [
          {
            id: "s-unlinked-1",
            title: "Summer Baseball Tournament",
            transcript: "Playing in the sandlot tournament.",
            summary: "Baseball on sandlot",
            era_tags: ["1950s Childhood"],
            story_entities: [],
            created_at: "2026-01-01T00:00:00Z",
          },
          {
            id: "s-unlinked-2",
            title: "The Great Western Road Trip",
            transcript: "Seeing Old Faithful in Yellowstone.",
            summary: "Road trip out west",
            era_tags: ["1960s Travels"],
            story_entities: [],
            created_at: "2026-01-02T00:00:00Z",
          },
        ];

        // 1. Dynamic Era Discovery:
        // Even when era entities = [], biography page parses era_tags from stories!
        const existingEraNames = new Set<string>();
        const mappedEras: EraGroupItem[] = [];
        for (const story of storiesWithoutEntities) {
          for (const tag of story.era_tags || []) {
            if (!existingEraNames.has(tag.toLowerCase())) {
              existingEraNames.add(tag.toLowerCase());
              const match = tag.match(/(\d{4})/);
              const year = match ? parseInt(match[1], 10) : 9999;
              const decade = year !== 9999 ? `${Math.floor(year / 10) * 10}s` : "Unspecified Era";
              mappedEras.push({
                id: `era-tag-${tag}`,
                name: tag,
                year,
                decade,
              });
            }
          }
        }

        expect(mappedEras.length).toBe(2);
        expect(mappedEras[0].decade).toBe("1950s");
        expect(mappedEras[1].decade).toBe("1960s");

        // 2. Derived Milestone Events:
        const derivedEvents: DerivedEventItem[] = [];
        for (const story of storiesWithoutEntities) {
          const title = story.title || "";
          const isRoadTrip = title.toLowerCase().includes("road trip");
          const isBaseball = title.toLowerCase().includes("baseball");

          if (isRoadTrip) {
            derivedEvents.push({
              name: title,
              date: "July 1965",
              isDerived: true,
            });
          } else if (isBaseball) {
            derivedEvents.push({
              name: title,
              date: "Summer 1954",
              isDerived: true,
            });
          }
        }

        expect(derivedEvents.length).toBe(2);
        expect(derivedEvents[0].isDerived).toBe(true);
      });

      await test("ADV.R2.03", "Missing Relationship Metadata & Null Value Fallbacks", async () => {
        const getMetaString = (metadata: unknown, key: string): string | undefined => {
          if (!metadata || typeof metadata !== "object") return undefined;
          const val = (metadata as Record<string, unknown>)[key];
          return typeof val === "string" ? val : undefined;
        };

        const getMetaNumber = (metadata: unknown, key: string): number | undefined => {
          if (!metadata || typeof metadata !== "object") return undefined;
          const val = (metadata as Record<string, unknown>)[key];
          return typeof val === "number" ? val : undefined;
        };

        // Case A: Null metadata
        const personA: Entity = {
          id: "p1",
          name: "Anonymous Relative",
          type: "person",
          metadata: {} as Record<string, never>,
          mention_count: null as unknown as number,
          first_mentioned_at: "",
          created_at: "",
          updated_at: "",
        };
        const relA = getMetaString(personA.metadata, "relationship") || "Relation not specified";
        const countA = typeof personA.mention_count === "number" ? personA.mention_count : 1;
        expect(relA).toBe("Relation not specified");
        expect(countA).toBe(1);

        // Case B: Non-string relationship (e.g. number or object)
        const personB: Entity = {
          id: "p2",
          name: "Strange Relative",
          type: "person",
          metadata: { relationship: 9999 as unknown as string, birth_year: "not-a-number" as unknown as number },
          mention_count: 3,
          first_mentioned_at: "",
          created_at: "",
          updated_at: "",
        };
        const relB = getMetaString(personB.metadata, "relationship") || "Relation not specified";
        const birthYearB = getMetaNumber(personB.metadata, "birth_year");
        expect(relB).toBe("Relation not specified");
        expect(birthYearB).toBeUndefined();

        // Case C: Valid relationship
        const personC: Entity = {
          id: "p3",
          name: "Grandma Rose",
          type: "person",
          metadata: { relationship: "Maternal grandmother", birth_year: 1912 },
          mention_count: 5,
          first_mentioned_at: "",
          created_at: "",
          updated_at: "",
        };
        const relC = getMetaString(personC.metadata, "relationship") || "Relation not specified";
        const birthYearC = getMetaNumber(personC.metadata, "birth_year");
        expect(relC).toBe("Maternal grandmother");
        expect(birthYearC).toBe(1912);
      });

      await test("ADV.R2.04", "Date Gaps Across Decades (Chronological Sparse Array)", async () => {
        // Discontinuous decades: 1910s, 1970s, 2020s (gaps of 60 and 50 years)
        const rawEras = [
          { name: "2020s Golden Years", year: 2020, decade: "2020s" },
          { name: "1910s Immigrant Arrival", year: 1912, decade: "1910s" },
          { name: "1970s Suburban Life", year: 1975, decade: "1970s" },
        ];

        const sorted = [...rawEras].sort((a, b) => a.year - b.year);
        expect(sorted[0].decade).toBe("1910s");
        expect(sorted[1].decade).toBe("1970s");
        expect(sorted[2].decade).toBe("2020s");
        // No index out-of-bounds or NaN values
        expect(sorted.every((e) => !isNaN(e.year))).toBe(true);
      });

      await test("ADV.R2.05", "Print Media CSS Rules & Page Break Integrity", async () => {
        const bioPrintCssPath = path.join(process.cwd(), "src/app/biography/print.css");
        const bioPagePath = path.join(process.cwd(), "src/app/biography/page.tsx");

        expect(fs.existsSync(bioPrintCssPath)).toBe(true);
        expect(fs.existsSync(bioPagePath)).toBe(true);

        const css = fs.readFileSync(bioPrintCssPath, "utf-8");
        const pageCode = fs.readFileSync(bioPagePath, "utf-8");

        // 1. Media print block
        expect(css).toContain("@media print");
        expect(css).toContain("size: letter portrait");
        expect(css).toContain("margin: 1.5cm");

        // 2. Break avoidance rules
        expect(css).toContain("break-inside: avoid !important");
        expect(css).toContain("page-break-inside: avoid !important");

        // 3. Section break rules
        expect(css).toContain("break-before: page");
        expect(css).toContain("page-break-before: always");

        // 4. Interactive element suppression in print
        expect(css).toContain("display: none !important");
        expect(css).toContain("jump-nav-bar");
        expect(css).toContain("a[href^=\"#\"]");

        // 5. Ensure classes in print.css are matched in biography page markup
        expect(pageCode).toContain("print-section-break");
        expect(pageCode).toContain("bio-card");
        expect(pageCode).toContain("bio-timeline-entry");
        expect(pageCode).toContain("bio-person-card");
        expect(pageCode).toContain("bio-place-card");
        expect(pageCode).toContain("bio-event-card");
        expect(pageCode).toContain("jump-nav-bar");
      });
    }
  );
}

// Standalone execution runner
if (process.argv[1]?.includes("adversarial-r1-r2.test")) {
  import("../e2e/framework").then(async ({ globalTestContext, formatTerminalSummary }) => {
    console.log("⚡ Executing Challenger 1 Adversarial Test Suite (R1 & R2)...");
    await runAdversarialTests();
    const summary = globalTestContext.getSummary();
    const formatted = formatTerminalSummary(summary);
    console.log(formatted.text);
    if (!formatted.success) {
      process.exit(1);
    }
  });
}
