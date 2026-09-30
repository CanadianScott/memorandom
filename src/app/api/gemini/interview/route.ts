import { NextRequest, NextResponse } from "next/server";
import { generateNextQuestion } from "../../../../lib/gemini/interview";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const transcript = body.transcript || "";
    const knowledgeGraphSummary = body.knowledgeGraphSummary || "";
    const mode = body.mode || "surprise_me";
    const previousInteractionId = body.previousInteractionId;

    const result = await generateNextQuestion(
      transcript,
      knowledgeGraphSummary,
      mode,
      previousInteractionId
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Gemini interview route error:", error);
    // Return fallback question rather than 500
    return NextResponse.json({
      question: {
        question: "What was your favorite game or pastime to play as a child, and who did you play it with?",
        followUps: ["Where did you usually play?", "What made that so special to you?"],
        topic: "Childhood Memories",
        relatedEntityNames: [],
      },
      detectedEntities: [],
      visualQuery: "vintage 1950s children playing outside",
      artPrompt: "Children playing outdoors on a nostalgic sunny afternoon in the 1950s",
      mapQuery: "Chicago, Illinois",
    });
  }
}
