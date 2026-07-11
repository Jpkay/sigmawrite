-- G08: additive lexical graph. The original vocabulary_items id remains the
-- stable anchor for student_word_mastery and text_vocabulary.

create table public.lexical_releases (
  id uuid primary key default gen_random_uuid(),
  release_key text unique not null,
  version text unique not null,
  status text not null default 'draft' check (status in ('draft','validating','published','withdrawn')),
  manifest jsonb,
  manifest_checksum text,
  source_attributions jsonb not null default '[]'::jsonb,
  validation_report jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  withdrawn_at timestamptz,
  constraint lexical_published_complete check (
    status <> 'published' or (
      manifest is not null and coalesce(manifest_checksum, '') <> ''
      and validation_report @> '{"valid":true}'::jsonb
      and published_by is not null and published_at is not null
    )
  )
);

create table public.lexical_lemmas (
  id uuid primary key default gen_random_uuid(),
  vocabulary_item_id uuid unique references public.vocabulary_items(id) on delete restrict,
  lemma text not null,
  normalized_lemma text not null,
  part_of_speech text,
  grammatical_gender text check (grammatical_gender in ('masculine','feminine','common','invariable')),
  number_behavior text check (number_behavior in ('variable','singular_only','plural_only','invariable')),
  register text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lexical_lemmas_normalized on public.lexical_lemmas(normalized_lemma);

create table public.lexical_senses (
  id uuid primary key default gen_random_uuid(),
  lemma_id uuid not null references public.lexical_lemmas(id) on delete cascade,
  sense_key text not null,
  definition_fr text not null,
  domain text,
  register text,
  ambiguity_risk numeric not null default 0 check (ambiguity_risk between 0 and 1),
  is_expected boolean not null default false,
  is_teachable boolean not null default true,
  is_specialist boolean not null default false,
  is_proper_noun boolean not null default false,
  review_status text not null default 'draft' check (review_status in ('draft','human_approved','rejected','retired')),
  created_at timestamptz not null default now(),
  unique (lemma_id, sense_key)
);

create table public.lexical_forms (
  id uuid primary key default gen_random_uuid(),
  lemma_id uuid not null references public.lexical_lemmas(id) on delete cascade,
  surface_form text not null,
  normalized_form text not null,
  form_type text not null check (form_type in ('lemma','inflected','variant','elided','multiword')),
  features jsonb not null default '{}'::jsonb,
  source_version_id uuid references public.taxonomy_source_versions(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (lemma_id, normalized_form, form_type, features)
);
create index lexical_forms_normalized on public.lexical_forms(normalized_form);

create table public.lexical_families (
  id uuid primary key default gen_random_uuid(),
  family_key text unique not null,
  label_fr text not null,
  family_type text not null check (family_type in ('derivational','morphological','semantic','verb_family')),
  created_at timestamptz not null default now()
);

create table public.lexical_family_members (
  family_id uuid not null references public.lexical_families(id) on delete cascade,
  lemma_id uuid not null references public.lexical_lemmas(id) on delete cascade,
  relationship text not null,
  primary key (family_id, lemma_id)
);

create table public.lexical_frequencies (
  id uuid primary key default gen_random_uuid(),
  lemma_id uuid references public.lexical_lemmas(id) on delete cascade,
  form_id uuid references public.lexical_forms(id) on delete cascade,
  source_version_id uuid not null references public.taxonomy_source_versions(id) on delete restrict,
  corpus_partition text not null default 'all',
  frequency_per_million numeric not null check (frequency_per_million >= 0),
  dispersion numeric check (dispersion between 0 and 1),
  rank integer check (rank > 0),
  created_at timestamptz not null default now(),
  constraint lexical_frequency_target check ((lemma_id is null) <> (form_id is null)),
  unique nulls not distinct (lemma_id, form_id, source_version_id, corpus_partition)
);

create table public.lexical_relationships (
  id uuid primary key default gen_random_uuid(),
  source_sense_id uuid not null references public.lexical_senses(id) on delete cascade,
  target_sense_id uuid not null references public.lexical_senses(id) on delete cascade,
  relationship_type text not null check (relationship_type in (
    'synonym','antonym','simpler_than','broader_than','narrower_than',
    'commonly_confused_with','cognate','false_friend'
  )),
  home_language text,
  strength numeric not null default 1 check (strength between 0 and 1),
  rationale text not null,
  source_version_id uuid references public.taxonomy_source_versions(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint lexical_relationship_no_self_loop check (source_sense_id <> target_sense_id),
  unique nulls not distinct (source_sense_id, target_sense_id, relationship_type, home_language)
);

create table public.lexical_collocations (
  id uuid primary key default gen_random_uuid(),
  sense_id uuid not null references public.lexical_senses(id) on delete cascade,
  expression text not null,
  normalized_expression text not null,
  register text,
  source_version_id uuid references public.taxonomy_source_versions(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (sense_id, normalized_expression)
);

create table public.lexical_progression_mappings (
  id uuid primary key default gen_random_uuid(),
  sense_id uuid not null references public.lexical_senses(id) on delete cascade,
  learner_mode text not null check (learner_mode in (
    'french_first_language','french_second_language','heritage','bilingual','allophone','immersion'
  )),
  framework text not null check (framework in ('native_grade','cefr','local_curriculum')),
  level_min text,
  level_max text,
  expectation text not null check (expectation in ('receptive','controlled_production','independent_production')),
  status text not null default 'provisional' check (status in ('provisional','reviewed','disputed','retired')),
  confidence numeric not null default 0.5 check (confidence between 0 and 1),
  rationale text not null,
  source_version_id uuid not null references public.taxonomy_source_versions(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (sense_id, learner_mode, framework, expectation)
);

create table public.lexical_release_entries (
  release_id uuid not null references public.lexical_releases(id) on delete restrict,
  sense_id uuid not null references public.lexical_senses(id) on delete restrict,
  stable_key text not null,
  record_snapshot jsonb not null,
  record_checksum text not null,
  created_at timestamptz not null default now(),
  primary key (release_id, sense_id)
);

-- Compatibility projection: existing vocabulary and all mastery foreign keys
-- remain untouched. Each old item gets a lemma, display form, and optional sense.
insert into public.lexical_lemmas(vocabulary_item_id,lemma,normalized_lemma)
select id,lemma,lower(trim(lemma)) from public.vocabulary_items
on conflict (vocabulary_item_id) do nothing;

insert into public.lexical_forms(lemma_id,surface_form,normalized_form,form_type)
select l.id,v.display_word,lower(trim(v.display_word)),
  case when position(' ' in trim(v.display_word)) > 0 then 'multiword' else 'lemma' end
from public.lexical_lemmas l
join public.vocabulary_items v on v.id=l.vocabulary_item_id
on conflict do nothing;

insert into public.lexical_senses(lemma_id,sense_key,definition_fr,review_status)
select l.id,'legacy_default',v.definition_fr,'human_approved'
from public.lexical_lemmas l
join public.vocabulary_items v on v.id=l.vocabulary_item_id
where nullif(trim(v.definition_fr),'') is not null
on conflict (lemma_id,sense_key) do nothing;

create or replace function public.guard_lexical_release_immutable()
returns trigger language plpgsql set search_path=public as $$
begin
  if tg_op='DELETE' and old.status in ('published','withdrawn') then
    raise exception 'published_lexical_release_is_immutable';
  end if;
  if tg_op='UPDATE' and old.status in ('published','withdrawn') then
    if old.status='published' and new.status='withdrawn'
      and new.release_key=old.release_key and new.version=old.version
      and new.manifest=old.manifest and new.manifest_checksum=old.manifest_checksum
      and new.source_attributions=old.source_attributions and new.validation_report=old.validation_report
      and new.created_by is not distinct from old.created_by
      and new.published_by is not distinct from old.published_by
      and new.created_at=old.created_at and new.published_at is not distinct from old.published_at
      and new.withdrawn_at is not null then return new;
    end if;
    raise exception 'published_lexical_release_is_immutable';
  end if;
  return coalesce(new,old);
end $$;
create trigger lexical_release_immutability before update or delete on public.lexical_releases
for each row execute function public.guard_lexical_release_immutable();

create or replace function public.guard_lexical_entry_immutable()
returns trigger language plpgsql set search_path=public as $$
declare rid uuid := coalesce(new.release_id,old.release_id);
begin
  if exists(select 1 from public.lexical_releases where id=rid and status in ('published','withdrawn')) then
    raise exception 'published_lexical_entry_is_immutable';
  end if;
  return coalesce(new,old);
end $$;
create trigger lexical_entry_immutability before insert or update or delete on public.lexical_release_entries
for each row execute function public.guard_lexical_entry_immutable();

create or replace function public.lexical_release_token_coverage(p_release_id uuid,p_tokens text[])
returns table(total_tokens integer,known_tokens integer,coverage numeric,unknown_tokens text[])
language sql stable set search_path=public as $$
  with tokens as (
    select lower(trim(token)) normalized from unnest(p_tokens) token where nullif(trim(token),'') is not null
  ), matched as (
    select t.normalized,
      exists(
        select 1 from public.lexical_release_entries e
        join public.lexical_senses s on s.id=e.sense_id
        join public.lexical_lemmas l on l.id=s.lemma_id
        left join public.lexical_forms f on f.lemma_id=l.id
        where e.release_id=p_release_id
          and (l.normalized_lemma=t.normalized or f.normalized_form=t.normalized)
      ) known
    from tokens t
  )
  select count(*)::integer,
    count(*) filter(where known)::integer,
    case when count(*)=0 then 1 else round((count(*) filter(where known))::numeric/count(*),4) end,
    coalesce(array_agg(distinct normalized order by normalized) filter(where not known),'{}'::text[])
  from matched
$$;

do $$ declare table_name text; begin
  foreach table_name in array array[
    'lexical_releases','lexical_lemmas','lexical_senses','lexical_forms','lexical_families',
    'lexical_family_members','lexical_frequencies','lexical_relationships','lexical_collocations',
    'lexical_progression_mappings','lexical_release_entries'
  ] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('create policy %I on public.%I for all using (public.is_staff()) with check (public.is_staff())',table_name||'_staff_write',table_name);
  end loop;
end $$;

create policy lexical_releases_authenticated_read on public.lexical_releases for select
using(auth.uid() is not null and status in ('published','withdrawn'));
create policy lexical_lemmas_authenticated_read on public.lexical_lemmas for select using(auth.uid() is not null and active);
create policy lexical_senses_authenticated_read on public.lexical_senses for select using(auth.uid() is not null and review_status='human_approved');
create policy lexical_forms_authenticated_read on public.lexical_forms for select using(auth.uid() is not null);
create policy lexical_families_authenticated_read on public.lexical_families for select using(auth.uid() is not null);
create policy lexical_family_members_authenticated_read on public.lexical_family_members for select using(auth.uid() is not null);
create policy lexical_frequencies_authenticated_read on public.lexical_frequencies for select using(auth.uid() is not null);
create policy lexical_relationships_authenticated_read on public.lexical_relationships for select using(auth.uid() is not null);
create policy lexical_collocations_authenticated_read on public.lexical_collocations for select using(auth.uid() is not null);
create policy lexical_progression_authenticated_read on public.lexical_progression_mappings for select using(auth.uid() is not null and status='reviewed');
create policy lexical_release_entries_authenticated_read on public.lexical_release_entries for select
using(auth.uid() is not null and exists(select 1 from public.lexical_releases r where r.id=release_id and r.status in ('published','withdrawn')));

comment on column public.lexical_lemmas.vocabulary_item_id is
  'Compatibility anchor: student_word_mastery continues to reference vocabulary_items while lexical detail evolves additively.';
comment on table public.lexical_frequencies is
  'Frequency is always tied to an approved source version and corpus partition; there is no unexplained global frequency.';

