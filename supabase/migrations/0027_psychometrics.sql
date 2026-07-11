-- Sprint 16 / Gate 5: evidence-thresholded content and graph calibration.

create table if not exists public.item_stats (
  item_id uuid primary key references public.competency_items(id) on delete cascade,
  attempts_count integer not null,
  p_value numeric,
  point_biserial numeric,
  flags jsonb not null default '[]'::jsonb,
  calculated_at timestamptz not null default now()
);
create table if not exists public.edge_stats (
  edge_id uuid primary key references public.competency_edges(id) on delete cascade,
  evidence_count integer not null,
  predictive_lift numeric,
  flagged_no_lift boolean not null default false,
  calculated_at timestamptz not null default now()
);
create table if not exists public.misconception_stats (
  misconception_id uuid primary key references public.misconceptions(id) on delete cascade,
  evidence_count integer not null,
  wrong_choice_rate numeric,
  confirmed boolean,
  calculated_at timestamptz not null default now()
);
alter table public.competency_edges add column if not exists psychometric_flags jsonb not null default '[]'::jsonb;
alter table public.item_stats enable row level security;
alter table public.edge_stats enable row level security;
alter table public.misconception_stats enable row level security;
create policy item_stats_staff_read on public.item_stats for select using (public.is_staff());
create policy edge_stats_staff_read on public.edge_stats for select using (public.is_staff());
create policy misconception_stats_staff_read on public.misconception_stats for select using (public.is_staff());
