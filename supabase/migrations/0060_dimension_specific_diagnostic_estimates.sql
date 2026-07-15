-- Recognition and production are separate evidence channels. A learner may
-- recognize a tense or spelling pattern without being able to produce it.

create table public.student_competency_dimension_estimates (
  student_id uuid not null references public.students(id) on delete cascade,
  node_id uuid not null references public.competency_nodes(id) on delete cascade,
  dimension text not null check (dimension in ('receptive','productive','written','oral')),
  mastery_probability numeric not null check (mastery_probability between 0 and 1),
  uncertainty numeric not null check (uncertainty between 0 and 1),
  evidence_count integer not null default 0 check (evidence_count >= 0),
  last_evidence_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (student_id,node_id,dimension)
);

create table public.diagnostic_node_dimension_results (
  run_id uuid not null references public.diagnostic_runs(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  node_id uuid not null references public.competency_nodes(id) on delete restrict,
  dimension text not null check (dimension in ('receptive','productive','written','oral')),
  mastery_evidence_id uuid references public.competency_mastery_evidence(id) on delete set null,
  mastery_probability numeric not null check (mastery_probability between 0 and 1),
  uncertainty numeric not null check (uncertainty between 0 and 1),
  direct_evidence_count integer not null default 0 check (direct_evidence_count >= 0),
  classification text not null check (classification in ('mastered','fragile','missing','unknown')),
  updated_at timestamptz not null default now(),
  primary key (run_id,node_id,dimension)
);

alter table public.student_competency_dimension_estimates enable row level security;
alter table public.diagnostic_node_dimension_results enable row level security;

create policy competency_dimension_estimates_select on public.student_competency_dimension_estimates
  for select using (public.can_view_student(student_id));
create policy diagnostic_dimension_results_select on public.diagnostic_node_dimension_results
  for select using (public.can_view_student(student_id));

grant select on public.student_competency_dimension_estimates,
  public.diagnostic_node_dimension_results to authenticated;

create index diagnostic_dimension_results_run
  on public.diagnostic_node_dimension_results(run_id,dimension,classification);

comment on table public.student_competency_dimension_estimates is
  'Independent longitudinal posteriors for receptive/productive and written/oral evidence.';
