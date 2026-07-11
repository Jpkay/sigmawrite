-- G09: a lexical envelope may publish lemma/form/frequency coverage before
-- pedagogical senses are authored. Exactly one lemma or sense target is stored.
alter table public.lexical_release_entries drop constraint lexical_release_entries_pkey;
alter table public.lexical_release_entries
  alter column sense_id drop not null,
  add column lemma_id uuid references public.lexical_lemmas(id) on delete restrict,
  add column id uuid not null default gen_random_uuid(),
  add constraint lexical_release_entry_target check ((lemma_id is null) <> (sense_id is null)),
  add constraint lexical_release_entries_pkey primary key (id),
  add constraint lexical_release_entries_unique_target unique nulls not distinct (release_id,lemma_id,sense_id);

create unique index lexical_release_entries_stable_key
  on public.lexical_release_entries(release_id,stable_key);

comment on column public.lexical_release_entries.lemma_id is
  'Lemma-level release entry for vocabulary-envelope coverage when no reviewed pedagogical sense is claimed.';
