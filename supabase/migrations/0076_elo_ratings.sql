-- Elo/1PL ability–difficulty ratings (gap-analysis Phase 3).
--
-- Practice item selection targets ~82% predicted success instead of the
-- static easy→hard difficulty ramp. Learner ability is tracked per strand;
-- item difficulty ratings start from the authored 0–100 difficulty and are
-- calibrated online with an uncertainty-decayed K (see src/lib/scoring/elo.ts).

create table student_ability_ratings (
  student_id uuid not null references students(id) on delete cascade,
  strand text not null,
  rating numeric not null default 0,
  attempts int not null default 0 check (attempts >= 0),
  updated_at timestamptz not null default now(),
  primary key (student_id, strand)
);

alter table competency_items
  add column if not exists difficulty_rating numeric,
  add column if not exists rating_attempts int not null default 0
    check (rating_attempts >= 0);

comment on column competency_items.difficulty_rating is
  'Elo/1PL difficulty on a logit scale; null until first calibrated, prior = (difficulty-50)/15';

alter table student_ability_ratings enable row level security;

create policy student_ability_ratings_read
  on student_ability_ratings for select
  using (public.can_view_student(student_id));
