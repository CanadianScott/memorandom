import { createSession, createStory, linkStoryEntities } from "../supabase/client";
import { SessionMode, Story } from "@/types/database";
import { extractEntities } from "../gemini/entities";
import { upsertExtractedEntities } from "./knowledge-graph";
import { generateBiographicalNarrative, synthesizeBiographicalFallback } from "../gemini/summarize";

export interface InterviewSession {
  id: string;
  mode: SessionMode;
  previousInteractionId?: string;
  currentTopic?: string;
  entitiesMentioned: string[];
  questionHistory: string[];
}

export async function createInterviewSession(
  mode: SessionMode,
  promptUsed?: string,
  userId = "blair"
): Promise<InterviewSession> {
  try {
    const dbSession = await createSession(mode, promptUsed, userId);
    return {
      id: dbSession.id,
      mode: mode,
      currentTopic: promptUsed,
      entitiesMentioned: [],
      questionHistory: promptUsed ? [promptUsed] : [],
    };
  } catch (err) {
    console.warn("createSession failed, using offline session:", err);
    return {
      id: `session-${Date.now()}`,
      mode: mode,
      currentTopic: promptUsed,
      entitiesMentioned: [],
      questionHistory: promptUsed ? [promptUsed] : [],
    };
  }
}

export async function saveStoryFromTranscript(
  session: InterviewSession,
  transcript: string,
  precomputedSummary?: string | null,
  precomputedTitle?: string | null,
  userId = "blair"
): Promise<Story> {
  let summary = precomputedSummary;
  let title = precomputedTitle || session.currentTopic || "Interview Segment";

  // If summary was not precomputed, or is too short, or is identical to raw transcript:
  if (!summary || summary.trim().length < 10 || summary.trim() === transcript.trim()) {
    try {
      const narrativeResult = await generateBiographicalNarrative(transcript, title);
      summary = narrativeResult.summary;
      if ((!precomputedTitle || title === "Interview Segment" || title.toLowerCase().includes("untitled")) && narrativeResult.title) {
        title = narrativeResult.title;
      }
    } catch (err) {
      console.warn("Failed to generate biographical narrative in saveStoryFromTranscript:", err);
      const fallback = synthesizeBiographicalFallback(transcript, title);
      summary = fallback.summary;
      if (!precomputedTitle || title === "Interview Segment" || title.toLowerCase().includes("untitled")) {
        title = fallback.title;
      }
    }
  }

  if (!title || title === "Interview Segment" || title.toLowerCase().includes("untitled")) {
    const fallback = synthesizeBiographicalFallback(transcript, title);
    if (fallback.title) title = fallback.title;
  }

  const story = await createStory({
    session_id: session.id,
    transcript: transcript,
    summary: summary,
    title: title,
    era_tags: [],
  }, userId);
  
  try {
    const extractionResult = await extractEntities(transcript);
    const dbEntities = await upsertExtractedEntities(extractionResult.entities, userId);
    if (dbEntities.length > 0) {
      await linkStoryEntities(story.id, dbEntities.map((e) => e.id), userId);
    }
  } catch (err) {
    console.warn("Entity linking failed non-critically:", err);
  }
  
  return story;
}
