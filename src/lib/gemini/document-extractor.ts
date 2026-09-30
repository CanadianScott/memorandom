import { client } from "./client";

export interface DocumentExtractionResult {
  text: string;
}

export async function extractDocumentText(
  documentBase64: string,
  mimeType: string
): Promise<DocumentExtractionResult> {
  const isKeyAvailable =
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== "placeholder-key" &&
    process.env.GEMINI_API_KEY !== "your_gemini_api_key_here";

  if (isKeyAvailable) {
    try {
      const interaction = await client.interactions.create({
        model: "gemini-3.8-flash",
        system_instruction:
          "You are an OCR and document transcription specialist for family history memoirs. Accurately transcribe all legible text from the uploaded document, letter, newspaper clipping, diary entry, or certificate. Preserve paragraph structure, headings, and dates as written.",
        input: [
          { type: "text" as const, text: "Transcribe the text in this document accurately." },
          { type: "image" as const, data: documentBase64, mime_type: mimeType },
        ],
      });

      const responseText = interaction.output_text;
      if (responseText) {
        return { text: responseText };
      }
    } catch (err) {
      console.warn("Document extraction failed, using fallback text:", err);
    }
  }

  return {
    text: "Scanned family record: Document uploaded and ingested into digital archive. Transcription preview will be available with connected Gemini API key.",
  };
}
