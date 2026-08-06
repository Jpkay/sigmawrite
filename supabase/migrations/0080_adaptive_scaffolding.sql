alter table public.student_competency_estimates
  add column if not exists scaffold_level integer not null default 0 check(scaffold_level between 0 and 3),
  add column if not exists unaided_success_streak integer not null default 0 check(unaided_success_streak>=0);
comment on column public.student_competency_estimates.scaffold_level is '0 independent; 1 orientation; 2 metalinguistic clue; 3 worked-example support';
