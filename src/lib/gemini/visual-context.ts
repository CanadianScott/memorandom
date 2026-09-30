import { client } from './client';

export async function generateVisualQueries(
  transcript: string
): Promise<{ searchQueries: string[]; mapQueries: { name: string; query: string }[] }> {
  const isKeyAvailable =
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== "placeholder-key" &&
    process.env.GEMINI_API_KEY !== "your_gemini_api_key_here";

  if (isKeyAvailable) {
    try {
      const interaction = await client.interactions.create({
        model: "gemini-3.8-flash",
        input: `Extract place names and notable topics from this transcript and return visual context queries for photos and maps.\n\nTranscript: ${transcript}`,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: {
            type: "object",
            properties: {
              searchQueries: { type: "array", items: { type: "string" } },
              mapQueries: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    query: { type: "string" },
                  },
                  required: ["name", "query"],
                },
              },
            },
            required: ["searchQueries", "mapQueries"],
          },
        },
      });

      const responseText = interaction.output_text;
      if (responseText) {
        return JSON.parse(responseText);
      }
    } catch (err) {
      console.warn("Gemini visual queries failed, using fallback:", err);
    }
  }

  // Fallback visual queries
  const commonPlaces = [
    "Yellowstone National Park",
    "Yellowstone",
    "Grand Canyon",
    "Central Park",
    "Chicago",
    "New York",
    "Brooklyn",
    "Paris",
    "London",
    "San Francisco",
    "Los Angeles",
    "Boston",
    "Detroit",
    "Philadelphia",
    "Seattle",
    "California",
    "Florida",
    "Texas",
    "Illinois",
    "Ohio",
    "Michigan",
    "Wyoming",
    "Colorado",
    "Maine",
    "Hawaii",
    "Niagara Falls",
    "Yosemite",
  ];

  const mapQueries: { name: string; query: string }[] = [];
  const detectedPlaces: string[] = [];

  for (const p of commonPlaces) {
    if (new RegExp(`\\b${p}\\b`, "i").test(transcript)) {
      if (!mapQueries.some((m) => m.name.toLowerCase() === p.toLowerCase())) {
        mapQueries.push({ name: p, query: p });
        detectedPlaces.push(p);
      }
    }
  }

  // Prepositional place matches: e.g. "in Paris", "trip to Yellowstone", "near Boston"
  const placeRegex = /\b(?:in|at|to|near|from|visited|visit)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
  let match: RegExpExecArray | null;
  while ((match = placeRegex.exec(transcript)) !== null) {
    const candidate = match[1].trim();
    const skipWords = ["The", "My", "Our", "A", "An", "His", "Her", "Their", "That", "This", "When", "What", "Where", "Then"];
    if (!skipWords.includes(candidate) && !detectedPlaces.some((d) => d.toLowerCase() === candidate.toLowerCase())) {
      mapQueries.push({ name: candidate, query: candidate });
      detectedPlaces.push(candidate);
    }
  }

  // Extract era (decades like 1950s, 1960s, or years like 1955, or words like 50s, 60s)
  let era = "";
  const decadeMatch = transcript.match(/\b(19[2-9]0s?|20[0-2]0s?)\b/i) || transcript.match(/\b('?[2-9]0s)\b/i);
  if (decadeMatch) {
    era = decadeMatch[1];
    if (/^\d{2}s$/i.test(era)) {
      era = `19${era}`;
    }
  } else {
    const yearMatch = transcript.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
      era = yearMatch[1];
    }
  }

  // Detect thematic context (childhood, road trip, school, wedding, baseball, etc.)
  let theme = "";
  if (/\b(?:baseball|sandlot|game|ball)\b/i.test(transcript)) {
    theme = "baseball sandlot";
  } else if (/\b(?:road\s*trip|vacation|drive|car|camping)\b/i.test(transcript)) {
    theme = "road trip travel";
  } else if (/\b(?:school|college|classroom|teacher)\b/i.test(transcript)) {
    theme = "school vintage";
  } else if (/\b(?:wedding|bride|groom|marriage)\b/i.test(transcript)) {
    theme = "wedding vintage";
  } else if (/\b(?:childhood|kids|children|playing|young)\b/i.test(transcript)) {
    theme = "childhood family";
  } else if (/\b(?:diner|restaurant|store|job|work)\b/i.test(transcript)) {
    theme = "workplace storefront";
  }

  const searchQueries: string[] = [];

  if (detectedPlaces.length > 0 && era) {
    searchQueries.push(`${detectedPlaces[0]} ${era} vintage archival photograph`);
    searchQueries.push(`${detectedPlaces[0]} historical ${era} memories`);
  } else if (detectedPlaces.length > 0) {
    searchQueries.push(`${detectedPlaces[0]} vintage photograph archival`);
    searchQueries.push(`${detectedPlaces[0]} historic streetscape landmark`);
  } else if (era && theme) {
    searchQueries.push(`vintage ${era} ${theme} archival photograph`);
    searchQueries.push(`nostalgic ${era} ${theme} memories retro`);
  } else if (era) {
    searchQueries.push(`vintage ${era} family photograph archival`);
    searchQueries.push(`nostalgic ${era} everyday life memories retro`);
  } else if (theme) {
    searchQueries.push(`vintage ${theme} photograph archival`);
    searchQueries.push(`nostalgic ${theme} retro memories`);
  } else {
    searchQueries.push("vintage family photograph archival");
    searchQueries.push("nostalgic everyday life historical memories");
  }

  return {
    searchQueries,
    mapQueries,
  };
}
