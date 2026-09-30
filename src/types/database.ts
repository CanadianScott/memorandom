export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type EntityType = 'person' | 'place' | 'era' | 'event';
export type MediaSource = 'upload' | 'generated' | 'wikimedia' | 'unsplash';
export type ArtStyle = 'kodachrome' | 'watercolor' | 'oil_painting' | 'storybook';
export type SessionMode = 'continue_thread' | 'explore_era' | 'surprise_me';

export type PersonMetadata = {
  relationship?: string;
  birth_year?: number;
  [key: string]: Json | undefined;
};

export type PlaceMetadata = {
  lat?: number;
  lng?: number;
  country?: string;
  city?: string;
  [key: string]: Json | undefined;
};

export type EraMetadata = {
  start_year?: number;
  end_year?: number;
  label?: string;
  [key: string]: Json | undefined;
};

export type EventMetadata = {
  date?: string;
  location?: string;
  [key: string]: Json | undefined;
};

export type EntityMetadata =
  | PersonMetadata
  | PlaceMetadata
  | EraMetadata
  | EventMetadata
  | Record<string, Json | undefined>;

export type Session = {
  id: string;
  started_at: string;
  ended_at: string | null;
  mode: SessionMode;
  prompt_used: string | null;
  gemini_interaction_id: string | null;
  created_at: string;
};

export type SessionInsert = {
  id?: string;
  started_at?: string;
  ended_at?: string | null;
  mode: SessionMode;
  prompt_used?: string | null;
  gemini_interaction_id?: string | null;
  created_at?: string;
};

export type SessionUpdate = {
  id?: string;
  started_at?: string;
  ended_at?: string | null;
  mode?: SessionMode;
  prompt_used?: string | null;
  gemini_interaction_id?: string | null;
  created_at?: string;
};

export type Entity = {
  id: string;
  type: EntityType;
  name: string;
  metadata: Record<string, Json>;
  first_mentioned_at: string;
  mention_count: number;
  created_at: string;
  updated_at: string;
};

