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

export async function createInterviewSession(mode: SessionMode): Promise<InterviewSession> {
  try {
    const dbSession = await createSession(mode);
    return {
      id: dbSession.id,
      mode: mode,
      entitiesMentioned: [],
      questionHistory: [],
    };
  } catch (err) {
    console.warn("createSession failed, using offline session:", err);
    return {
      id: `session-${Date.now()}`,
      mode: mode,
      entitiesMentioned: [],
      questionHistory: [],
    };
  }
}

export async function saveStoryFromTranscript(session: InterviewSession, transcript: string): Promise<Story> {
  const story = await createStory({
    session_id: session.id,
    transcript: transcript,
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
