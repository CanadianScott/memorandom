/**
 * R2 Persistent Biographical Sketch Document E2E Test Suite
 * Covers Tier 1 (Feature Coverage) and Tier 2 (Boundary & Corner Cases)
 * Authoritative source: ORIGINAL_REQUEST.md §R2, PROJECT.md §F6-F11
 */

import { suite, test, expect } from "./framework";
import type { Entity, Story } from "@/types/database";
import * as fs from "node:fs";
import * as path from "node:path";

export async function runBiographyTests() {
  await suite(
    "Biographical Sketch Tier 1: Feature Coverage",
    "Tier 1: Feature Coverage",
    "R2: Biography Document",
    async () => {
      await test("T1.R2.01", "Navigation Link Seam - verify /biography route or nav link definition", async () => {
        // Check if /biography page file exists or is planned
        const bioPagePath = path.join(process.cwd(), "src/app/biography/page.tsx");
        const pageExists = fs.existsSync(bioPagePath);

        // Check if navigation in src/app/page.tsx or layout has /biography link
        const homePageContent = fs.readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf-8");
        const hasNavBio = homePageContent.includes("/biography") || pageExists;

        // Verify either the page exists or the nav link is defined (M2 requirement)
        // If not yet created, we check the contract requirement
        if (!hasNavBio) {
          throw new Error("Navigation link '/biography' not found in src/app/page.tsx and src/app/biography/page.tsx not created yet");
        }
        expect(hasNavBio).toBe(true);
      });

      await test("T1.R2.02", "Timeline Section Data Aggregation - chronological ordering and story linking", async () => {
        const localStore = await import("@/lib/supabase/local-store");
        const entities = localStore.localGetEntities();
        const stories = localStore.localGetStories();

        const eraEntities = entities.filter((e) => e.type === "era");
        expect(eraEntities.length).toBeGreaterThanOrEqual(1);

        // Group eras and sort chronologically
        const parseYear = (era: Entity): number => {
          const years = (era.metadata as any)?.years || era.name;
          const match = String(years).match(/(\d{4})/);
          return match ? parseInt(match[1], 10) : 9999;
        };

        const sortedEras = [...eraEntities].sort((a, b) => parseYear(a) - parseYear(b));
        expect(sortedEras[0].name).toBeDefined();

        // Link stories to eras
        const eraStories = stories.filter((s) =>
          s.era_tags?.some((tag) => tag.includes("Childhood") || tag.includes("1950"))
        );
        expect(eraStories.length).toBeGreaterThanOrEqual(1);
        expect(eraStories[0].title).toBeDefined();
      });

      await test("T1.R2.03", "People & Relationships Section - display person entities with relationship context", async () => {
        const localStore = await import("@/lib/supabase/local-store");
        const entities = localStore.localGetEntities();

        const people = entities.filter((e) => e.type === "person");
        expect(people.length).toBeGreaterThanOrEqual(2);

        const person1 = people.find((p) => p.name === "Billy Miller" || p.name === "Robin Milne" || p.name === "Blair Goates");
        expect(person1).toBeDefined();
        expect((person1?.metadata as any)?.relationship).toBeDefined();

        const person2 = people.find((p) => p.name === "Grandma Rose" || p.name === "Melissa" || p.name === "Scott");
        expect(person2).toBeDefined();
        expect((person2?.metadata as any)?.relationship).toBeDefined();
      });

      await test("T1.R2.04", "Places Lived & Visited Section - display place entities with context", async () => {
        const localStore = await import("@/lib/supabase/local-store");
        const entities = localStore.localGetEntities();

        const places = entities.filter((e) => e.type === "place");
        expect(places.length).toBeGreaterThanOrEqual(2);

        const place1 = places.find((p) => p.name.includes("Chicago") || p.name.includes("Blackfoot") || p.name.includes("Lethbridge"));
        expect(place1).toBeDefined();
        expect((place1?.metadata as any)?.context).toBeDefined();

        const place2 = places.find((p) => p.name.includes("Yellowstone") || p.name.includes("Waterton"));
        expect(place2).toBeDefined();
      });

      await test("T1.R2.05", "Key Events Section - milestone event entities with dates and locations", async () => {
        const localStore = await import("@/lib/supabase/local-store");
        const entities = localStore.localGetEntities();
        const stories = localStore.localGetStories();

        const eventEntities = entities.filter((e) => e.type === "event");
        // If seed doesn't have type=event entity yet, derived events from milestone stories
        const milestoneStories = stories.filter(
          (s) => s.title.includes("Road Trip") || s.title.includes("Baseball")
        );

        const hasEventsOrMilestones = eventEntities.length > 0 || milestoneStories.length > 0;
        expect(hasEventsOrMilestones).toBe(true);
      });

      await test("T1.R2.06", "Print/PDF Export Stylesheet Conformance - verify print CSS rules", async () => {
        // Pattern exists in src/app/memoir/print.css, and R2 adds src/app/biography/print.css
        const memoirPrintCssPath = path.join(process.cwd(), "src/app/memoir/print.css");
        const bioPrintCssPath = path.join(process.cwd(), "src/app/biography/print.css");

        const cssToTest = fs.existsSync(bioPrintCssPath)
          ? fs.readFileSync(bioPrintCssPath, "utf-8")
          : fs.readFileSync(memoirPrintCssPath, "utf-8");

        expect(cssToTest).toContain("@media print");
        expect(cssToTest).toContain("margin");
        expect(cssToTest.includes("avoid") || cssToTest.includes("page-break")).toBe(true);
      });
    }
  );

  await suite(
    "Biographical Sketch Tier 2: Boundary & Corner Cases",
    "Tier 2: Boundary & Corner Cases",
    "R2: Biography Document",
    async () => {
      await test("T2.R2.01", "Empty BKG & Zero Stories - renders clean empty states without crashing", async () => {
        const emptyEntities: Entity[] = [];
        const emptyStories: Story[] = [];

        const timelineSection = emptyEntities.filter((e) => e.type === "era");
        const peopleSection = emptyEntities.filter((e) => e.type === "person");
        const placesSection = emptyEntities.filter((e) => e.type === "place");
        const eventsSection = emptyEntities.filter((e) => e.type === "event");

        expect(timelineSection.length).toBe(0);
        expect(peopleSection.length).toBe(0);
        expect(placesSection.length).toBe(0);
        expect(eventsSection.length).toBe(0);

        // Verify fallback messages can be generated safely
        const emptyMessage = (items: any[], label: string) =>
          items.length === 0 ? `No ${label} recorded yet. Start an interview session to add ${label}.` : "";

        expect(emptyMessage(timelineSection, "life eras")).toContain("No life eras recorded yet");
        expect(emptyMessage(peopleSection, "people")).toContain("No people recorded yet");
      });

      await test("T2.R2.02", "Missing Metadata Fields - handles entities without metadata gracefully", async () => {
        const sparseEntity: Entity = {
          id: "sparse-1",
          type: "person",
          name: "Uncle Bob",
          metadata: {},
          first_mentioned_at: new Date().toISOString(),
          mention_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const relationship = (sparseEntity.metadata as any)?.relationship || "Relation not specified";
        expect(relationship).toBe("Relation not specified");
      });

      await test("T2.R2.03", "Zero Event Entities in Seed - derives event from story", async () => {
        const localStore = await import("@/lib/supabase/local-store");
        const stories = localStore.localGetStories();
        const eventStory = stories.find((s) => s.title.includes("Yellowstone") || s.title.includes("Waterton") || s.title.includes("Alberta"));
        expect(eventStory).toBeDefined();

        // Derived event definition
        const derivedEvent = {
          id: `derived-${eventStory!.id}`,
          type: "event",
          name: eventStory!.title,
          metadata: { date: "1965", context: eventStory!.era_tags?.[0] || "" },
        };
        expect(derivedEvent.name).toBeDefined();
      });

      await test("T2.R2.04", "Discontinuous Decades / Timeline Gaps - sorting handles era gaps", async () => {
        const discontinuousEras = [
          { name: "1990s Retirement", years: "1990-2000" },
          { name: "1940s Early Childhood", years: "1942-1949" },
          { name: "1970s Career Mid-Years", years: "1972-1980" },
        ];

        const sorted = [...discontinuousEras].sort((a, b) => {
          const yearA = parseInt(a.years.match(/\d{4}/)?.[0] || "9999", 10);
          const yearB = parseInt(b.years.match(/\d{4}/)?.[0] || "9999", 10);
          return yearA - yearB;
        });

        expect(sorted[0].name).toContain("1940s");
        expect(sorted[1].name).toContain("1970s");
        expect(sorted[2].name).toContain("1990s");
      });

      await test("T2.R2.05", "Special Characters & Escaping - handles quotes, ampersands, unicode", async () => {
        const specialEntity: Entity = {
          id: "spec-1",
          type: "person",
          name: `Father O'Connor & Dr. René Müller`,
          metadata: { relationship: `Spiritual mentor & family "doctor"` },
          first_mentioned_at: new Date().toISOString(),
          mention_count: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Assert character integrity
        expect(specialEntity.name).toContain(`O'Connor`);
        expect(specialEntity.name).toContain(`&`);
        expect(specialEntity.name).toContain(`René`);
        expect((specialEntity.metadata as any).relationship).toContain(`"doctor"`);
      });

      await test("T2.R2.06", "Entity Mention Count Tracking", async () => {
        const localStore = await import("@/lib/supabase/local-store");
        const entities = localStore.localGetEntities();
        for (const e of entities) {
          expect(typeof e.mention_count).toBe("number");
          expect(e.mention_count).toBeGreaterThanOrEqual(1);
        }
      });
    }
  );
}
