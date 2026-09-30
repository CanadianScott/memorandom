import { client } from './client';
import { EntityExtractionResult, ExtractedEntity } from '../../types/entities';

export async function extractEntities(transcript: string): Promise<EntityExtractionResult> {
  const isKeyAvailable =
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== "placeholder-key" &&
    process.env.GEMINI_API_KEY !== "your_gemini_api_key_here";

  if (isKeyAvailable) {
    try {
      const interaction = await client.interactions.create({
        model: "gemini-3.8-flash",
        system_instruction: "Extract biographical entities (people, places, eras, events) from the transcript in a NER-style extraction. Also suggest visual search queries and map locations.",
        input: transcript,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: {
            type: "object",
            properties: {
              entities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: { type: "string", enum: ["person", "place", "era", "event"] },
                    confidence: { type: "number" },
                    metadata: { type: "object" },
                    relationships: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          targetName: { type: "string" },
                          relationType: { type: "string" }
                        },
                        required: ["targetName", "relationType"]
                      }
                    }
                  },
                  required: ["name", "type", "confidence", "metadata"]
                }
              },
              visualQueries: { type: "array", items: { type: "string" } },
              mapLocations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    query: { type: "string" }
                  },
                  required: ["name", "query"]
                }
              }
            },
            required: ["entities", "visualQueries", "mapLocations"]
          }
        }
      });

      const responseText = interaction.output_text;
      if (responseText) {
        return JSON.parse(responseText) as EntityExtractionResult;
      }
    } catch (err) {
      console.warn("Gemini entity extraction failed, using rule-based extraction:", err);
    }
  }

  // Fallback rule-based extractor
  return extractEntitiesFallback(transcript);
}

function extractEntitiesFallback(transcript: string): EntityExtractionResult {
  const entities: ExtractedEntity[] = [];
  const visualQueries: string[] = [];
  const mapLocations: { name: string; query: string }[] = [];

  if (!transcript || transcript.trim().length === 0) {
    return { entities: [], visualQueries: [], mapLocations: [] };
  }

  const commonPlaces = [
    "Chicago", "New York", "Yellowstone", "California", "Texas", "Florida",
    "Ohio", "Boston", "Detroit", "Paris", "London", "San Francisco", "Grand Canyon"
  ];

  const commonEras = [
    "1950s", "1960s", "1970s", "1980s", "childhood", "college", "high school", "war", "navy"
  ];

  // Match known places
  for (const place of commonPlaces) {
    if (new RegExp(`\\b${place}\\b`, "i").test(transcript)) {
      entities.push({
        name: place,
        type: "place",
        confidence: 0.9,
        metadata: { source: "Biographical mention" }
      });
      mapLocations.push({ name: place, query: place });
      visualQueries.push(`${place} vintage historical photos`);
    }
  }

  // Match known eras
  for (const era of commonEras) {
    if (new RegExp(`\\b${era}\\b`, "i").test(transcript)) {
      entities.push({
        name: era,
        type: "era",
        confidence: 0.85,
        metadata: { source: "Time period tag" }
      });
      visualQueries.push(`${era} vintage lifestyle`);
    }
  }

  // Match capitalized names/words
  const words = transcript.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const raw = words[i].replace(/[^a-zA-Z]/g, "");
    if (
      raw.length > 3 &&
      /^[A-Z][a-z]+$/.test(raw) &&
      !["When", "What", "Where", "Then", "That", "There", "Every", "After", "Before", "Because", "With"].includes(raw) &&
      !entities.some(e => e.name.toLowerCase() === raw.toLowerCase())
    ) {
      entities.push({
        name: raw,
        type: "person",
        confidence: 0.75,
        metadata: { context: "Mentioned individual" }
      });
    }
  }

  if (visualQueries.length === 0) {
    visualQueries.push("vintage family memories 1960s");
  }

  return { entities, visualQueries, mapLocations };
}
