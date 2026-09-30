import { localGetStoryEntities, localGetStories, localGetEntities } from "@/lib/supabase/local-store";
import { getStories } from "@/lib/supabase/client";

async function verify() {
  console.log("--- 1. Verifying localGetStoryEntities ---");
  const allLinks = localGetStoryEntities();
  console.log("Total story entity links:", allLinks.length);
  if (allLinks.length !== 5) throw new Error("Expected 5 links, got " + allLinks.length);

  const seed1Links = localGetStoryEntities("story-seed-1");
  console.log("story-seed-1 links:", seed1Links.map((l) => l.entity_id));
  if (seed1Links.length !== 3) throw new Error("Expected 3 links for story-seed-1");

  const seed2Links = localGetStoryEntities("story-seed-2");
  console.log("story-seed-2 links:", seed2Links.map((l) => l.entity_id));
  if (seed2Links.length !== 2) throw new Error("Expected 2 links for story-seed-2");

  console.log("--- 2. Verifying getStories details join ---");
  const stories = await getStories();
  console.log("Fetched stories count:", stories.length);
  if (stories.length < 2) throw new Error("Expected at least 2 stories");

  const s1 = stories.find((s) => s.id === "story-seed-1");
  if (!s1) throw new Error("Missing story-seed-1");
  console.log(
    "story-seed-1 entities:",
    s1.story_entities.map((se) =>
      se.entities ? `${se.entities.name} (${se.entities.type})` : "null"
    )
  );
  const s1EntityNames = s1.story_entities.map((se) => se.entities?.name);
  if (!s1EntityNames.includes("Billy Miller")) throw new Error("Missing Billy Miller on story 1");
  if (!s1EntityNames.includes("Chicago, Illinois")) throw new Error("Missing Chicago on story 1");
  if (!s1EntityNames.includes("1950s Childhood")) throw new Error("Missing 1950s Childhood on story 1");

  const s2 = stories.find((s) => s.id === "story-seed-2");
  if (!s2) throw new Error("Missing story-seed-2");
  console.log(
    "story-seed-2 entities:",
    s2.story_entities.map((se) =>
      se.entities ? `${se.entities.name} (${se.entities.type})` : "null"
    )
  );
  const s2EntityNames = s2.story_entities.map((se) => se.entities?.name);
  if (!s2EntityNames.includes("Yellowstone National Park"))
    throw new Error("Missing Yellowstone on story 2");
  if (!s2EntityNames.includes("Grandma Rose")) throw new Error("Missing Grandma Rose on story 2");
  if (!s2EntityNames.includes("1960s Travels")) throw new Error("Missing 1960s Travels on story 2");

  console.log("--- 3. Verifying Entity Filtering Logic ---");
  // Test filter for Billy Miller
  const billyFilter = stories.filter(st =>
    st.story_entities.some(se => se.entities?.name === "Billy Miller")
  );
  if (billyFilter.length !== 1 || billyFilter[0].id !== "story-seed-1") {
    throw new Error("Billy Miller filter failed");
  }
  console.log("Billy Miller filter: OK (matched story-seed-1)");

  // Test filter for Grandma Rose
  const roseFilter = stories.filter(st =>
    st.story_entities.some(se => se.entities?.name === "Grandma Rose")
  );
  if (roseFilter.length !== 1 || roseFilter[0].id !== "story-seed-2") {
    throw new Error("Grandma Rose filter failed");
  }
  console.log("Grandma Rose filter: OK (matched story-seed-2)");

  // Test filter for Chicago
  const chicagoFilter = stories.filter(st =>
    st.story_entities.some(se => se.entities?.name === "Chicago, Illinois")
  );
  if (chicagoFilter.length !== 1 || chicagoFilter[0].id !== "story-seed-1") {
    throw new Error("Chicago filter failed");
  }
  console.log("Chicago filter: OK (matched story-seed-1)");

  // Test filter for Yellowstone
  const yellowstoneFilter = stories.filter(st =>
    st.story_entities.some(se => se.entities?.name === "Yellowstone National Park")
  );
  if (yellowstoneFilter.length !== 1 || yellowstoneFilter[0].id !== "story-seed-2") {
    throw new Error("Yellowstone filter failed");
  }
  console.log("Yellowstone filter: OK (matched story-seed-2)");

  console.log("--- 4. Verifying Location and People Grouping ---");
  const peopleGroups = new Map<string, string[]>();
  for (const st of stories) {
    for (const se of st.story_entities) {
      if (se.entities?.type === "person") {
        const list = peopleGroups.get(se.entities.name) || [];
        list.push(st.id);
        peopleGroups.set(se.entities.name, list);
      }
    }
  }
  console.log("People groups:", Array.from(peopleGroups.entries()));
  if (!peopleGroups.has("Billy Miller") || !peopleGroups.has("Grandma Rose")) {
    throw new Error("People grouping failed");
  }

  const placeGroups = new Map<string, string[]>();
  for (const st of stories) {
    for (const se of st.story_entities) {
      if (se.entities?.type === "place") {
        const list = placeGroups.get(se.entities.name) || [];
        list.push(st.id);
        placeGroups.set(se.entities.name, list);
      }
    }
  }
  console.log("Place groups:", Array.from(placeGroups.entries()));
  if (!placeGroups.has("Chicago, Illinois") || !placeGroups.has("Yellowstone National Park")) {
    throw new Error("Place grouping failed");
  }

  console.log("\n>>> ALL CHECKS PASSED WITH 100% INTEGRITY! <<<");
}

verify().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
