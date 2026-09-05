-- Programme alignment (roadmap 4.1): every competency node mapped to the
-- cycle 3 / cycle 4 attendus, 6e national-evaluation domains and Brevet
-- skills. Imported from generated/curriculum-mappings-v1.json; readable by
-- everyone signed in, written only by the service role.
create table public.curriculum_mappings (
  id uuid primary key default gen_random_uuid(),
  node_key text not null,
  framework text not null check (framework in ('cycle3','cycle4','eval6e','brevet')),
  code text not null,
  label_fr text not null,
  source text not null,
  release_checksum text not null,
  created_at timestamptz not null default now(),
  unique (node_key, framework, code)
);
create index curriculum_mappings_node_idx on public.curriculum_mappings (node_key);
alter table public.curriculum_mappings enable row level security;
create policy curriculum_mappings_read on public.curriculum_mappings for select using (auth.role() = 'authenticated' or auth.role() = 'service_role');
grant select on public.curriculum_mappings to authenticated;
