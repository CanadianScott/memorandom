import { supabase, StoryWithDetails, isSupabaseConfigured } from "@/lib/supabase/client";
import { Chapter } from "@/types/database";
import { localCreateChapter, localReorderChapters } from "@/lib/supabase/local-store";

export async function autoOrganizeChapters(
  stories: StoryWithDetails[]
): Promise<{ title: string; storyIds: string[] }[]> {
  const chaptersMap = new Map<string, string[]>();

  // Sort stories by created_at ascending to maintain chronological order where possible
  const sortedStories = [...stories].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  sortedStories.forEach((story) => {
    let chapterTitle = "Early Memories";
    if (story.era_tags && story.era_tags.length > 0) {
      chapterTitle = story.era_tags[0];
    } else if (story.created_at) {
      const year = new Date(story.created_at).getFullYear();
      chapterTitle = `Memories from ${year}`;
    }

    if (!chaptersMap.has(chapterTitle)) {
      chaptersMap.set(chapterTitle, []);
    }
    chaptersMap.get(chapterTitle)!.push(story.id);
  });

  const chapters: { title: string; storyIds: string[] }[] = [];
  chaptersMap.forEach((storyIds, title) => {
    chapters.push({ title, storyIds });
  });

  return chapters;
}

export async function createChapter(
  title: string,
  storyIds: string[],
  coverMediaId?: string,
  userId = "blair"
): Promise<Chapter> {
  if (!isSupabaseConfigured) {
    return localCreateChapter(title, storyIds, coverMediaId, userId);
  }

  try {
    const { data: existingChapters } = await supabase
      .from("chapters")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1);

    const nextOrder = existingChapters && existingChapters.length > 0
      ? existingChapters[0].display_order + 1
      : 1;

    const { data: chapter, error: chapterError } = await supabase
      .from("chapters")
      .insert({
        title,
        cover_media_id: coverMediaId ?? null,
        display_order: nextOrder,
      } as never)
      .select()
      .single();

    if (chapterError) throw chapterError;

    if (storyIds.length > 0) {
      const chapterStories = storyIds.map((storyId, index) => ({
        chapter_id: chapter.id,
        story_id: storyId,
        display_order: index + 1,
      }));
      const { error: storiesError } = await supabase
        .from("chapter_stories")
        .insert(chapterStories as never);
      if (storiesError) throw storiesError;
    }

    return chapter as Chapter;
  } catch (err) {
    console.warn("Supabase createChapter failed, falling back to local:", err);
    return localCreateChapter(title, storyIds, coverMediaId, userId);
  }
}

export async function reorderChapters(chapterIds: string[], userId = "blair"): Promise<void> {
  if (!isSupabaseConfigured) {
    localReorderChapters(chapterIds, userId);
    return;
  }

  try {
    const updates = chapterIds.map((id, index) => ({
      id,
      display_order: index + 1,
    }));
    const { error } = await supabase.from("chapters").upsert(updates as never);
    if (error) throw error;
  } catch (err) {
    console.warn("Supabase reorderChapters failed, falling back to local:", err);
    localReorderChapters(chapterIds, userId);
  }
}

export function generateChapterSummary(stories: StoryWithDetails[]): string {
  const snippets = stories.map((s) => s.summary || s.transcript.substring(0, 100));
  return `A chapter encompassing ${stories.length} stories, touching upon: ${snippets
    .map((s) => s.trim())
    .join("... ")}`.substring(0, 500) + "...";
}
