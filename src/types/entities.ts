export type EntityType = 'person' | 'place' | 'era' | 'event';

export interface ExtractedEntity {
  name: string;
  type: EntityType;
  confidence: number;
  metadata: Record<string, unknown>;
  relationships?: { targetName: string; relationType: string }[];
}

export interface EntityExtractionResult {
  entities: ExtractedEntity[];
  visualQueries: string[];
  mapLocations: { name: string; query: string }[];
}
