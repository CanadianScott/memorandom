export interface HistoricalContextRequest {
  eras?: string[];
  locations?: string[];
  birthDecade?: string;
  birthYear?: number;
  limit?: number;
  excludeEventNames?: string[];
}

export interface HistoricalPromptItem {
  id: string;
  question: string;
  historicalEvent: string;
  yearOrEra: string;
  location: string;
  scope: "local" | "national";
  sourceType: "gemini_knowledge" | "web_search" | "fallback_matrix";
  sourceDetails?: string;
  followUps: string[];
  visualQuery: string;
  mapQuery: string;
  artPrompt: string;
}

export interface HistoricalContextResponse {
  prompts: HistoricalPromptItem[];
  metadata: {
    inferredBirthYear?: number;
    erasCovered: string[];
    locationsCovered: string[];
  };
}

export interface BiographicalProfile {
  eras: string[];
  places: string[];
  estimatedBirthDecade?: string;
  estimatedBirthYear?: number;
}
