import { getGemini } from "./client";

export interface NarrativeResult {
  title: string;
  summary: string;
}

export const BIOGRAPHY_SYSTEM_INSTRUCTION = `You are a master oral history biographer and memoir ghostwriter — combining the narrative warmth of David McCullough with the intimacy of StoryCorps.

You are writing the official life story and memoir for Blair Goates (born late 1950s in Blackfoot, Idaho; built his life in Lethbridge, Alberta with his wife Robin; accountant, pilot, hiker, skier, father of Melissa, Scott, and Jessica).

CORE MANDATE:
Transform raw, spoken, conversational interview transcripts into polished, third-person biographical narrative prose.

STRICT WRITING RULES:
1. THIRD-PERSON PAST TENSE ONLY:
   Write strictly in third-person past tense ("Blair recalled...", "He remembered...", "It was during the summer of 1965 when...", "Growing up in Blackfoot...").
   NEVER use first-person ("I", "me", "my", "we", "our").
2. PARAPHRASE CONVERSATION INTO LITERARY PROSE:
   NEVER reproduce the narrator's transcript verbatim or near-verbatim. Paraphrase spoken dialogue and answers into cohesive, evocative literary paragraphs.
3. STRIP ALL SPOKEN FILLER AND FALSE STARTS:
   Completely remove verbal fillers like "um", "uh", "you know", "like", "so what am I supposed to say", "I guess", "well anyway".
4. PRESERVE EVERY MEANINGFUL DETAIL:
   Retain all specific names (people, family), places (towns, landmarks, lakes), dates, eras, sensory details (sounds, weather, light), and emotional resonance.
5. NO REPETITIVE ATTRIBUTIONS:
   Do not start every sentence with "Blair said" or "He noted". Weave descriptions naturally as historical narrative.
6. EVOCATIVE TITLE:
   Craft a specific, evocative title (4-8 words) capturing the essence of the memory. Never generic like "Interview Segment" or "Story Session".
7. PROSE DEPTH:
   Let the depth of the narrative match the richness of the memory (from 1 cohesive paragraph for short exchanges up to 300-500 words for deep stories).`;

/**
 * Deterministic rule-based biographical synthesis fallback.
 * Ensures that even when offline, with rate limits, or without API keys,
 * the narrator's speech is NEVER dumped as raw transcript on the front page.
 */
