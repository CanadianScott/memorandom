import { createSession, createStory, linkStoryEntities } from "../supabase/client";
import { SessionMode, Story } from "@/types/database";
import { extractEntities } from "../gemini/entities";
import { upsertExtractedEntities } from "./knowledge-graph";

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
  promptUsed?: string
): Promise<InterviewSession> {
  try {
    const dbSession = await createSession(mode, promptUsed);
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

export async function saveStoryFromTranscript(session: InterviewSession, transcript: string, precomputedSummary?: string | null): Promise<Story> {
  const summary: string | null = precomputedSummary ?? null;

  const story = await createStory({
    session_id: session.id,
    transcript: transcript,
    summary: summary,
    title: session.currentTopic || "Interview Segment",
    era_tags: [],
  });
  
  try {
    const extractionResult = await extractEntities(transcript);
    const dbEntities = await upsertExtractedEntities(extractionResult.entities);
    if (dbEntities.length > 0) {
      await linkStoryEntities(story.id, dbEntities.map((e) => e.id));
    }
  } catch (err) {
    console.warn("Entity linking failed non-critically:", err);
  }
  
  return story;
}
