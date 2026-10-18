-- Dictée tags (roadmap 2026-10, G.1).
-- Themes, interests, tenses, target words and grammar nodes let the picker
-- (src/lib/dictation/picker.ts) match a dictée to the student's interests,
-- weak skills and due words. `word_count` already exists (0113) and
-- `target_node_keys` keeps its meaning: the spelling nodes the dictée trains.

alter table public.dictations
  add column if not exists themes text[] not null default '{}',
  add column if not exists interests text[] not null default '{}',
  add column if not exists tenses text[] not null default '{}',
  add column if not exists target_lemmas text[] not null default '{}',
  add column if not exists grammar_node_keys text[] not null default '{}',
  add column if not exists cefr_band text;

alter table public.dictations
  add constraint dictations_tenses_known check (
    tenses <@ array[
      'present','imparfait','passe_compose','futur_simple','futur_proche','passe_recent',
      'passe_simple','conditionnel_present','subjonctif_present','imperatif_present','plus_que_parfait'
    ]::text[]
  ),
  add constraint dictations_cefr_band_known check (cefr_band is null or cefr_band in ('A1','A2','B1','B2','C1')),
  add constraint dictations_tag_sizes check (
    cardinality(themes) <= 8 and cardinality(interests) <= 8 and cardinality(tenses) <= 11
    and cardinality(target_lemmas) <= 24 and cardinality(grammar_node_keys) <= 24
  );

create index if not exists dictations_interests_idx on public.dictations using gin (interests);
create index if not exists dictations_grade_idx on public.dictations (grade_min, grade_max);

comment on column public.dictations.themes is 'Lowercase French theme words shown to students as chips (nature, école…).';
comment on column public.dictations.interests is 'Interest keys from src/lib/content/interests.ts the text is about.';
comment on column public.dictations.tenses is 'Conjugation tenses used in the text (keys of src/lib/linguistic/conjugation.ts Tense).';
comment on column public.dictations.target_lemmas is 'Normalized lemmas (lowercase, accents kept) of the words the dictée works on; matched against due words.';
comment on column public.dictations.grammar_node_keys is 'Grammar competency nodes (tense use…) the text exercises, in addition to target_node_keys.';
comment on column public.dictations.cefr_band is 'Approximate CEFR band of the text (A1–C1).';
