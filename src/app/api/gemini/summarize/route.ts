import { NextRequest, NextResponse } from "next/server";
import { summarizeTranscript } from "@/lib/gemini/summarize";

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "transcript is required" }, { status: 400 });
    }
    const summary = await summarizeTranscript(transcript);
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("Summarize error:", err);
    return NextResponse.json({ error: "Failed to summarize" }, { status: 500 });
  }
}
