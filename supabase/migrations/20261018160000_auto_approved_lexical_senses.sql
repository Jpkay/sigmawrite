-- Automatic word definitions (roadmap 2026-10, Phases B–D content).
--
-- The lexicon-definitions pipeline (scripts/generate-lexicon-definitions.mts)
-- writes a child-friendly definition, interest examples, own-words validation
-- criteria and close words for every lemma of the licensed lexical release.
-- Each sense passed deterministic gates and an independent model verification;
-- no person approves each item (product rule). Such a sense is `auto_approved`
-- with its pipeline version and gate results, never marked as reviewed by a
-- person. Word memory treats `auto_approved` and `human_approved` alike;
-- `retired` takes a sense down immediately.

alter table public.lexical_senses drop constraint if exists lexical_senses_review_status_check;
alter table public.lexical_senses
  add constraint lexical_senses_review_status_check
  check (review_status in ('draft','human_approved','auto_approved','rejected','retired'));

alter table public.lexical_senses
  add column if not exists examples_fr jsonb not null default '[]'::jsonb,
  add column if not exists definition_validation jsonb not null default '[]'::jsonb,
  add column if not exists close_words jsonb not null default '{}'::jsonb,
  add column if not exists grade_level integer check (grade_level between 4 and 12),
  add column if not exists pipeline_version text,
  add column if not exists gate_results jsonb,
  add column if not exists auto_approved_at timestamptz;

alter table public.lexical_senses
  add constraint lexical_senses_examples_array check (jsonb_typeof(examples_fr) = 'array'),
  add constraint lexical_senses_validation_array check (jsonb_typeof(definition_validation) = 'array'),
  add constraint lexical_senses_close_words_object check (jsonb_typeof(close_words) = 'object'),
  add constraint lexical_senses_auto_approval_provenance check (
    review_status <> 'auto_approved'
    or (
      pipeline_version is not null and length(btrim(pipeline_version)) > 0
      and gate_results is not null and jsonb_typeof(gate_results) = 'object'
      and gate_results -> 'passed' = 'true'::jsonb
      and auto_approved_at is not null
    )
  );

comment on column public.lexical_senses.examples_fr is
  'Example sentences [{text, interest}] using the word in this sense; at least one is about a student interest (interests.ts key).';
comment on column public.lexical_senses.definition_validation is
  'Criteria to grade an own-words explanation (D.5): [{kind: key_idea|accepted_paraphrase|misconception, ...}].';
comment on column public.lexical_senses.close_words is
  'Distractor material: {synonyms, antonyms, semantic, orthographic} lemma lists, spellings vetted against the licensed lexicon.';
comment on column public.lexical_senses.pipeline_version is 'Version of the automatic pipeline that wrote this sense (auto_approved only).';
comment on column public.lexical_senses.gate_results is
  'Gate record for auto_approved senses: {passed, attempts, gates:[{gate,status,details}], verifier:{model,verdict,issues}}.';

-- Vocabulary items remember which pipeline wrote their definition so a re-import
-- updates its own content and never overwrites a definition written by a person.
alter table public.vocabulary_items
  add column if not exists content_pipeline_version text;
comment on column public.vocabulary_items.content_pipeline_version is
  'Null = definition written by a person (or none). Set = written by that automatic pipeline version; re-imports may refresh it.';

-- Students read approved senses, automatic or human.
drop policy if exists lexical_senses_authenticated_read on public.lexical_senses;
create policy lexical_senses_authenticated_read on public.lexical_senses for select
using (auth.uid() is not null and review_status in ('human_approved','auto_approved'));

-- Word memory resolves automatic senses like human ones.
create or replace function public.resolve_word_senses(p_item_ids uuid[], p_forms text[])
returns table(match_key text, vocabulary_item_id uuid, lemma_id uuid, sense_id uuid, sense_count integer, display_word text, definition_fr text)
language sql stable security definer set search_path=public as $$
  with matches as (
    select v.id::text as match_key, l.id as lemma_id
    from vocabulary_items v join lexical_lemmas l on l.vocabulary_item_id = v.id
    where v.id = any(coalesce(p_item_ids, '{}'::uuid[]))
    union
    select f.normalized_form, f.lemma_id from lexical_forms f
    where f.normalized_form = any(coalesce(p_forms, '{}'::text[]))
    union
    select l.normalized_lemma, l.id from lexical_lemmas l
    where l.active and l.normalized_lemma = any(coalesce(p_forms, '{}'::text[]))
    union
    select lower(trim(v.display_word)), l.id
    from vocabulary_items v join lexical_lemmas l on l.vocabulary_item_id = v.id
    where lower(trim(v.display_word)) = any(coalesce(p_forms, '{}'::text[]))
  ), senses as (
    select s.id, s.lemma_id, s.definition_fr, count(*) over (partition by s.lemma_id)::integer as sense_count
    from lexical_senses s
    where s.review_status in ('human_approved','auto_approved') and s.is_teachable and not s.is_proper_noun
  )
  select m.match_key, l.vocabulary_item_id, l.id, s.id, coalesce(s.sense_count, 0), v.display_word, s.definition_fr
  from matches m
  join lexical_lemmas l on l.id = m.lemma_id and l.vocabulary_item_id is not null
  join vocabulary_items v on v.id = l.vocabulary_item_id
  left join senses s on s.lemma_id = l.id
$$;
revoke all on function public.resolve_word_senses(uuid[], text[]) from public, anon, authenticated;
grant execute on function public.resolve_word_senses(uuid[], text[]) to service_role;
