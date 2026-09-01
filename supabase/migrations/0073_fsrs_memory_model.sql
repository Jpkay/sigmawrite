-- FSRS memory model (gap-analysis Phase 2).
--
-- Adds DSR memory state to retrieval schedules and competency estimates.
-- stability = days for retrievability to fall to 90%; difficulty = 1–10.
-- NULL stability means "never graded under FSRS yet" — the scheduler
-- initializes state at the first graded review, so legacy SM-2 rows migrate
-- lazily with no backfill. ease_factor/interval_days/repetitions stay for
-- compatibility (and as the offline-store fallback) but FSRS is authoritative
-- once stability is non-null.

alter table retrieval_schedules
  add column if not exists stability numeric check (stability > 0),
  add column if not exists difficulty numeric check (difficulty between 1 and 10),
  add column if not exists desired_retention numeric not null default 0.90
    check (desired_retention between 0.70 and 0.97),
  add column if not exists last_reviewed_at timestamptz;

-- Memory state per competency node: feeds effective-mastery decay (the
-- long-dormant decay_rate column is superseded by retrievability computed
-- from memory_stability + last_evidence_at).
alter table student_competency_estimates
  add column if not exists memory_stability numeric check (memory_stability > 0),
  add column if not exists memory_difficulty numeric
    check (memory_difficulty between 1 and 10);

comment on column retrieval_schedules.stability is
  'FSRS stability (days to 90% retrievability); null until first graded review';
comment on column student_competency_estimates.memory_stability is
  'FSRS stability of the node skill; with last_evidence_at yields retrievability for mastery decay';
