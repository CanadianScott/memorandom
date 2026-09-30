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
} from "@/types/database";

const STORAGE_KEYS = {
  SESSIONS: "memorandom_sessions",
  ENTITIES: "memorandom_entities",
  STORIES: "memorandom_stories",
  STORY_ENTITIES: "memorandom_story_entities",
  MEDIA: "memorandom_media",
  CHAPTERS: "memorandom_chapters",
  CHAPTER_STORIES: "memorandom_chapter_stories",
};

const now = new Date().toISOString();

const SEED_ENTITIES: Entity[] = [
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
const SEED_STORIES: Story[] = [];
const SEED_CHAPTERS: Chapter[] = [];
const SEED_CHAPTER_STORIES: { chapter_id: string; story_id: string; display_order: number }[] = [];
const SEED_STORY_ENTITIES: StoryEntity[] = [];

// In-memory cache for server-side or environments without localStorage
const memoryStore: Record<string, unknown[]> = {
  [STORAGE_KEYS.SESSIONS]: [],
  [STORAGE_KEYS.ENTITIES]: [...SEED_ENTITIES],
  [STORAGE_KEYS.STORIES]: [],
  [STORAGE_KEYS.STORY_ENTITIES]: [],
  [STORAGE_KEYS.MEDIA]: [],
  [STORAGE_KEYS.CHAPTERS]: [],
  [STORAGE_KEYS.CHAPTER_STORIES]: [],
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getArray<T>(key: string, defaultSeed: T[] = []): T[] {
  if (isBrowser()) {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as T[];
      }
      if (defaultSeed.length > 0) {
        window.localStorage.setItem(key, JSON.stringify(defaultSeed));
        return [...defaultSeed];
      }
    } catch {
      // Fallback to memory
    }
  }

  if (memoryStore[key]?.length) {
    return memoryStore[key] as T[];
  }
  memoryStore[key] = [...defaultSeed];
  return memoryStore[key] as T[];
}

function saveArray<T>(key: string, data: T[]): void {
  if (isBrowser()) {
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // ignore
    }
  }
  memoryStore[key] = data;
}

// Entity operations
export function localGetEntities(type?: EntityType): Entity[] {
  const all = getArray<Entity>(STORAGE_KEYS.ENTITIES, SEED_ENTITIES);
  if (type) {
    return all.filter((e) => e.type === type);
  }
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export function localUpsertEntity(entity: EntityInsert): Entity {
  const all = localGetEntities();
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
    saveArray(STORAGE_KEYS.ENTITIES, all);
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
  saveArray(STORAGE_KEYS.ENTITIES, all);
  return created;
}

// Session operations
export function localCreateSession(mode: SessionMode, promptUsed?: string): Session {
  const sessions = getArray<Session>(STORAGE_KEYS.SESSIONS);
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
  saveArray(STORAGE_KEYS.SESSIONS, sessions);
  return newSession;
}

export function localEndSession(id: string): Session {
  const sessions = getArray<Session>(STORAGE_KEYS.SESSIONS);
  const found = sessions.find((s) => s.id === id);
  const currentTime = new Date().toISOString();
  if (found) {
    found.ended_at = currentTime;
    saveArray(STORAGE_KEYS.SESSIONS, sessions);
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

// Story operations
export function localCreateStory(storyData: StoryInsert): Story {
  const stories = getArray<Story>(STORAGE_KEYS.STORIES, SEED_STORIES);
  const currentTime = new Date().toISOString();
  const newStory: Story = {
    id: `story-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
  saveArray(STORAGE_KEYS.STORIES, stories);
  return newStory;
}

export function localLinkStoryEntities(storyId: string, entityIds: string[]): StoryEntity[] {
  const links = getArray<StoryEntity>(STORAGE_KEYS.STORY_ENTITIES, SEED_STORY_ENTITIES);
  const newLinks: StoryEntity[] = entityIds.map((entityId) => ({
    story_id: storyId,
    entity_id: entityId,
    confidence: 1.0,
  }));
  links.push(...newLinks);
  saveArray(STORAGE_KEYS.STORY_ENTITIES, links);
  return newLinks;
}

export function localGetStoryEntities(storyId?: string): StoryEntity[] {
  const all = getArray<StoryEntity>(STORAGE_KEYS.STORY_ENTITIES, SEED_STORY_ENTITIES);
  if (storyId) {
    return all.filter((se) => se.story_id === storyId);
  }
  return all;
}

export function localGetStories(): Story[] {
  return getArray<Story>(STORAGE_KEYS.STORIES, SEED_STORIES);
}

// Chapter operations
export function localGetChapters(): Chapter[] {
  return getArray<Chapter>(STORAGE_KEYS.CHAPTERS, SEED_CHAPTERS).sort(
    (a, b) => a.display_order - b.display_order
  );
}

export function localGetChapterStories(): { chapter_id: string; story_id: string; display_order: number }[] {
  return getArray<{ chapter_id: string; story_id: string; display_order: number }>(
    STORAGE_KEYS.CHAPTER_STORIES,
    SEED_CHAPTER_STORIES
  );
}

export function localCreateChapter(title: string, storyIds: string[], coverMediaId?: string): Chapter {
  const chapters = localGetChapters();
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
  saveArray(STORAGE_KEYS.CHAPTERS, chapters);

  if (storyIds.length > 0) {
    const cs = localGetChapterStories();
    storyIds.forEach((storyId, index) => {
      cs.push({
        chapter_id: newChapter.id,
        story_id: storyId,
        display_order: index + 1,
      });
    });
    saveArray(STORAGE_KEYS.CHAPTER_STORIES, cs);
  }

  return newChapter;
}

export function localReorderChapters(chapterIds: string[]): void {
  const chapters = localGetChapters();
  chapterIds.forEach((id, index) => {
    const chap = chapters.find((c) => c.id === id);
    if (chap) chap.display_order = index + 1;
  });
  saveArray(STORAGE_KEYS.CHAPTERS, chapters);
}

// Media operations
export function localGetMedia(): Media[] {
  return getArray<Media>(STORAGE_KEYS.MEDIA);
}

export function localSaveMedia(media: Media): Media {
  const list = localGetMedia();
  list.unshift(media);
  saveArray(STORAGE_KEYS.MEDIA, list);
  return media;
}
