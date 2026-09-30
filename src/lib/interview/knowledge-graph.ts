import { getEntities, upsertEntity } from "../supabase/client";
import { ExtractedEntity } from "@/types/entities";
import { Entity, SessionMode, EntityType } from "@/types/database";

export async function upsertExtractedEntities(entities: ExtractedEntity[]): Promise<Entity[]> {
  const results: Entity[] = [];
  for (const entity of entities) {
    const dbEntity = await upsertEntity({
      name: entity.name,
      type: entity.type as EntityType,
      metadata: (entity.metadata as Record<string, any>) || {},
      mention_count: 1,
    });
    results.push(dbEntity);
  }
  return results;
}

export async function getGraphSummary(): Promise<string> {
  const entities = await getEntities();
  if (!entities || entities.length === 0) return "No known entities yet.";
  
  const people = entities.filter(e => e.type === 'person').map(e => e.name).join(", ");
  const places = entities.filter(e => e.type === 'place').map(e => e.name).join(", ");
  const eras = entities.filter(e => e.type === 'era').map(e => e.name).join(", ");
  const events = entities.filter(e => e.type === 'event').map(e => e.name).join(", ");
  
  let summary = "";
  if (people) summary += `Known people: ${people}. `;
  if (places) summary += `Known places: ${places}. `;
  if (eras) summary += `Known eras: ${eras}. `;
  if (events) summary += `Known events: ${events}. `;
  
  return summary.trim();
}

export async function getEntitySuggestions(mode: SessionMode): Promise<{ topic: string, prompt: string }[]> {
  const entities = await getEntities();
  if (mode === "explore_era") {
    return [{ topic: "Childhood", prompt: "Tell me about your childhood." }];
  }
  if (entities.length > 0) {
    return [{ topic: entities[0].name, prompt: `Tell me more about ${entities[0].name}.` }];
  }
  return [{ topic: "Life", prompt: "Tell me a story about your life." }];
}

export async function getBiographicalProfile(): Promise<{
  eras: string[];
  places: string[];
  estimatedBirthDecade?: string;
  estimatedBirthYear?: number;
}> {
  const entities = await getEntities();
  const eras = entities.filter((e) => e.type === "era").map((e) => e.name);
  const places = entities.filter((e) => e.type === "place").map((e) => e.name);

  // Derive birth year/decade from known era entities
  let birthYear = 1945;
  let birthDecade = "1940s";

  if (eras.length > 0) {
    for (const era of eras) {
      const lower = era.toLowerCase();
      const decMatch = lower.match(/(19\d)0s?/i);
      if (decMatch) {
        const decBase = parseInt(decMatch[1] + "0", 10);
        if (/childhood|youth|growing\s*up|kid|young/.test(lower)) {
          birthYear = decBase - 5;
          birthDecade = `${Math.floor(birthYear / 10) * 10}s`;
          break;
        } else {
          birthYear = decBase - 5;
          birthDecade = `${Math.floor(birthYear / 10) * 10}s`;
        }
      }
    }
  }

  return {
    eras,
    places,
    estimatedBirthDecade: birthDecade,
    estimatedBirthYear: birthYear,
  };
}

