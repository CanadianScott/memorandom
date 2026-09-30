import { NextRequest, NextResponse } from "next/server";
import { getHistoricalContext } from "@/lib/gemini/historical-context";
import { HistoricalContextRequest, HistoricalContextResponse } from "@/types/historical-context";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<HistoricalContextRequest>;
    const request: HistoricalContextRequest = {
      eras: Array.isArray(body.eras) ? body.eras : [],
      locations: Array.isArray(body.locations) ? body.locations : [],
      birthDecade: typeof body.birthDecade === "string" ? body.birthDecade : undefined,
      birthYear: typeof body.birthYear === "number" ? body.birthYear : undefined,
      limit: typeof body.limit === "number" ? body.limit : 4,
      excludeEventNames: Array.isArray(body.excludeEventNames) ? body.excludeEventNames : [],
    };

    const result = await getHistoricalContext(request);
    return NextResponse.json<HistoricalContextResponse>(result);
  } catch (error) {
    console.error("Historical context route error:", error);
    // Graceful fallback to default elder profile
    const fallbackResult = await getHistoricalContext({
      birthYear: 1945,
      eras: ["1950s Childhood"],
      locations: ["Chicago, Illinois"],
      limit: 3,
    });
    return NextResponse.json<HistoricalContextResponse>(fallbackResult, { status: 200 });
  }
}
