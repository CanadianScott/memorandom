import { NextRequest, NextResponse } from "next/server";
import { generateBiographicalNarrative, synthesizeBiographicalFallback } from "@/lib/gemini/summarize";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const transcript = typeof body?.transcript === "string" ? body.transcript.trim() : "";
    const topic = typeof body?.topic === "string" ? body.topic.trim() : undefined;

    if (!transcript || transcript.length < 5) {
      return NextResponse.json({ error: "transcript is required" }, { status: 400 });
    }

    const narrative = await generateBiographicalNarrative(transcript, topic);
    return NextResponse.json(narrative);
  } catch (err) {
    console.error("POST /api/gemini/summarize error:", err);
    // Never fail with 500 when we can provide a valid biographical narrative
    return NextResponse.json(
      synthesizeBiographicalFallback("Blair shared a memory from his life.", undefined)
    );
  }
}
