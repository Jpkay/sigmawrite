-- Finalization can be safely retried after a network/deployment interruption.
alter table public.student_reading_estimates
  add column if not exists diagnostic_run_id uuid unique
    references public.diagnostic_runs(id) on delete set null;

create index if not exists student_reading_estimates_diagnostic_run
  on public.student_reading_estimates(diagnostic_run_id)
  where diagnostic_run_id is not null;
