export interface InterviewQuestion {
  question: string;
  followUps: string[];
  topic: string;
  relatedEntityNames: string[];
}

export interface InterviewResponse {
  question: InterviewQuestion;
  detectedEntities: import('./entities').ExtractedEntity[];
  visualQuery?: string;
  artPrompt?: string;
  mapQuery?: string;
}

export interface PrivacyScanResult {
  safe: boolean;
  risks: string[];
  description: string;
}

export type ArtStyle = 'kodachrome' | 'watercolor' | 'oil_painting' | 'storybook';

export interface ArtGenerationRequest {
  storySummary: string;
  style: ArtStyle;
  additionalContext?: string;
}
