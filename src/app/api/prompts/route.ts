import { NextRequest, NextResponse } from "next/server";
import {
  getSuggestedPrompts,
  createSuggestedPrompt,
  updateSuggestedPrompt,
  deleteSuggestedPrompt,
} from "@/lib/supabase/client";

export async function GET() {
  try {
    const prompts = await getSuggestedPrompts();
    return NextResponse.json({ prompts });
  } catch (err) {
    console.error("GET /api/prompts error:", err);
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body?.prompt?.trim();
    if (!prompt || prompt.length < 3) {
      return NextResponse.json(
        { error: "Prompt is required and must be at least 3 characters" },
        { status: 400 }
      );
    }

    const suggested_by = body?.suggested_by?.trim() || "Family Member";
    const category = body?.category?.trim() || null;

    const newPrompt = await createSuggestedPrompt({
      prompt,
      suggested_by,
      category,
      status: "pending",
    });

    return NextResponse.json({ prompt: newPrompt }, { status: 201 });
  } catch (err) {
    console.error("POST /api/prompts error:", err);
    return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 });
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
      return NextResponse.json({ error: "Prompt id is required" }, { status: 400 });
    }

    const success = await deleteSuggestedPrompt(id);
    return NextResponse.json({ success });
  } catch (err) {
    console.error("DELETE /api/prompts error:", err);
    return NextResponse.json({ error: "Failed to delete prompt" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body?.id;
    if (!id) {
      return NextResponse.json({ error: "Prompt id is required" }, { status: 400 });
    }

    const updated = await updateSuggestedPrompt(id, {
      status: body.status,
      prompt: body.prompt,
      category: body.category,
      suggested_by: body.suggested_by,
    });

    if (!updated) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    return NextResponse.json({ prompt: updated });
  } catch (err) {
    console.error("PATCH /api/prompts error:", err);
    return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 });
  }
}
