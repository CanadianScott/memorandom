insert into storage.buckets (id, name, public)
values
  ('uploads', 'uploads', true),
  ('generated', 'generated', true),
  ('enrichment', 'enrichment', true)
on conflict (id) do nothing;

drop policy if exists "Allow public read on uploads" on storage.objects;
create policy "Allow public read on uploads" on storage.objects for select using (bucket_id in ('uploads', 'generated', 'enrichment'));

drop policy if exists "Allow insert on uploads" on storage.objects;
create policy "Allow insert on uploads" on storage.objects for insert with check (bucket_id in ('uploads', 'generated', 'enrichment'));
