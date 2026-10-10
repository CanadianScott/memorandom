import {
  Session,
  SessionMode,
  Entity,
  EntityType,
  EntityInsert,
  Story,
  StoryInsert,
  StoryEntity,
  Media,
  Chapter,
  Json,
  SuggestedPrompt,
  SuggestedPromptInsert,
  SuggestedPromptUpdate,
} from "@/types/database";

// ---------------------------------------------------------------------------
// Storage key helpers — Blair uses legacy keys for backward compat
// ---------------------------------------------------------------------------

function storageKey(base: string, userId: string): string {
  if (userId === "blair") return `memorandom_${base}`;
  return `memorandom_${userId}_${base}`;
}

const KEY = {
  SESSIONS: "sessions",
  ENTITIES: "entities",
  STORIES: "stories",
  STORY_ENTITIES: "story_entities",
  MEDIA: "media",
  CHAPTERS: "chapters",
  CHAPTER_STORIES: "chapter_stories",
  SUGGESTED_PROMPTS: "suggested_prompts",
};

const now = new Date().toISOString();

// ---------------------------------------------------------------------------
// Blair seed data (unchanged from original)
// ---------------------------------------------------------------------------

const BLAIR_SEED_ENTITIES: Entity[] = [
  {
    id: "entity-blair",
    name: "Blair Goates",
    type: "person",
    metadata: { relationship: "Narrator", birthYear: "~1958", birthPlace: "Blackfoot, Idaho", career: "Accountant", hobbies: "hiking, skiing, flying", note: "Once owned a plane" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "entity-robin",
    name: "Robin Milne",
    type: "person",
    metadata: { relationship: "Wife", marriedTo: "Blair Goates", context: "Married in early 1980s" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "entity-melissa",
    name: "Melissa",
    type: "person",
    metadata: { relationship: "Daughter", parentOf: "Blair Goates" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "entity-scott",
    name: "Scott",
    type: "person",
    metadata: { relationship: "Son", parentOf: "Blair Goates" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "entity-jessica",
    name: "Jessica",
    type: "person",
    metadata: { relationship: "Daughter", parentOf: "Blair Goates" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "entity-blackfoot",
    name: "Blackfoot, Idaho",
    type: "place",
    metadata: { context: "Birthplace and childhood home", years: "late 1950s–1970s", country: "USA" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "entity-waterton",
    name: "Waterton, Alberta",
    type: "place",
    metadata: { context: "Childhood summer destination", years: "1960s–1970s", country: "Canada", note: "Waterton Lakes National Park area" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "entity-lethbridge",
    name: "Lethbridge, Alberta",
    type: "place",
    metadata: { context: "Adult home, most of career and family life", years: "1980s–present", country: "Canada" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "entity-era-childhood",
    name: "Childhood in Blackfoot",
    type: "era",
    metadata: { years: "1958-1976", location: "Blackfoot, Idaho", note: "Small-town Idaho upbringing with summers in Waterton" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "entity-era-young-adult",
    name: "Marriage & Early Career",
    type: "era",
    metadata: { years: "1978-1985", location: "Lethbridge, Alberta", note: "Married Robin Milne, started accounting career" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "entity-era-career",
    name: "Career & Family Life in Lethbridge",
    type: "era",
    metadata: { years: "1985-present", location: "Lethbridge, Alberta", note: "Raised Melissa, Scott, and Jessica. Accounting career. Hiking, skiing, flying." },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "entity-event-marriage",
    name: "Marriage to Robin Milne",
    type: "event",
    metadata: { year: "~1980", people: "Blair Goates, Robin Milne" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "entity-event-plane",
    name: "Owned a Plane",
    type: "event",
    metadata: { context: "Blair once owned his own aircraft — loved flying", people: "Blair Goates" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
];

const BLAIR_SEED_STORIES: Story[] = [
  {
    id: "story-bio-overview",
    session_id: null,
    title: "A Life Between Idaho and Alberta",
    transcript:
      "Blair Goates was born in the late 1950s in Blackfoot, Idaho, a small town where everyone knew everyone. Each summer, the family would make the drive north to Waterton, Alberta, where the Canadian Rockies met the prairies — a place that would shape his love of the outdoors for the rest of his life. In his early twenties, Blair married Robin Milne and the couple settled in Lethbridge, Alberta, where he built a career in accounting. But numbers were only part of who he was. Blair was a man drawn to the sky and the mountains — he earned his pilot's license and even owned his own plane for a time, loved nothing more than a long hike through the alpine or a day on the ski slopes. Together, Blair and Robin raised three children — Melissa, Scott, and Jessica — filling their Lethbridge home with the same spirit of adventure that had defined his own childhood summers in Waterton.",
    summary:
      "Blair Goates grew up in Blackfoot, Idaho during the late 1950s, spending his childhood summers in the shadow of the Canadian Rockies at Waterton, Alberta. After marrying Robin Milne in his early twenties, he settled in Lethbridge, Alberta, where he built a long career as an accountant while nurturing his passions for hiking, skiing, and flying — at one point owning his own aircraft. He and Robin raised three children, Melissa, Scott, and Jessica, in a household shaped by the same adventurous spirit that had defined his formative years.",
    gemini_interaction_id: null,
    era_tags: ["Childhood in Blackfoot", "Marriage & Early Career", "Career & Family Life in Lethbridge"],
    created_at: now,
    updated_at: now,
  },
  {
    id: "story-waterton-summers",
    session_id: null,
    title: "Summer Days in Waterton Lakes",
    transcript:
      "Every summer when I was growing up, our family would load up the station wagon and drive north from Idaho up to Waterton, Alberta. The way the prairie rolled straight into the sheer cliffs of the Rockies always took my breath away. We would camp by the lakeshore, hike the alpine trails, and watch for grizzly bears and elk across the water. Those summer weeks in Waterton were where I first fell in love with southern Alberta, and it stayed with me for the rest of my life.",
    summary:
      "During his youth in the 1960s, Blair Goates journeyed each summer with his family from Blackfoot north to Waterton Lakes, Alberta. Camped at the dramatic seam where the prairie grasslands meet the steep Rocky Mountain ramparts, he spent those formative weeks hiking alpine ridges and scanning the lake edges for wildlife. Those childhood summer expeditions instilled in him a deep, lasting connection to the southern Alberta wilderness that would ultimately draw him back to build his home in Lethbridge.",
    gemini_interaction_id: null,
    era_tags: ["Childhood in Blackfoot"],
    created_at: now,
    updated_at: now,
  },
];

const BLAIR_SEED_CHAPTERS: Chapter[] = [
  {
    id: "chapter-seed-1",
    title: "Formative Years in Idaho and Waterton",
    summary: "Memories of growing up in Blackfoot, family summers at Waterton Lakes, and youth in the late 1950s and 1960s.",
    cover_media_id: null,
    display_order: 1,
    created_at: now,
    updated_at: now,
  },
  {
    id: "chapter-seed-2",
    title: "Life, Family & Aviation in Southern Alberta",
    summary: "Marriage to Robin, raising Melissa, Scott, and Jessica in Lethbridge, and soaring over the coulees.",
    cover_media_id: null,
    display_order: 2,
    created_at: now,
    updated_at: now,
  },
];

const BLAIR_SEED_CHAPTER_STORIES: { chapter_id: string; story_id: string; display_order: number }[] = [
  { chapter_id: "chapter-seed-1", story_id: "story-bio-overview", display_order: 1 },
  { chapter_id: "chapter-seed-1", story_id: "story-waterton-summers", display_order: 2 },
];

const BLAIR_SEED_STORY_ENTITIES: StoryEntity[] = [
  { story_id: "story-bio-overview", entity_id: "entity-blair", confidence: 1.0 },
  { story_id: "story-bio-overview", entity_id: "entity-robin", confidence: 1.0 },
  { story_id: "story-bio-overview", entity_id: "entity-melissa", confidence: 1.0 },
  { story_id: "story-bio-overview", entity_id: "entity-scott", confidence: 1.0 },
  { story_id: "story-bio-overview", entity_id: "entity-jessica", confidence: 1.0 },
  { story_id: "story-bio-overview", entity_id: "entity-blackfoot", confidence: 1.0 },
  { story_id: "story-bio-overview", entity_id: "entity-waterton", confidence: 1.0 },
  { story_id: "story-bio-overview", entity_id: "entity-lethbridge", confidence: 1.0 },
  { story_id: "story-bio-overview", entity_id: "entity-era-childhood", confidence: 1.0 },
  { story_id: "story-bio-overview", entity_id: "entity-era-young-adult", confidence: 1.0 },
  { story_id: "story-bio-overview", entity_id: "entity-era-career", confidence: 1.0 },
  { story_id: "story-bio-overview", entity_id: "entity-event-marriage", confidence: 1.0 },
  { story_id: "story-bio-overview", entity_id: "entity-event-plane", confidence: 1.0 },
  { story_id: "story-waterton-summers", entity_id: "entity-blair", confidence: 1.0 },
  { story_id: "story-waterton-summers", entity_id: "entity-waterton", confidence: 1.0 },
  { story_id: "story-waterton-summers", entity_id: "entity-era-childhood", confidence: 1.0 },
];

const BLAIR_SEED_SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: "prompt-seed-1",
    prompt: "Dad, tell us about the day you bought your first airplane and took off from the grass runway in Idaho!",
    suggested_by: "Melissa",
    category: "Adventures & Flying",
    status: "pending",
    created_at: now,
  },
  {
    id: "prompt-seed-2",
    prompt: "What is your favorite memory of hiking in Waterton with Mom when we were little?",
    suggested_by: "Jessica",
    category: "Waterton & Outdoors",
    status: "pending",
    created_at: now,
  },
  {
    id: "prompt-seed-3",
    prompt: "How did you and Mom meet, and what was your first date like?",
    suggested_by: "Scott",
    category: "Family & Marriage",
    status: "pending",
    created_at: now,
  },
];

// ---------------------------------------------------------------------------
// Scott seed data
// ---------------------------------------------------------------------------

const SCOTT_SEED_ENTITIES: Entity[] = [
  // People
  {
    id: "se-scott",
    name: "Scott Goates",
    type: "person",
    metadata: { relationship: "Narrator", birthYear: "1981", birthPlace: "Lethbridge, Alberta", career: "Researcher/Epidemiologist", note: "Son of Blair and Robin Goates" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "se-andrea",
    name: "Andrea Wells",
    type: "person",
    metadata: { relationship: "Wife", weddingDate: "August 13, 2005", weddingPlace: "Seattle, Washington" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  { id: "se-elaine", name: "Elaine", type: "person", metadata: { relationship: "Daughter", parentOf: "Scott Goates" }, mention_count: 1, first_mentioned_at: now, created_at: now, updated_at: now },
  { id: "se-joyce",  name: "Joyce",  type: "person", metadata: { relationship: "Daughter", parentOf: "Scott Goates" }, mention_count: 1, first_mentioned_at: now, created_at: now, updated_at: now },
  { id: "se-james",  name: "James",  type: "person", metadata: { relationship: "Son",      parentOf: "Scott Goates" }, mention_count: 1, first_mentioned_at: now, created_at: now, updated_at: now },
  { id: "se-eloise", name: "Eloise", type: "person", metadata: { relationship: "Daughter", parentOf: "Scott Goates" }, mention_count: 1, first_mentioned_at: now, created_at: now, updated_at: now },

  // Places
  {
    id: "se-lethbridge",
    name: "Lethbridge, Alberta",
    type: "place",
    metadata: { context: "Birthplace and childhood home", years: "1981–1999", country: "Canada" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "se-lci",
    name: "LCI (Lethbridge Collegiate Institute)",
    type: "place",
    metadata: { context: "High school, graduated 1999", country: "Canada" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "se-byu",
    name: "Brigham Young University",
    type: "place",
    metadata: { context: "Undergraduate studies, 1999–2006 (with mission break)", city: "Provo, Utah" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "se-france",
    name: "France",
    type: "place",
    metadata: { context: "LDS mission 2000–2002", country: "France" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "se-seattle",
    name: "Seattle, Washington",
    type: "place",
    metadata: { context: "Wedding location, August 13, 2005" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "se-wsu",
    name: "Washington State University",
    type: "place",
    metadata: { context: "PhD studies 2006–2010", city: "Pullman, Washington" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "se-cdc",
    name: "CDC (Centers for Disease Control)",
    type: "place",
    metadata: { context: "Employment after PhD, 2010+" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "se-sc",
    name: "Santa Clarita, California",
    type: "place",
    metadata: { context: "Current home" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },

  // Eras
  {
    id: "se-era-childhood",
    name: "Childhood in Lethbridge",
    type: "era",
    metadata: { years: "1981–1999", note: "Grew up in southern Alberta, attended LCI" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "se-era-byu",
    name: "BYU & Mission Years",
    type: "era",
    metadata: { years: "1999–2006", note: "BYU undergraduate; LDS mission in France 2000–2002" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "se-era-phd",
    name: "PhD at Washington State",
    type: "era",
    metadata: { years: "2006–2010", location: "Pullman, Washington" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "se-era-career",
    name: "Career & Family in California",
    type: "era",
    metadata: { years: "2010–present", location: "Santa Clarita, California" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },

  // Events
  {
    id: "se-event-mission",
    name: "LDS Mission in France",
    type: "event",
    metadata: { year: "2000–2002", location: "France" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "se-event-wedding",
    name: "Marriage to Andrea Wells",
    type: "event",
    metadata: { date: "August 13, 2005", location: "Seattle, Washington" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: "se-event-phd",
    name: "PhD Completion at WSU",
    type: "event",
    metadata: { year: "2010", location: "Pullman, Washington" },
    mention_count: 1,
    first_mentioned_at: now,
    created_at: now,
    updated_at: now,
  },
];

const SCOTT_SEED_STORIES: Story[] = [
  {
    id: "scott-story-bio-overview",
    session_id: null,
    title: "A Life from Lethbridge to California",
    transcript:
      "Scott Goates was born in 1981 in Lethbridge, Alberta, where he grew up and attended LCI high school, graduating in 1999. He went on to study at Brigham Young University in Provo, Utah, though he paused his studies from May 2000 to May 2002 to serve an LDS mission in France — an experience that shaped much of who he became. Back at BYU, he met Andrea Wells, and on August 13, 2005, they married in Seattle, Washington. In 2006, Scott began his PhD at Washington State University in Pullman, completing it in August 2010. He then joined the CDC, building a career in public health research. Scott and Andrea have four children — Elaine, Joyce, James, and Eloise — and the family currently lives in Santa Clarita, California.",
    summary:
      "Scott Goates was born in 1981 in Lethbridge, Alberta, attending LCI before studying at BYU. From 2000–2002 he served an LDS mission in France. He married Andrea Wells on August 13, 2005 in Seattle, completed a PhD at Washington State University (2006–2010), and joined the CDC after graduation. Scott and Andrea have four children — Elaine, Joyce, James, and Eloise — and make their home in Santa Clarita, California.",
    gemini_interaction_id: null,
    era_tags: ["Childhood in Lethbridge", "BYU & Mission Years", "PhD at Washington State", "Career & Family in California"],
    created_at: now,
    updated_at: now,
  },
];

const SCOTT_SEED_CHAPTERS: Chapter[] = [
  {
    id: "scott-chapter-seed-1",
    title: "From Lethbridge to Provo",
    summary: "Growing up in Lethbridge, high school at LCI, and the early BYU years.",
    cover_media_id: null,
    display_order: 1,
    created_at: now,
    updated_at: now,
  },
  {
    id: "scott-chapter-seed-2",
    title: "Mission, Marriage & a PhD",
    summary: "Two years in France, meeting Andrea, and completing a PhD at Washington State.",
    cover_media_id: null,
    display_order: 2,
    created_at: now,
    updated_at: now,
  },
];

const SCOTT_SEED_CHAPTER_STORIES: { chapter_id: string; story_id: string; display_order: number }[] = [
  { chapter_id: "scott-chapter-seed-1", story_id: "scott-story-bio-overview", display_order: 1 },
];

const SCOTT_SEED_STORY_ENTITIES: StoryEntity[] = [
  { story_id: "scott-story-bio-overview", entity_id: "se-scott",        confidence: 1.0 },
  { story_id: "scott-story-bio-overview", entity_id: "se-andrea",       confidence: 1.0 },
  { story_id: "scott-story-bio-overview", entity_id: "se-lethbridge",   confidence: 1.0 },
  { story_id: "scott-story-bio-overview", entity_id: "se-lci",          confidence: 1.0 },
  { story_id: "scott-story-bio-overview", entity_id: "se-byu",          confidence: 1.0 },
  { story_id: "scott-story-bio-overview", entity_id: "se-france",       confidence: 1.0 },
  { story_id: "scott-story-bio-overview", entity_id: "se-seattle",      confidence: 1.0 },
  { story_id: "scott-story-bio-overview", entity_id: "se-wsu",          confidence: 1.0 },
  { story_id: "scott-story-bio-overview", entity_id: "se-cdc",          confidence: 1.0 },
  { story_id: "scott-story-bio-overview", entity_id: "se-sc",           confidence: 1.0 },
  { story_id: "scott-story-bio-overview", entity_id: "se-era-childhood", confidence: 1.0 },
  { story_id: "scott-story-bio-overview", entity_id: "se-era-byu",      confidence: 1.0 },
  { story_id: "scott-story-bio-overview", entity_id: "se-era-phd",      confidence: 1.0 },
  { story_id: "scott-story-bio-overview", entity_id: "se-era-career",   confidence: 1.0 },
  { story_id: "scott-story-bio-overview", entity_id: "se-event-mission", confidence: 1.0 },
  { story_id: "scott-story-bio-overview", entity_id: "se-event-wedding", confidence: 1.0 },
  { story_id: "scott-story-bio-overview", entity_id: "se-event-phd",    confidence: 1.0 },
];

const SCOTT_SEED_SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: "scott-prompt-seed-1",
    prompt: "Scott, what was your favorite memory from your mission in France?",
    suggested_by: "Andrea",
    category: "Mission & Faith",
    status: "pending",
    created_at: now,
  },
  {
    id: "scott-prompt-seed-2",
    prompt: "Tell us about how you and Andrea met at BYU and what your first date was like.",
    suggested_by: "Elaine",
    category: "Family & Marriage",
    status: "pending",
    created_at: now,
  },
  {
    id: "scott-prompt-seed-3",
    prompt: "What was it like defending your PhD and moving to work at the CDC?",
    suggested_by: "Joyce",
    category: "Career & Education",
    status: "pending",
    created_at: now,
  },
];

// ---------------------------------------------------------------------------
// Seed lookup by userId
// ---------------------------------------------------------------------------

function getSeed(userId: string) {
  if (userId === "scott") {
    return {
      entities: SCOTT_SEED_ENTITIES,
      stories: SCOTT_SEED_STORIES,
      storyEntities: SCOTT_SEED_STORY_ENTITIES,
      chapters: SCOTT_SEED_CHAPTERS,
      chapterStories: SCOTT_SEED_CHAPTER_STORIES,
      suggestedPrompts: SCOTT_SEED_SUGGESTED_PROMPTS,
    };
  }
  return {
    entities: BLAIR_SEED_ENTITIES,
    stories: BLAIR_SEED_STORIES,
    storyEntities: BLAIR_SEED_STORY_ENTITIES,
    chapters: BLAIR_SEED_CHAPTERS,
    chapterStories: BLAIR_SEED_CHAPTER_STORIES,
    suggestedPrompts: BLAIR_SEED_SUGGESTED_PROMPTS,
  };
}

// ---------------------------------------------------------------------------
// In-memory store (server-side / environments without localStorage)
// Keyed as `memorandom_<userId>_<base>` or `memorandom_<base>` for blair
// ---------------------------------------------------------------------------

const memoryStore: Record<string, unknown[]> = {};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getArray<T>(key: string, userId: string, defaultSeed: T[] = []): T[] {
  const sk = storageKey(key, userId);
  if (isBrowser()) {
    try {
      const stored = window.localStorage.getItem(sk);
      if (stored) {
        return JSON.parse(stored) as T[];
      }
      if (defaultSeed.length > 0) {
        window.localStorage.setItem(sk, JSON.stringify(defaultSeed));
        return [...defaultSeed];
      }
    } catch {
      // Fallback to memory
    }
  }

  if (memoryStore[sk] !== undefined) {
    return [...(memoryStore[sk] as T[])];
  }
  memoryStore[sk] = [...defaultSeed];
  return [...defaultSeed];
}

function saveArray<T>(key: string, userId: string, data: T[]): void {
  const sk = storageKey(key, userId);
  if (isBrowser()) {
    try {
      window.localStorage.setItem(sk, JSON.stringify(data));
    } catch {
      // ignore
    }
  }
  memoryStore[sk] = [...data];
}

// ---------------------------------------------------------------------------
// Entity operations
// ---------------------------------------------------------------------------

export function localGetEntities(type?: EntityType, userId = "blair"): Entity[] {
  const seed = getSeed(userId);
  const all = getArray<Entity>(KEY.ENTITIES, userId, seed.entities);
  if (type) {
    return all.filter((e) => e.type === type);
  }
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export function localUpsertEntity(entity: EntityInsert, userId = "blair"): Entity {
  const all = localGetEntities(undefined, userId);
  const existingIdx = all.findIndex((e) => e.name === entity.name && e.type === entity.type);
  const currentTime = new Date().toISOString();
  if (existingIdx >= 0) {
    const updated: Entity = {
      ...all[existingIdx],
      ...entity,
      mention_count: (all[existingIdx].mention_count || 1) + 1,
      metadata: { ...all[existingIdx].metadata, ...(entity.metadata || {}) } as Record<string, Json>,
      updated_at: currentTime,
    };
    all[existingIdx] = updated;
    saveArray(KEY.ENTITIES, userId, all);
    return updated;
  }
  const created: Entity = {
    id: `entity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: entity.name,
    type: entity.type,
    metadata: (entity.metadata as Record<string, Json>) || {},
    mention_count: entity.mention_count || 1,
    first_mentioned_at: currentTime,
    created_at: currentTime,
    updated_at: currentTime,
  };
  all.push(created);
  saveArray(KEY.ENTITIES, userId, all);
  return created;
}

// ---------------------------------------------------------------------------
// Session operations
// ---------------------------------------------------------------------------

export function localCreateSession(mode: SessionMode, promptUsed?: string, userId = "blair"): Session {
  const sessions = getArray<Session>(KEY.SESSIONS, userId);
  const currentTime = new Date().toISOString();
  const newSession: Session = {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    mode,
    prompt_used: promptUsed ?? null,
    gemini_interaction_id: null,
    started_at: currentTime,
    ended_at: null,
    created_at: currentTime,
  };
  sessions.unshift(newSession);
  saveArray(KEY.SESSIONS, userId, sessions);
  return newSession;
}

export function localEndSession(id: string, userId = "blair"): Session {
  const sessions = getArray<Session>(KEY.SESSIONS, userId);
  const found = sessions.find((s) => s.id === id);
  const currentTime = new Date().toISOString();
  if (found) {
    found.ended_at = currentTime;
    saveArray(KEY.SESSIONS, userId, sessions);
    return found;
  }
  return {
    id,
    mode: "surprise_me",
    prompt_used: null,
    gemini_interaction_id: null,
    started_at: currentTime,
    ended_at: currentTime,
    created_at: currentTime,
  };
}

// ---------------------------------------------------------------------------
// Story operations
// ---------------------------------------------------------------------------

export function localGetStories(userId = "blair"): Story[] {
  const seed = getSeed(userId);
  return getArray<Story>(KEY.STORIES, userId, seed.stories);
}

export function localCreateStory(storyData: StoryInsert, userId = "blair"): Story {
  const seed = getSeed(userId);
  const stories = getArray<Story>(KEY.STORIES, userId, seed.stories);
  const currentTime = new Date().toISOString();
  const newStory: Story = {
    id: storyData.id || `story-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    session_id: storyData.session_id ?? null,
    title: storyData.title ?? null,
    transcript: storyData.transcript,
    summary: storyData.summary ?? null,
    era_tags: storyData.era_tags ?? [],
    gemini_interaction_id: null,
    created_at: currentTime,
    updated_at: currentTime,
  };
  stories.unshift(newStory);
  saveArray(KEY.STORIES, userId, stories);
  return newStory;
}

export function localUpdateStory(id: string, updates: Partial<Pick<Story, "title" | "summary">>, userId = "blair"): void {
  const seed = getSeed(userId);
  const stories = getArray<Story>(KEY.STORIES, userId, seed.stories);
  const idx = stories.findIndex((s) => s.id === id);
  if (idx >= 0) {
    if (updates.title) stories[idx].title = updates.title;
    if (updates.summary) stories[idx].summary = updates.summary;
    stories[idx].updated_at = new Date().toISOString();
    saveArray(KEY.STORIES, userId, stories);
  }
}

export function localDeleteStory(id: string, userId = "blair"): boolean {
  const seed = getSeed(userId);
  const stories = getArray<Story>(KEY.STORIES, userId, seed.stories);
  const storyIndex = stories.findIndex((s) => s.id === id);
  if (storyIndex === -1) {
    return false;
  }
  stories.splice(storyIndex, 1);
  saveArray(KEY.STORIES, userId, stories);

  // Clean up linked story entities
  const storyEntities = getArray<StoryEntity>(KEY.STORY_ENTITIES, userId, seed.storyEntities);
  const filteredLinks = storyEntities.filter((se) => se.story_id !== id);
  saveArray(KEY.STORY_ENTITIES, userId, filteredLinks);

  // Clean up chapter stories junction
  const chapterStories = getArray<{ chapter_id: string; story_id: string; display_order: number }>(
    KEY.CHAPTER_STORIES,
    userId,
    seed.chapterStories
  );
  const filteredChapterStories = chapterStories.filter((cs) => cs.story_id !== id);
  saveArray(KEY.CHAPTER_STORIES, userId, filteredChapterStories);

  return true;
}

// ---------------------------------------------------------------------------
// Story entity link operations
// ---------------------------------------------------------------------------

export function localLinkStoryEntities(storyId: string, entityIds: string[], userId = "blair"): StoryEntity[] {
  const seed = getSeed(userId);
  const links = getArray<StoryEntity>(KEY.STORY_ENTITIES, userId, seed.storyEntities);
  const newLinks: StoryEntity[] = entityIds.map((entityId) => ({
    story_id: storyId,
    entity_id: entityId,
    confidence: 1.0,
  }));
  links.push(...newLinks);
  saveArray(KEY.STORY_ENTITIES, userId, links);
  return newLinks;
}

export function localGetStoryEntities(storyId?: string, userId = "blair"): StoryEntity[] {
  const seed = getSeed(userId);
  const all = getArray<StoryEntity>(KEY.STORY_ENTITIES, userId, seed.storyEntities);
  if (storyId) {
    return all.filter((se) => se.story_id === storyId);
  }
  return all;
}

// ---------------------------------------------------------------------------
// Suggested Prompts operations
// ---------------------------------------------------------------------------

export function localGetSuggestedPrompts(userId = "blair"): SuggestedPrompt[] {
  const seed = getSeed(userId);
  return getArray<SuggestedPrompt>(KEY.SUGGESTED_PROMPTS, userId, seed.suggestedPrompts).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function localCreateSuggestedPrompt(data: SuggestedPromptInsert, userId = "blair"): SuggestedPrompt {
  const seed = getSeed(userId);
  const prompts = getArray<SuggestedPrompt>(KEY.SUGGESTED_PROMPTS, userId, seed.suggestedPrompts);
  const currentTime = new Date().toISOString();
  const targetId = data.id || `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const newPrompt: SuggestedPrompt = {
    id: targetId,
    prompt: data.prompt.trim(),
    suggested_by: (data.suggested_by?.trim()) || "Family Member",
    category: data.category || null,
    status: data.status || "pending",
    created_at: data.created_at || currentTime,
  };
  const existingIdx = prompts.findIndex((p) => p.id === targetId);
  if (existingIdx >= 0) {
    prompts[existingIdx] = newPrompt;
  } else {
    prompts.unshift(newPrompt);
  }
  saveArray(KEY.SUGGESTED_PROMPTS, userId, prompts);
  return newPrompt;
}

export function localUpdateSuggestedPrompt(
  id: string,
  updates: Partial<SuggestedPromptUpdate>,
  userId = "blair"
): SuggestedPrompt | null {
  const seed = getSeed(userId);
  const prompts = getArray<SuggestedPrompt>(KEY.SUGGESTED_PROMPTS, userId, seed.suggestedPrompts);
  const idx = prompts.findIndex((p) => p.id === id);
  if (idx === -1) {
    return null;
  }
  const updated: SuggestedPrompt = {
    ...prompts[idx],
    ...updates,
  };
  prompts[idx] = updated;
  saveArray(KEY.SUGGESTED_PROMPTS, userId, prompts);
  return updated;
}

export function localDeleteSuggestedPrompt(id: string, userId = "blair"): boolean {
  const seed = getSeed(userId);
  const prompts = getArray<SuggestedPrompt>(KEY.SUGGESTED_PROMPTS, userId, seed.suggestedPrompts);
  const idx = prompts.findIndex((p) => p.id === id);
  if (idx === -1) {
    return false;
  }
  prompts.splice(idx, 1);
  saveArray(KEY.SUGGESTED_PROMPTS, userId, prompts);
  return true;
}

// ---------------------------------------------------------------------------
// Chapter operations
// ---------------------------------------------------------------------------

export function localGetChapters(userId = "blair"): Chapter[] {
  const seed = getSeed(userId);
  return getArray<Chapter>(KEY.CHAPTERS, userId, seed.chapters).sort(
    (a, b) => a.display_order - b.display_order
  );
}

export function localGetChapterStories(userId = "blair"): { chapter_id: string; story_id: string; display_order: number }[] {
  const seed = getSeed(userId);
  return getArray<{ chapter_id: string; story_id: string; display_order: number }>(
    KEY.CHAPTER_STORIES,
    userId,
    seed.chapterStories
  );
}

export function localCreateChapter(title: string, storyIds: string[], coverMediaId?: string, userId = "blair"): Chapter {
  const chapters = localGetChapters(userId);
  const nextOrder = chapters.length > 0 ? Math.max(...chapters.map((c) => c.display_order)) + 1 : 1;
  const currentTime = new Date().toISOString();
  const newChapter: Chapter = {
    id: `chapter-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    summary: null,
    cover_media_id: coverMediaId ?? null,
    display_order: nextOrder,
    created_at: currentTime,
    updated_at: currentTime,
  };
  chapters.push(newChapter);
  saveArray(KEY.CHAPTERS, userId, chapters);

  if (storyIds.length > 0) {
    const cs = localGetChapterStories(userId);
    storyIds.forEach((storyId, index) => {
      cs.push({
        chapter_id: newChapter.id,
        story_id: storyId,
        display_order: index + 1,
      });
    });
    saveArray(KEY.CHAPTER_STORIES, userId, cs);
  }

  return newChapter;
}

export function localReorderChapters(chapterIds: string[], userId = "blair"): void {
  const chapters = localGetChapters(userId);
  chapterIds.forEach((id, index) => {
    const chap = chapters.find((c) => c.id === id);
    if (chap) chap.display_order = index + 1;
  });
  saveArray(KEY.CHAPTERS, userId, chapters);
}

// ---------------------------------------------------------------------------
// Media operations (not user-namespaced — shared for now)
// ---------------------------------------------------------------------------

export function localGetMedia(userId = "blair"): Media[] {
  return getArray<Media>(KEY.MEDIA, userId);
}

export function localSaveMedia(media: Media, userId = "blair"): Media {
  const list = localGetMedia(userId);
  list.unshift(media);
  saveArray(KEY.MEDIA, userId, list);
  return media;
}
