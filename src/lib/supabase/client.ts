import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  Database,
  Session,
  SessionMode,
  Entity,
  EntityType,
  EntityInsert,
  Story,
  StoryInsert,
  StoryEntity,
  StoryEntityInsert,
  Media,
  MediaInsert,
  MediaSource,
  ArtStyle,
  Chapter,
  Json,
  SuggestedPrompt,
  SuggestedPromptInsert,
  SuggestedPromptUpdate,
} from "@/types/database";
import {
  localGetEntities,
  localUpsertEntity,
  localCreateSession,
  localEndSession,
  localCreateStory,
  localDeleteStory,
  localLinkStoryEntities,
  localGetStoryEntities,
  localGetStories,
  localGetChapters,
  localGetChapterStories,
  localGetMedia,
  localSaveMedia,
  localUpdateStory,
  localGetSuggestedPrompts,
  localCreateSuggestedPrompt,
  localUpdateSuggestedPrompt,
  localDeleteSuggestedPrompt,
} from "./local-store";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isValidUrl = Boolean(
  rawUrl &&
  (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) &&
  !rawUrl.includes("your_supabase_url_here") &&
  !rawUrl.includes("placeholder")
);
const isValidKey = Boolean(
  rawKey &&
  !rawKey.includes("your_supabase_anon_key_here") &&
  !rawKey.includes("placeholder")
);

export const isSupabaseConfigured = isValidUrl && isValidKey;
const supabaseUrl = isValidUrl ? rawUrl! : "https://placeholder.supabase.co";
const supabaseAnonKey = isValidKey ? rawKey! : "placeholder-key";

let clientInstance: SupabaseClient<Database> | null = null;

export function createBrowserClient(): SupabaseClient<Database> {
  if (clientInstance) return clientInstance;
  clientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
  return clientInstance;
}

export const supabase = createBrowserClient();

export async function getEntities(type?: EntityType): Promise<Entity[]> {
  if (!isSupabaseConfigured) {
    return localGetEntities(type);
  }
  try {
    let query = supabase.from("entities").select("*").order("name", { ascending: true });
    if (type) {
      query = query.eq("type", type);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.warn("Supabase fetch failed, falling back to local entities:", err);
    return localGetEntities(type);
  }
}

export async function upsertEntity(entity: EntityInsert): Promise<Entity> {
  if (!isSupabaseConfigured) {
    return localUpsertEntity(entity);
  }
  try {
    const { data, error } = await supabase
      .from("entities")
      .upsert(entity as never, { onConflict: "name,type" })
      .select()
      .single();
    if (error) throw error;
    return data as Entity;
  } catch (err) {
    console.warn("Supabase upsert failed, falling back to local entity:", err);
    return localUpsertEntity(entity);
  }
}

export async function createStory(storyData: StoryInsert): Promise<Story> {
  const sanitized = { ...storyData };
  if (!sanitized.summary || sanitized.summary.trim().length < 10 || sanitized.summary.trim() === sanitized.transcript.trim()) {
    const { synthesizeBiographicalFallback } = await import("@/lib/gemini/summarize");
    const fallback = synthesizeBiographicalFallback(sanitized.transcript, sanitized.title || undefined);
    sanitized.summary = fallback.summary;
    if (!sanitized.title || sanitized.title === "Interview Segment" || sanitized.title.toLowerCase().includes("untitled")) {
      sanitized.title = fallback.title;
    }
  }

  if (!isSupabaseConfigured) {
    return localCreateStory(sanitized);
  }
  try {
    const { data: story, error } = await supabase
      .from("stories")
      .insert(sanitized as never)
      .select()
      .single();
    if (error) throw error;
    return story as Story;
  } catch (err) {
    console.warn("Supabase createStory failed, falling back to local story:", err);
    return localCreateStory(sanitized);
  }
}

export async function updateStory(id: string, updates: Partial<Pick<Story, "title" | "summary">>): Promise<void> {
  if (!isSupabaseConfigured) {
    localUpdateStory(id, updates);
    return;
  }
  try {
    const { error } = await supabase
      .from("stories")
      .update(updates as never)
      .eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.warn("Supabase updateStory failed, falling back to local:", err);
    localUpdateStory(id, updates);
  }
}

export async function deleteStory(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return localDeleteStory(id);
  }
  try {
    const { error } = await supabase.from("stories").delete().eq("id", id);
    if (error) throw error;
    localDeleteStory(id);
    return true;
  } catch (err) {
    console.warn("Supabase deleteStory failed, falling back to local:", err);
    return localDeleteStory(id);
  }
}

