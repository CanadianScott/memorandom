import { NextRequest, NextResponse } from "next/server";
import { getStories, createStory, deleteStory } from "@/lib/supabase/client";

export async function GET() {
  try {
    const stories = await getStories();
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

    const story = await createStory({
      title: body?.title?.trim() || "Untitled Story",
      transcript,
      summary: body?.summary?.trim() || null,
      era_tags: body?.era_tags || [],
      session_id: body?.session_id || null,
    });

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

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Story id is required" }, { status: 400 });
    }

    const success = await deleteStory(id);
    return NextResponse.json({ success });
  } catch (err) {
    console.error("DELETE /api/stories error:", err);
    return NextResponse.json({ error: "Failed to delete story" }, { status: 500 });
  }
}
