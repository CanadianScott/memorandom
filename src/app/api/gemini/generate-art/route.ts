import { NextRequest, NextResponse } from "next/server";
import { generateArtwork } from "../../../../lib/gemini/art";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await generateArtwork(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Generate art route error:", error);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#fcf9f2"/>
      <text x="400" y="300" font-family="Georgia, serif" font-size="24" fill="#6d533f" text-anchor="middle">Memoir Illustration</text>
    </svg>`;
    const base64 = Buffer.from(svg).toString("base64");
    return NextResponse.json({
      imageBase64: base64,
      mimeType: "image/svg+xml",
      imageUrl: `data:image/svg+xml;base64,${base64}`,
      model: "Fallback Keepsake",
    });
  }
}
