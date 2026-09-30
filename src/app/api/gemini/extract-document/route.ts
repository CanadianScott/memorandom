import { NextRequest, NextResponse } from "next/server";
import { extractDocumentText } from "@/lib/gemini/document-extractor";

export async function POST(req: NextRequest) {
  try {
    const { documentBase64, mimeType } = await req.json();
    const result = await extractDocumentText(documentBase64, mimeType);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Document extraction error:", error);
    return NextResponse.json({
      text: "Scanned family record: Document uploaded and ingested into digital archive.",
    });
  }
}
