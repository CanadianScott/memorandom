import { NextRequest, NextResponse } from "next/server";
import { extractEntities } from "../../../../lib/gemini/entities";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const transcript = body.transcript || "";
    const result = await extractEntities(transcript);
    return NextResponse.json(result);
  } catch (error) {
    console.error("extractEntities route error:", error);
    return NextResponse.json({
      entities: [],
      visualQueries: ["vintage family photograph"],
      mapLocations: [],
    });
  }
}
