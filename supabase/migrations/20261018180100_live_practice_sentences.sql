-- Roadmap F.2 (live): short practice sentences written in a student's
-- interest around a bank conjugation item. The model writes the setting only;
-- the verb form comes from the conjugation engine and deterministic gates
-- check it before the form is blanked. Sentences are auto_approved with the
-- pipeline version and gate list, cached per item × interest and reused for
-- other students. Only an interest key and the item reach the model.
create table public.live_practice_sentences (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.competency_items(id) on delete cascade,
  interest text not null check (char_length(interest) between 2 and 60),
  sentence text not null check (char_length(sentence) between 10 and 240),
  prompt_fr text not null check (char_length(prompt_fr) between 10 and 800),
  expected_form text not null,
  model text,
  pipeline_version text not null,
  gate_results jsonb not null default '[]'::jsonb,
  review_status text not null default 'auto_approved' check (review_status in ('auto_approved','withdrawn')),
  served_count integer not null default 0 check (served_count >= 0),
  created_at timestamptz not null default now()
);
create index live_practice_sentences_lookup_idx on public.live_practice_sentences (item_id, interest, served_count) where review_status = 'auto_approved';

alter table public.live_practice_sentences enable row level security;
create policy live_practice_sentences_read on public.live_practice_sentences for select to authenticated using (public.is_staff());
-- Students receive the sentence through the practice page (service role); clients only read as staff.
revoke all on public.live_practice_sentences from anon, authenticated;
grant select on public.live_practice_sentences to authenticated;

comment on table public.live_practice_sentences is 'F.2 live practice sentences (auto_approved, deterministic gates, cached per item and interest). Withdraw with review_status = withdrawn.';