export function synthesizeBiographicalFallback(
  transcript: string,
  topic?: string
): NarrativeResult {
  if (!transcript || transcript.trim().length === 0) {
    return {
      title: topic && !topic.toLowerCase().includes("session") ? topic : "A Memory from Blair",
      summary: "",
    };
  }

  // 1. Strip oral fillers, conversational preambles, and repetitions
  let cleaned = transcript
    .replace(/\b(so what am i supposed to say|what was i saying|you know what i mean)\b/gi, "")
    .replace(/\b(um|uh|you know|so yeah|well|honestly|basically|i mean|i guess|err|ah|like)\b/gi, "")
    .replace(/\b(\w+)\s+\1\b/gi, "$1") // double words like "we we"
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/([.,])\s*([.,])+/g, "$1")
    .replace(/^[,.\s]+/, "")
    .trim();

  // 2. Identify years or decades if present
  const yearMatch = cleaned.match(/\b(19\d{2}|20\d{2})s?\b/);
  const mentionedYear = yearMatch ? yearMatch[0] : null;

  // 3. Transform first-person perspectives to third-person past tense biography
  let narrative = cleaned
    .replace(/^I remember\b/i, "Blair remembered")
    .replace(/^I recall\b/i, "Blair recalled")
    .replace(/\bI remember\b/gi, "he remembered")
    .replace(/\bI recall\b/gi, "he recalled")
    .replace(/\bI think\b/gi, "he reflected that")
    .replace(/\bI was\b/gi, "he was")
    .replace(/\bI had\b/gi, "he had")
    .replace(/\bI have\b/gi, "he had")
    .replace(/\bI did\b/gi, "he did")
    .replace(/\bI went\b/gi, "he went")
    .replace(/\bI worked\b/gi, "he worked")
    .replace(/\bI loved\b/gi, "he cherished")
    .replace(/\bI liked\b/gi, "he enjoyed")
    .replace(/\bI saw\b/gi, "he saw")
    .replace(/\bI heard\b/gi, "he heard")
    .replace(/\bI bought\b/gi, "he bought")
    .replace(/\bI lived\b/gi, "he lived")
    .replace(/\bI grew up\b/gi, "he grew up")
    .replace(/\bI wanted\b/gi, "he hoped")
    .replace(/\bI felt\b/gi, "he felt")
    .replace(/\bI knew\b/gi, "he knew")
    .replace(/\bI always\b/gi, "he always")
    .replace(/\bI would\b/gi, "he would")
    .replace(/\bI could\b/gi, "he could")
    .replace(/\bI'd\b/gi, "he would")
    .replace(/\bI've\b/gi, "he had")
    .replace(/\bI'm\b/gi, "he was")
    .replace(/\bI\b/g, "he")
    .replace(/\bmy dad\b/gi, "his father")
    .replace(/\bmy father\b/gi, "his father")
    .replace(/\bmy mom\b/gi, "his mother")
    .replace(/\bmy mother\b/gi, "his mother")
    .replace(/\bmy parents\b/gi, "his parents")
    .replace(/\bmy wife\s+Robin\b/gi, "his wife Robin")
    .replace(/\bmy wife\b/gi, "his wife Robin")
    .replace(/\bmy kids\b/gi, "his children")
    .replace(/\bmy children\b/gi, "his children")
    .replace(/\bmy son\b/gi, "his son Scott")
    .replace(/\bmy daughter\b/gi, "his daughter")
    .replace(/\bmy brother\b/gi, "his brother")
    .replace(/\bmy sister\b/gi, "his sister")
    .replace(/\bmy family\b/gi, "his family")
    .replace(/\bmy\b/gi, "his")
    .replace(/\bme\b/gi, "him")
    .replace(/\bmyself\b/gi, "himself")
    .replace(/\bwe had\b/gi, "the family had")
    .replace(/\bwe were\b/gi, "they were")
    .replace(/\bwe went\b/gi, "they traveled")
    .replace(/\bwe drove\b/gi, "they drove")
    .replace(/\bwe flew\b/gi, "they flew")
    .replace(/\bwe\b/gi, "they")
    .replace(/\bus\b/gi, "them")
    .replace(/\bour\b/gi, "their")
    .replace(/\bourselves\b/gi, "themselves");

  // Fix capitalization at start of sentences
  narrative = narrative.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());

  // Ground with narrator's name if not mentioned
  if (!narrative.includes("Blair")) {
    narrative = `Blair recalled that ${narrative.charAt(0).toLowerCase()}${narrative.slice(1)}`;
  }

  // Ensure trailing punctuation
  if (!/[.!?]$/.test(narrative)) {
    narrative += ".";
  }

  // Derive an evocative title
  let derivedTitle = "A Life Story Memory";
  if (
    topic &&
    !topic.toLowerCase().includes("session") &&
    !topic.toLowerCase().includes("segment") &&
    !topic.toLowerCase().includes("interview") &&
    !topic.toLowerCase().includes("untitled")
  ) {
    derivedTitle = topic.length > 50 ? topic.slice(0, 47) + "..." : topic;
  } else if (mentionedYear) {
    derivedTitle = `Memories from ${mentionedYear}`;
  } else {
    const firstWords = narrative.replace(/^Blair (recalled that|remembered that|reflected that)\s*/i, "").split(/\s+/).slice(0, 6).join(" ");
    if (firstWords.length > 10) {
      derivedTitle = firstWords.charAt(0).toUpperCase() + firstWords.slice(1);
    }
  }

  return { title: derivedTitle, summary: narrative };
}

/**
 * Transforms raw spoken transcripts into a polished biographical title and narrative.
 * Primary: Google Gemini Interactions API (gemini-3.8-flash) with structured JSON output.
 * Secondary: Gemini generateContent fallback.
 * Tertiary: Rule-based biographical synthesis fallback.
 */
export async function generateBiographicalNarrative(
  transcript: string,
  topic?: string
): Promise<NarrativeResult> {
  if (!transcript || transcript.trim().length === 0) {
    return {
      title: topic || "Life Story Memory",
      summary: "",
    };
  }

  const isKeyAvailable =
    Boolean(process.env.GEMINI_API_KEY) &&
    process.env.GEMINI_API_KEY !== "placeholder-key" &&
    process.env.GEMINI_API_KEY !== "your_gemini_api_key_here";

  if (isKeyAvailable) {
    // 1. Try Gemini Interactions API with gemini-3.8-flash
    try {
      const gemini = getGemini();
      const interaction = await gemini.interactions.create({
        model: "gemini-3.8-flash",
        system_instruction: BIOGRAPHY_SYSTEM_INSTRUCTION,
        input: `Oral History Transcript to Transform:\n"""\n${transcript}\n"""\n\nContext / Topic:\n${topic || "Life Story Memory"}\n\nProduce an evocative 4-8 word title and polished third-person biographical narrative.`,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: {
            type: "object",
            properties: {
              title: { type: "string", description: "Evocative 4-8 word biographical title" },
              summary: { type: "string", description: "Polished third-person past-tense biographical narrative" },
            },
            required: ["title", "summary"],
          },
        },
      });

      const rawText = interaction?.output_text?.trim();
      if (rawText) {
        const cleaned = rawText
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.summary && typeof parsed.summary === "string" && parsed.summary.trim().length > 15) {
          return {
            title: parsed.title?.trim() || topic || "A Memory from Blair",
            summary: parsed.summary.trim(),
          };
        }
      }
    } catch (interactionsErr) {
      console.warn("Gemini Interactions API summarize failed, trying generateContent fallback:", interactionsErr);
    }

    // 2. Try generateContent with structured prompt
    try {
      const gemini = getGemini();
      const prompt = `${BIOGRAPHY_SYSTEM_INSTRUCTION}

Transform this raw spoken oral history transcript into:
1. An EVOCATIVE TITLE (4-8 words, specific and vivid).
2. A POLISHED BIOGRAPHICAL NARRATIVE in third-person past tense (100-400 words).

Context / Topic: ${topic || "Life Story"}
Raw spoken transcript:
"""
${transcript}
"""

Respond ONLY with valid JSON in this exact structure:
{"title": "...", "summary": "..."}`;

      const response = await gemini.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      const raw = response?.text?.trim() || "";
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.summary && typeof parsed.summary === "string" && parsed.summary.trim().length > 15) {
        return {
          title: parsed.title?.trim() || topic || "A Memory from Blair",
          summary: parsed.summary.trim(),
        };
      }
    } catch (genErr) {
      console.warn("Gemini generateContent fallback failed:", genErr);
    }
  }

  // 3. Deterministic rule-based biographical synthesis fallback
  return synthesizeBiographicalFallback(transcript, topic);
}

/**
 * Backward compatible wrapper returning the summary text.
 */
export async function summarizeTranscript(transcript: string): Promise<string> {
  const result = await generateBiographicalNarrative(transcript);
  return result.summary;
}
