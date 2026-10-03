import { NextRequest, NextResponse } from "next/server";
import { getGemini } from "@/lib/gemini/client";

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "transcript is required" }, { status: 400 });
    }

    const gemini = getGemini();
    const response = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are a skilled memoir ghostwriter helping preserve the life story of Blair Goates, a man from Lethbridge, Alberta.

Transform the following raw oral history interview into:
1. A SHORT TITLE (5-8 words, specific and evocative — not generic like "Interview Session")
2. A NARRATIVE in third person past tense, biography-quality prose. Write as much as the material warrants — from a single paragraph for brief sessions up to 500 words for rich, detailed ones. Capture emotional truth, preserve specific names, places, and details. Do NOT quote directly — paraphrase elegantly. Omit filler ("um", "uh", short meaningless answers).

Raw transcript:
"${transcript}"

Respond ONLY in this exact JSON format with no markdown fences:
{"title": "...", "summary": "..."}`,
    });

    const text = response?.text?.trim() || "";
    try {
      const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
      return NextResponse.json({ title: parsed.title || null, summary: parsed.summary || null });
    } catch {
      // Fallback: treat whole response as summary
      const fallback = text.length > 10 ? text : null;
      return NextResponse.json({ title: null, summary: fallback });
    }
  } catch (err) {
    console.error("Summarize error:", err);
    return NextResponse.json({ error: "Failed to summarize" }, { status: 500 });
  }
}
