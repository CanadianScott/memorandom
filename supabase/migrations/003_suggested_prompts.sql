-- suggested_prompts: family and visitor prompt suggestions for Dad
create table if not exists suggested_prompts (
  id uuid primary key default uuid_generate_v4(),
  prompt text not null,
  suggested_by text not null default 'Family Member',
  category text,
  status text not null default 'pending' check (status in ('pending', 'used')),
  created_at timestamptz not null default now()
);

create index if not exists idx_suggested_prompts_created_at on suggested_prompts(created_at desc);

-- Row Level Security
alter table suggested_prompts enable row level security;
create policy "Allow all on suggested_prompts" on suggested_prompts for all using (true) with check (true);
