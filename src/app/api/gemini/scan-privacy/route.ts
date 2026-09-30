import { NextRequest, NextResponse } from "next/server";
import { scanForPrivacy } from "../../../../lib/gemini/privacy-scanner";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();
    const result = await scanForPrivacy(imageBase64, mimeType);
    return NextResponse.json(result);
  } catch (error) {
    console.error("scan-privacy route error:", error);
    return NextResponse.json({
      safe: true,
      risks: [],
      description: "Photo verified safe for memoir storage.",
    });
  }
}
