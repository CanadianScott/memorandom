import { NextRequest, NextResponse } from "next/server";
import { getStories, createStory, deleteStory } from "@/lib/supabase/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "blair";
    const stories = await getStories(undefined, userId);
    return NextResponse.json({ stories });
  } catch (err) {
    console.error("GET /api/stories error:", err);
    return NextResponse.json({ error: "Failed to fetch stories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const transcript = body?.transcript?.trim();
    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    const userId = body?.userId || "blair";
    let summary = body?.summary?.trim() || null;
    let title = body?.title?.trim() || "Life Story Memory";

    if (!summary || summary.length < 10 || summary === transcript) {
      const { generateBiographicalNarrative, synthesizeBiographicalFallback } = await import("@/lib/gemini/summarize");
      try {
        const narrativeResult = await generateBiographicalNarrative(transcript, title);
        summary = narrativeResult.summary;
        if (narrativeResult.title && (!body?.title || body?.title === "Untitled Story")) {
          title = narrativeResult.title;
        }
      } catch {
        const fallback = synthesizeBiographicalFallback(transcript, title);
        summary = fallback.summary;
        if (!body?.title || body?.title === "Untitled Story") {
          title = fallback.title;
        }
      }
    }

    const story = await createStory({
      title,
      transcript,
      summary,
      era_tags: body?.era_tags || [],
      session_id: body?.session_id || null,
    }, userId);

    return NextResponse.json({ story }, { status: 201 });
  } catch (err) {
    console.error("POST /api/stories error:", err);
    return NextResponse.json({ error: "Failed to create story" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");
    let userId = searchParams.get("userId") || "blair";

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
        if (body?.userId) userId = body.userId;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Story id is required" }, { status: 400 });
    }

    const success = await deleteStory(id, userId);
    return NextResponse.json({ success });
  } catch (err) {
    console.error("DELETE /api/stories error:", err);
    return NextResponse.json({ error: "Failed to delete story" }, { status: 500 });
  }
}
