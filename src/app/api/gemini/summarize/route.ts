import { NextRequest, NextResponse } from "next/server";
import { getGemini } from "@/lib/gemini/client";

const SYSTEM_INSTRUCTION = `You are a skilled memoir ghostwriter with a warm, literary voice — think David McCullough meets StoryCorps. You are helping preserve the life story of Blair Goates, a man born in the late 1950s in Blackfoot, Idaho, who built his life in Lethbridge, Alberta with his wife Robin. He is a father of three, a former pilot, an accountant, and a lover of hiking and skiing.

Your job is to transform raw, spoken interview transcripts into polished biographical prose. 

STRICT RULES:
- Write ONLY in third person past tense ("Blair recalled...", "He remembered...", "It was a moment...")
- NEVER reproduce the narrator's words verbatim or near-verbatim — always paraphrase into literary prose
- NEVER use first person ("I", "my", "we") in the narrative
- NEVER use phrases like "Blair said", "Blair mentioned", "Blair shared", "Blair noted" repeatedly — vary your attributions or use none at all
- Preserve ALL specific details: names, places, dates, emotions, sensory details
- Omit meaningless filler: "um", "uh", "so what am I supposed to say", single-word answers with no context
- The narrative should read as a passage from a published biography, not a transcript summary`;

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 10) {
      return NextResponse.json({ error: "transcript is required" }, { status: 400 });
    }

    const gemini = getGemini();

    // Primary attempt: ask for JSON with title + narrative
    const prompt = `${SYSTEM_INSTRUCTION}

Transform the following raw oral history interview transcript into:
1. A SHORT TITLE (5-8 words, specific and evocative — never generic like "Interview Session" or "Life Story Session")
2. A NARRATIVE in polished third-person biographical prose. Write as much as the material warrants — from one paragraph for a brief exchange to up to 500 words for a rich session. Let the length be determined by the depth of what was shared.

Raw transcript:
"""
${transcript}
"""

Respond ONLY as valid JSON with no markdown, no code fences, no extra text:
{"title": "...", "summary": "..."}`;

    let response = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const rawText = response?.text?.trim() || "";

    // Try parsing JSON response
    try {
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      const title = typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : null;
      const summary = typeof parsed.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : null;
      if (title && summary) {
        return NextResponse.json({ title, summary });
      }
    } catch {
      // JSON parse failed — fall through to plain text fallback
    }

    // Fallback: ask for plain narrative if JSON failed
    const fallbackResponse = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `${SYSTEM_INSTRUCTION}

Write a biographical narrative paragraph (third person past tense, 100-500 words) based on this interview transcript. Write ONLY the narrative — no JSON, no titles, just the prose:

"""
${transcript}
"""`,
    });

    const fallbackText = fallbackResponse?.text?.trim() || "";
    if (fallbackText.length > 20) {
      // Derive a simple title from the first sentence
      const firstSentence = fallbackText.split(/[.!?]/)[0].trim();
      const shortTitle = firstSentence.length > 60
        ? firstSentence.substring(0, 57) + "..."
        : firstSentence;
      return NextResponse.json({ title: shortTitle || "A Memory from Blair", summary: fallbackText });
    }

    // Last resort — return error so the caller can use raw transcript
    return NextResponse.json({ error: "Could not generate narrative" }, { status: 500 });

  } catch (err) {
    console.error("Summarize error:", err);
    return NextResponse.json({ error: "Failed to summarize" }, { status: 500 });
  }
}