export async function linkStoryEntities(
  storyId: string,
  entityIds: string[]
): Promise<StoryEntity[]> {
  if (entityIds.length === 0) return [];
  if (!isSupabaseConfigured) {
    return localLinkStoryEntities(storyId, entityIds);
  }
  try {
    const rows: StoryEntityInsert[] = entityIds.map((entityId) => ({
      story_id: storyId,
      entity_id: entityId,
      confidence: 1.0,
    }));
    const { data, error } = await supabase
      .from("story_entities")
      .upsert(rows as never, { onConflict: "story_id,entity_id" })
      .select();
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.warn("Supabase linkStoryEntities failed, falling back to local:", err);
    return localLinkStoryEntities(storyId, entityIds);
  }
}

export type StoryWithDetails = Story & {
  story_entities: (StoryEntity & { entities: Entity | null })[];
  story_media: {
    story_id: string;
    media_id: string;
    display_order: number;
    media: Media | null;
  }[];
};

export interface GetStoriesOptions {
  sessionId?: string;
  limit?: number;
  offset?: number;
}

export async function getStories(
  options?: GetStoriesOptions
): Promise<StoryWithDetails[]> {
  if (!isSupabaseConfigured) {
    return getLocalStoriesWithDetails(options);
  }
  try {
    let query = supabase
      .from("stories")
      .select(`
        *,
        story_entities (
          story_id,
          entity_id,
          confidence,
          entities (*)
        ),
        story_media (
          story_id,
          media_id,
          display_order,
          media (*)
        )
      `)
      .order("created_at", { ascending: false });

    if (options?.sessionId) {
      query = query.eq("session_id", options.sessionId);
    }
    if (typeof options?.offset === "number" && typeof options?.limit === "number") {
      query = query.range(options.offset, options.offset + options.limit - 1);
    } else if (typeof options?.limit === "number") {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as StoryWithDetails[]) ?? [];
  } catch (err) {
    console.warn("Supabase getStories failed, using local stories:", err);
    return getLocalStoriesWithDetails(options);
  }
}

function getLocalStoriesWithDetails(options?: GetStoriesOptions): StoryWithDetails[] {
  let stories = localGetStories();
  if (options?.sessionId) {
    stories = stories.filter((s) => s.session_id === options.sessionId);
  }
  if (typeof options?.offset === "number" && typeof options?.limit === "number") {
    stories = stories.slice(options.offset, options.offset + options.limit);
  } else if (typeof options?.limit === "number") {
    stories = stories.slice(0, options.limit);
  }

  const allEntities = localGetEntities();
  const allStoryEntities = localGetStoryEntities();

  return stories.map((s) => {
    const storyLinks = allStoryEntities.filter((se) => se.story_id === s.id);
    const linkedEntityMap = new Map<string, StoryEntity & { entities: Entity | null }>();

    for (const link of storyLinks) {
      const matched = allEntities.find((e) => e.id === link.entity_id) || null;
      linkedEntityMap.set(link.entity_id, {
        story_id: link.story_id,
        entity_id: link.entity_id,
        confidence: link.confidence,
        entities: matched,
      });
    }

    for (const tag of s.era_tags || []) {
      const matched = allEntities.find((e) => e.name === tag) || null;
      const entityId = matched?.id || tag;
      if (!linkedEntityMap.has(entityId)) {
        linkedEntityMap.set(entityId, {
          story_id: s.id,
          entity_id: entityId,
          confidence: 1.0,
          entities: matched || {
            id: entityId,
            name: tag,
            type: "era",
            metadata: {},
            mention_count: 1,
            first_mentioned_at: s.created_at,
            created_at: s.created_at,
            updated_at: s.created_at,
          },
        });
      }
    }

    return {
      ...s,
      story_entities: Array.from(linkedEntityMap.values()),
      story_media: [],
    };
  });
}

