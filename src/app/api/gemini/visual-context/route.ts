import { NextRequest, NextResponse } from "next/server";
import { generateVisualQueries } from "../../../../lib/gemini/visual-context";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const transcript = body.transcript || "";
    const result = await generateVisualQueries(transcript);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Visual context route error:", error);
    return NextResponse.json({
      searchQueries: ["vintage 1950s family photograph"],
      mapQueries: [{ name: "Chicago", query: "Chicago, Illinois" }],
    });
  }
}
