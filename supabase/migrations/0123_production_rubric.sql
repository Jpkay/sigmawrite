-- Rubric-grounded feedback on free productions (roadmap 5.3). The AI value is
-- stored alongside the deterministic anchor for audit and teacher oversight.
alter table public.independent_production_submissions
  add column if not exists rubric jsonb,
  add column if not exists genre text;