export interface UploadMediaOptions {
  filename?: string;
  mimeType?: string;
  artStyle?: ArtStyle | null;
  attribution?: string | null;
  altText?: string | null;
  caption?: string | null;
  metadata?: Record<string, Json>;
}

export async function uploadMedia(
  file: File | Blob,
  source: MediaSource,
  options?: UploadMediaOptions
): Promise<Media> {
  const ext = options?.filename?.split(".").pop() || "jpg";
  const name = options?.filename || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const storagePath = `${source}/${name}`;
  const contentType = options?.mimeType || (file instanceof File ? file.type : "image/jpeg") || "image/jpeg";

  if (!isSupabaseConfigured) {
    const localUrl = typeof window !== "undefined" && file instanceof Blob ? URL.createObjectURL(file) : "/placeholder-image.jpg";
    const mediaRecord: Media = {
      id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      source,
      storage_path: storagePath,
      url: localUrl,
      filename: name,
      mime_type: contentType,
      width: null,
      height: null,
      art_style: options?.artStyle ?? null,
      attribution: options?.attribution ?? null,
      alt_text: options?.altText ?? null,
      caption: options?.caption ?? null,
      metadata: (options?.metadata as Record<string, Json>) ?? {},
      created_at: new Date().toISOString(),
    };
    return localSaveMedia(mediaRecord);
  }

  try {
    const bucket = source === "generated" ? "generated" : source === "upload" ? "uploads" : "enrichment";
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file, {
        contentType,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    const mediaRecord: MediaInsert = {
      source,
      storage_path: storagePath,
      url: urlData.publicUrl,
      filename: name,
      mime_type: contentType,
      art_style: options?.artStyle ?? null,
      attribution: options?.attribution ?? null,
      alt_text: options?.altText ?? null,
      caption: options?.caption ?? null,
      metadata: options?.metadata ?? {},
    };

    const { data, error: dbError } = await supabase
      .from("media")
      .insert(mediaRecord as never)
      .select()
      .single();

    if (dbError) throw dbError;
    return data as Media;
  } catch (err) {
    console.warn("Supabase uploadMedia failed, saving locally:", err);
    const localUrl = typeof window !== "undefined" && file instanceof Blob ? URL.createObjectURL(file) : "/placeholder-image.jpg";
    const localMedia: Media = {
      id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      source,
      storage_path: storagePath,
      url: localUrl,
      filename: name,
      mime_type: contentType,
      width: null,
      height: null,
      art_style: options?.artStyle ?? null,
      attribution: options?.attribution ?? null,
      alt_text: options?.altText ?? null,
      caption: options?.caption ?? null,
      metadata: (options?.metadata as Record<string, Json>) ?? {},
      created_at: new Date().toISOString(),
    };
    return localSaveMedia(localMedia);
  }
}

export async function getMedia(source?: MediaSource): Promise<Media[]> {
  if (!isSupabaseConfigured) {
    const localItems = localGetMedia();
    return source ? localItems.filter((m) => m.source === source) : localItems;
  }
  try {
    let query = supabase.from("media").select("*").order("created_at", { ascending: false });
    if (source) {
      query = query.eq("source", source);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data as Media[]) ?? [];
  } catch (error) {
    console.warn("Failed to fetch media from Supabase, returning local media:", error);
    const localItems = localGetMedia();
    return source ? localItems.filter((m) => m.source === source) : localItems;
  }
}

export type ChapterWithStories = Chapter & {
  cover_media: Media | null;
  chapter_stories: {
    chapter_id: string;
    story_id: string;
    display_order: number;
    stories: Story | null;
  }[];
};

export async function getChaptersWithStories(): Promise<ChapterWithStories[]> {
  if (!isSupabaseConfigured) {
    return getLocalChaptersWithStories();
  }
  try {
    const { data, error } = await supabase
      .from("chapters")
      .select(`
        *,
        cover_media:cover_media_id (*),
        chapter_stories (
          chapter_id,
          story_id,
          display_order,
          stories (*)
        )
      `)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return (data as unknown as ChapterWithStories[]) ?? [];
  } catch (err) {
    console.warn("Supabase getChaptersWithStories failed, falling back to local:", err);
    return getLocalChaptersWithStories();
  }
}

function getLocalChaptersWithStories(): ChapterWithStories[] {
  const chapters = localGetChapters();
  const chapterStories = localGetChapterStories();
  const stories = localGetStories();

  return chapters.map((c) => ({
    ...c,
    cover_media: null,
    chapter_stories: chapterStories
      .filter((cs) => cs.chapter_id === c.id)
      .sort((a, b) => a.display_order - b.display_order)
      .map((cs) => ({
        chapter_id: cs.chapter_id,
        story_id: cs.story_id,
        display_order: cs.display_order,
        stories: stories.find((s) => s.id === cs.story_id) || null,
      })),
  }));
}

export async function createSession(
  mode: SessionMode,
  promptUsed?: string
): Promise<Session> {
  if (!isSupabaseConfigured) {
    return localCreateSession(mode, promptUsed);
  }
  try {
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        mode,
        prompt_used: promptUsed ?? null,
        started_at: new Date().toISOString(),
      } as never)
      .select()
      .single();

    if (error) throw error;
    return data as Session;
  } catch (err) {
    console.warn("Supabase createSession failed, using local session:", err);
    return localCreateSession(mode, promptUsed);
  }
}

