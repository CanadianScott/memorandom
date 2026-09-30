-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- sessions: interview session metadata
create table sessions (
  id uuid primary key default uuid_generate_v4(),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  mode text not null check (mode in ('continue_thread', 'explore_era', 'surprise_me')),
  prompt_used text,
  gemini_interaction_id text,
  created_at timestamptz not null default now()
);

-- entities: polymorphic entity table for people, places, eras, events
create table entities (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('person', 'place', 'era', 'event')),
  name text not null,
  metadata jsonb not null default '{}',
  first_mentioned_at timestamptz not null default now(),
  mention_count int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(name, type)
);

-- entity_relations: directed edges between entities
create table entity_relations (
  id uuid primary key default uuid_generate_v4(),
  source_entity_id uuid not null references entities(id) on delete cascade,
  target_entity_id uuid not null references entities(id) on delete cascade,
  relation_type text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(source_entity_id, target_entity_id, relation_type)
);

-- stories: transcribed story sessions
create table stories (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete set null,
  title text,
  transcript text not null,
  summary text,
  era_tags text[] not null default '{}',
  gemini_interaction_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- story_entities: junction linking stories to extracted entities
create table story_entities (
  story_id uuid not null references stories(id) on delete cascade,
  entity_id uuid not null references entities(id) on delete cascade,
  confidence real not null default 1.0,
  primary key (story_id, entity_id)
);

-- media: uploaded photos, generated illustrations, web-fetched images
create table media (
  id uuid primary key default uuid_generate_v4(),
  source text not null check (source in ('upload', 'generated', 'wikimedia', 'unsplash')),
  storage_path text not null,
  url text,
  mime_type text not null default 'image/jpeg',
  filename text,
  width int,
  height int,
  attribution text,
  alt_text text,
  caption text,
  art_style text check (art_style in ('kodachrome', 'watercolor', 'oil_painting', 'storybook') or art_style is null),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- story_media: junction linking media to stories with display order
create table story_media (
  story_id uuid not null references stories(id) on delete cascade,
  media_id uuid not null references media(id) on delete cascade,
  display_order int not null default 0,
  primary key (story_id, media_id)
);

-- chapters: memoir chapter definitions
create table chapters (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  summary text,
  cover_media_id uuid references media(id) on delete set null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- chapter_stories: junction linking stories into chapters
create table chapter_stories (
  chapter_id uuid not null references chapters(id) on delete cascade,
  story_id uuid not null references stories(id) on delete cascade,
  display_order int not null default 0,
  primary key (chapter_id, story_id)
);

-- Indexes
create index if not exists idx_entities_type on entities(type);
create index if not exists idx_entities_name on entities(name);
create index if not exists idx_stories_session on stories(session_id);
create index if not exists idx_story_entities_entity on story_entities(entity_id);
create index if not exists idx_story_media_media on story_media(media_id);
create index if not exists idx_chapters_order on chapters(display_order);
create index if not exists idx_chapter_stories_story on chapter_stories(story_id);
create index if not exists idx_entity_relations_source on entity_relations(source_entity_id);
create index if not exists idx_entity_relations_target on entity_relations(target_entity_id);

-- Row Level Security (single-user for now, all access allowed)
alter table sessions enable row level security;
alter table entities enable row level security;
alter table entity_relations enable row level security;
alter table stories enable row level security;
alter table story_entities enable row level security;
alter table media enable row level security;
alter table story_media enable row level security;
alter table chapters enable row level security;
alter table chapter_stories enable row level security;

-- Permissive policies (single user app)
create policy "Allow all on sessions" on sessions for all using (true) with check (true);
create policy "Allow all on entities" on entities for all using (true) with check (true);
create policy "Allow all on entity_relations" on entity_relations for all using (true) with check (true);
create policy "Allow all on stories" on stories for all using (true) with check (true);
create policy "Allow all on story_entities" on story_entities for all using (true) with check (true);
create policy "Allow all on media" on media for all using (true) with check (true);
create policy "Allow all on story_media" on story_media for all using (true) with check (true);
create policy "Allow all on chapters" on chapters for all using (true) with check (true);
create policy "Allow all on chapter_stories" on chapter_stories for all using (true) with check (true);
