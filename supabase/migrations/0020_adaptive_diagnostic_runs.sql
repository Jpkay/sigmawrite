-- Sprint 8: persistent adaptive diagnostic runs.

create table if not exists public.diagnostic_runs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  learning_goal_id uuid references public.learning_goals(id) on delete set null,
  status text not null default 'running' check (status in ('running','completed','abandoned')),
  probe_count integer not null default 0 check (probe_count >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  frontier_report jsonb,
  derived_reading_band text
);
alter table public.diagnostic_runs enable row level security;
create policy diagnostic_runs_select on public.diagnostic_runs
  for select using (public.can_view_student(student_id));
create policy diagnostic_runs_student_insert on public.diagnostic_runs
  for insert with check (public.owns_student(student_id));
create policy diagnostic_runs_student_update on public.diagnostic_runs
  for update using (public.owns_student(student_id)) with check (public.owns_student(student_id));

alter table public.competency_attempts
  add column if not exists diagnostic_run_id uuid references public.diagnostic_runs(id) on delete set null;
create index if not exists diagnostic_runs_student_started_idx on public.diagnostic_runs (student_id, started_at desc);
create index if not exists competency_attempts_diagnostic_run_idx on public.competency_attempts (diagnostic_run_id, attempted_at);