export async function endSession(id: string): Promise<Session> {
  if (!isSupabaseConfigured) {
    return localEndSession(id);
  }
  try {
    const { data, error } = await supabase
      .from("sessions")
      .update({
        ended_at: new Date().toISOString(),
      } as never)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Session;
  } catch (err) {
    console.warn("Supabase endSession failed, using local session:", err);
    return localEndSession(id);
  }
}

export async function getSuggestedPrompts(): Promise<SuggestedPrompt[]> {
  if (!isSupabaseConfigured) {
    return localGetSuggestedPrompts();
  }
  try {
    const { data, error } = await supabase
      .from("suggested_prompts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as unknown as SuggestedPrompt[]) ?? [];
  } catch (err) {
    console.warn("Supabase getSuggestedPrompts failed, using local prompts:", err);
    return localGetSuggestedPrompts();
  }
}

export async function createSuggestedPrompt(
  promptData: SuggestedPromptInsert
): Promise<SuggestedPrompt> {
  if (!isSupabaseConfigured) {
    return localCreateSuggestedPrompt(promptData);
  }
  try {
    const { data, error } = await supabase
      .from("suggested_prompts")
      .insert(promptData as never)
      .select()
      .single();
    if (error) throw error;
    localCreateSuggestedPrompt(data as unknown as SuggestedPromptInsert);
    return data as unknown as SuggestedPrompt;
  } catch (err) {
    console.warn("Supabase createSuggestedPrompt failed, using local store:", err);
    return localCreateSuggestedPrompt(promptData);
  }
}

export async function updateSuggestedPrompt(
  id: string,
  updates: Partial<SuggestedPromptUpdate>
): Promise<SuggestedPrompt | null> {
  if (!isSupabaseConfigured) {
    return localUpdateSuggestedPrompt(id, updates);
  }
  try {
    const { data, error } = await supabase
      .from("suggested_prompts")
      .update(updates as never)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    localUpdateSuggestedPrompt(id, updates);
    return data as unknown as SuggestedPrompt;
  } catch (err) {
    console.warn("Supabase updateSuggestedPrompt failed, using local store:", err);
    return localUpdateSuggestedPrompt(id, updates);
  }
}

export async function deleteSuggestedPrompt(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return localDeleteSuggestedPrompt(id);
  }
  try {
    const { error } = await supabase
      .from("suggested_prompts")
      .delete()
      .eq("id", id);
    if (error) throw error;
    localDeleteSuggestedPrompt(id);
    return true;
  } catch (err) {
    console.warn("Supabase deleteSuggestedPrompt failed, using local store:", err);
    return localDeleteSuggestedPrompt(id);
  }
}
