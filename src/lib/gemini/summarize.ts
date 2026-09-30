import { getGemini } from "./client";

export async function summarizeTranscript(transcript: string): Promise<string> {
  const gemini = getGemini();

  const response = await gemini.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `You are a skilled memoir ghostwriter. Transform the following raw interview response into a short, cohesive narrative paragraph (2-4 sentences). Write in third person past tense, as if for a published biography. Capture the emotional core and key details. Do NOT quote the speaker directly — paraphrase into elegant prose.

Raw interview response:
"${transcript}"

Write ONLY the narrative paragraph, nothing else.`,
  });

  const text = response?.text?.trim();
  if (!text || text.length < 10) {
    return transcript.length > 200 ? transcript.slice(0, 200) + "…" : transcript;
  }
  return text;
}
