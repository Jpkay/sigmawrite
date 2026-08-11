-- Written answers and evidence-based vocabulary learning.
alter table public.vocabulary_items
  add column if not exists examples_fr jsonb not null default '[]'::jsonb,
  add column if not exists grade_level integer check (grade_level between 4 and 12),
  add column if not exists related_topics jsonb not null default '[]'::jsonb,
  add column if not exists definition_validation jsonb not null default '[]'::jsonb;
alter table public.student_word_mastery
  add column if not exists evidence_counts jsonb not null default '{"exposure":0,"help_lookup":0,"recognition":0,"meaning_recall":0,"contextual_use":0,"correct_spelling":0,"successfulProductionDates":[]}'::jsonb,
  add column if not exists learning_status text not null default 'new' check (learning_status in ('new','review','maintenance'));
alter table public.learning_retrieval_schedules
  add column if not exists fsrs_state jsonb not null default '{}'::jsonb;
create table if not exists public.vocabulary_learning_evidence (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  vocabulary_item_id uuid not null references public.vocabulary_items(id) on delete cascade,
  schedule_id uuid references public.learning_retrieval_schedules(id) on delete set null,
  evidence_kind text not null check (evidence_kind in ('exposure','help_lookup','recognition','meaning_recall','contextual_use','correct_spelling')),
  successful boolean not null default false,
  typed_production boolean not null default false,
  evidence_payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists vocabulary_learning_evidence_student_word_idx
  on public.vocabulary_learning_evidence(student_id, vocabulary_item_id, occurred_at desc);
alter table public.vocabulary_learning_evidence enable row level security;
create policy vocabulary_learning_evidence_student_read on public.vocabulary_learning_evidence
  for select using (student_id in (select id from public.students where profile_id = auth.uid()));
create policy vocabulary_learning_evidence_student_insert on public.vocabulary_learning_evidence
  for insert with check (student_id in (select id from public.students where profile_id = auth.uid()));
create policy vocabulary_learning_evidence_staff_read on public.vocabulary_learning_evidence
  for select using (public.is_staff());
grant select, insert on public.vocabulary_learning_evidence to authenticated;
comment on column public.student_word_mastery.mastery is
  'Derived only from successful spaced typed production. Exposure and help lookup never increase mastery.';
comment on column public.learning_retrieval_schedules.fsrs_state is
  'Persisted FSRS-6 stability and difficulty for unified retrieval scheduling.';
