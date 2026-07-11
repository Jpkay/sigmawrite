-- Sprint 7: item-generation run observability and reviewer workflow.

create table if not exists public.generation_runs (
  id uuid primary key default gen_random_uuid(),
  slice_key text not null,
  provider text not null,
  model_id text not null,
  prompt_version text,
  requested_count integer not null default 0 check (requested_count >= 0),
  generated_count integer not null default 0 check (generated_count >= 0),
  yield_report jsonb not null default '{}'::jsonb,
  estimated_cost_usd numeric(12,6),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null
);
alter table public.generation_runs enable row level security;
create policy generation_runs_staff on public.generation_runs
  for all using (public.is_staff()) with check (public.is_staff());

alter table public.competency_items
  add column if not exists generation_run_id uuid references public.generation_runs(id) on delete set null,
  add column if not exists reviewer_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists review_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists psychometric_flags jsonb not null default '[]'::jsonb;

create index if not exists competency_items_review_queue_idx
  on public.competency_items (review_status, updated_at desc);
create index if not exists generation_runs_started_idx
  on public.generation_runs (started_at desc);