export type EntityInsert = {
  id?: string;
  type: EntityType;
  name: string;
  metadata?: Record<string, Json>;
  first_mentioned_at?: string;
  mention_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type EntityUpdate = {
  id?: string;
  type?: EntityType;
  name?: string;
  metadata?: Record<string, Json>;
  first_mentioned_at?: string;
  mention_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type EntityRelation = {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relation_type: string;
  metadata: Record<string, Json>;
  created_at: string;
};

export type EntityRelationInsert = {
  id?: string;
  source_entity_id: string;
  target_entity_id: string;
  relation_type: string;
  metadata?: Record<string, Json>;
  created_at?: string;
};

export type EntityRelationUpdate = {
  id?: string;
  source_entity_id?: string;
  target_entity_id?: string;
  relation_type?: string;
  metadata?: Record<string, Json>;
  created_at?: string;
};

export type Story = {
  id: string;
  session_id: string | null;
  title: string | null;
  transcript: string;
  summary: string | null;
  era_tags: string[];
  gemini_interaction_id: string | null;
  created_at: string;
  updated_at: string;
};

export type StoryInsert = {
  id?: string;
  session_id?: string | null;
  title?: string | null;
  transcript: string;
  summary?: string | null;
  era_tags?: string[];
  gemini_interaction_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type StoryUpdate = {
  id?: string;
  session_id?: string | null;
  title?: string | null;
  transcript?: string;
  summary?: string | null;
  era_tags?: string[];
  gemini_interaction_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type StoryEntity = {
  story_id: string;
  entity_id: string;
  confidence: number;
};

export type StoryEntityInsert = {
  story_id: string;
  entity_id: string;
  confidence?: number;
};

export type StoryEntityUpdate = {
  story_id?: string;
  entity_id?: string;
  confidence?: number;
};

export type Media = {
  id: string;
  source: MediaSource;
  storage_path: string;
  url: string;
  mime_type: string;
  filename: string | null;
  width: number | null;
  height: number | null;
  attribution: string | null;
  alt_text: string | null;
  caption: string | null;
  art_style: ArtStyle | null;
  metadata: Record<string, Json>;
  created_at: string;
};

export type MediaInsert = {
  id?: string;
  source: MediaSource;
  storage_path: string;
  url?: string;
  mime_type?: string;
  filename?: string | null;
  width?: number | null;
  height?: number | null;
  attribution?: string | null;
  alt_text?: string | null;
  caption?: string | null;
  art_style?: ArtStyle | null;
  metadata?: Record<string, Json>;
  created_at?: string;
};

export type MediaUpdate = {
  id?: string;
  source?: MediaSource;
  storage_path?: string;
  url?: string;
  mime_type?: string;
  filename?: string | null;
  width?: number | null;
  height?: number | null;
  attribution?: string | null;
  alt_text?: string | null;
  caption?: string | null;
  art_style?: ArtStyle | null;
  metadata?: Record<string, Json>;
  created_at?: string;
};

export type StoryMedia = {
  story_id: string;
  media_id: string;
  display_order: number;
};

export type StoryMediaInsert = {
  story_id: string;
  media_id: string;
  display_order?: number;
};

export type StoryMediaUpdate = {
  story_id?: string;
  media_id?: string;
  display_order?: number;
};

export type Chapter = {
  id: string;
  title: string;
  summary: string | null;
  cover_media_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ChapterInsert = {
  id?: string;
  title: string;
  summary?: string | null;
  cover_media_id?: string | null;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
};

export type ChapterUpdate = {
  id?: string;
  title?: string;
  summary?: string | null;
  cover_media_id?: string | null;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
};

export type ChapterStory = {
  chapter_id: string;
  story_id: string;
  display_order: number;
};

export type ChapterStoryInsert = {
  chapter_id: string;
  story_id: string;
  display_order?: number;
};

export type ChapterStoryUpdate = {
  chapter_id?: string;
  story_id?: string;
  display_order?: number;
};

export type MediaItem = Media;
export type BiographicalEntity = Entity;

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: Session;
        Insert: SessionInsert;
        Update: SessionUpdate;
        Relationships: [];
      };
      entities: {
        Row: Entity;
        Insert: EntityInsert;
        Update: EntityUpdate;
        Relationships: [];
      };
      entity_relations: {
        Row: EntityRelation;
        Insert: EntityRelationInsert;
        Update: EntityRelationUpdate;
        Relationships: [
          {
            foreignKeyName: "entity_relations_source_entity_id_fkey";
            columns: ["source_entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entity_relations_target_entity_id_fkey";
            columns: ["target_entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
        ];
      };
      stories: {
        Row: Story;
        Insert: StoryInsert;
        Update: StoryUpdate;
        Relationships: [
          {
            foreignKeyName: "stories_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      story_entities: {
        Row: StoryEntity;
        Insert: StoryEntityInsert;
        Update: StoryEntityUpdate;
        Relationships: [
          {
            foreignKeyName: "story_entities_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "story_entities_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
        ];
      };
      media: {
        Row: Media;
        Insert: MediaInsert;
        Update: MediaUpdate;
        Relationships: [];
      };
      story_media: {
        Row: StoryMedia;
        Insert: StoryMediaInsert;
        Update: StoryMediaUpdate;
        Relationships: [
          {
            foreignKeyName: "story_media_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "story_media_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      chapters: {
        Row: Chapter;
        Insert: ChapterInsert;
        Update: ChapterUpdate;
        Relationships: [
          {
            foreignKeyName: "chapters_cover_media_id_fkey";
            columns: ["cover_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      chapter_stories: {
        Row: ChapterStory;
        Insert: ChapterStoryInsert;
        Update: ChapterStoryUpdate;
        Relationships: [
          {
            foreignKeyName: "chapter_stories_chapter_id_fkey";
            columns: ["chapter_id"];
            isOneToOne: false;
            referencedRelation: "chapters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chapter_stories_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      entity_type: EntityType;
      media_source: MediaSource;
      art_style: ArtStyle;
      session_mode: SessionMode;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
