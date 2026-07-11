-- G03: versioned French taxonomy, provenance, evidence, and immutable releases.
-- Additive by design: existing competency ids, estimates, attempts, and traversal
-- functions remain valid.

create table public.ontology_versions (
  id uuid primary key default gen_random_uuid(),
  version text unique not null,
  document_path text not null,
  checksum text,
  status text not null default 'active' check (status in ('draft','active','retired')),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.taxonomy_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text unique not null,
  title text not null,
  owner_name text not null,
  source_kind text not null check (source_kind in (
    'curriculum','framework','lexicon','frequency','morphology','grammar',
    'assessment','tool','original','generated','public_domain','other'
  )),
  canonical_url text,
  steward text not null,
  created_at timestamptz not null default now()
);

create table public.taxonomy_source_versions (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.taxonomy_sources(id) on delete restrict,
  version_label text not null,
  artifact_url text,
  artifact_checksum text,
  retrieved_at timestamptz,
  rights_status text not null check (rights_status in (
    'importable','codes_only','reference_only','permission_required','prohibited'
  )),
  license_identifier text,
  license_url text,
  terms_snapshot text,
  permitted_fields text[] not null default '{}',
  attribution_template text not null,
  derivative_obligations text,
  redistribution_obligations text,
  commercial_use_allowed boolean,
  decision_notes text not null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source_id, version_label),
  constraint importable_source_has_terms check (
    rights_status <> 'importable'
    or (
      approved_at is not null
      and commercial_use_allowed is true
      and coalesce(license_identifier, '') <> ''
      and coalesce(terms_snapshot, '') <> ''
      and cardinality(permitted_fields) > 0
    )
  )
);

create table public.taxonomy_domains (
  id uuid primary key default gen_random_uuid(),
  domain_key text unique not null,
  label_fr text not null,
  description_fr text,
  layer text not null check (layer in (
    'competency','lexical','construction','content_concept','learning_package'
  )),
  created_at timestamptz not null default now()
);

create table public.taxonomy_clusters (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.taxonomy_domains(id) on delete restrict,
  cluster_key text unique not null,
  label_fr text not null,
  description_fr text,
  created_at timestamptz not null default now()
);

alter table public.competency_nodes
  add column if not exists ontology_version_id uuid references public.ontology_versions(id) on delete restrict,
  add column if not exists node_type text not null default 'procedural'
    check (node_type in ('conceptual','procedural','linguistic','representational','metacognitive')),
  add column if not exists domain_id uuid references public.taxonomy_domains(id) on delete set null,
  add column if not exists cluster_id uuid references public.taxonomy_clusters(id) on delete set null,
  add column if not exists modality_scope text[] not null default '{}',
  add column if not exists expectation_scope text[] not null default '{}',
  add column if not exists positive_examples jsonb not null default '[]'::jsonb,
  add column if not exists negative_examples jsonb not null default '[]'::jsonb;

alter table public.competency_nodes
  add constraint competency_nodes_modality_scope_values check (
    modality_scope <@ array['reading','writing','listening','speaking']::text[]
  ),
  add constraint competency_nodes_expectation_scope_values check (
    expectation_scope <@ array['receptive','controlled_production','independent_production']::text[]
  );

alter table public.competency_edges
  add column if not exists prerequisite_class text
    check (prerequisite_class in ('hard','soft')),
  add column if not exists rationale text,
  add column if not exists review_status text not null default 'draft'
    check (review_status in ('draft','human_approved','rejected','retired')),
  add column if not exists source_version_id uuid references public.taxonomy_source_versions(id) on delete restrict;

-- Compatibility: every pre-existing prerequisite was a blocking prerequisite.
update public.competency_edges
set prerequisite_class = 'hard',
    rationale = coalesce(nullif(notes, ''), 'Legacy prerequisite retained during G03 migration')
where edge_type = 'prerequisite' and prerequisite_class is null;

alter table public.competency_edges
  add constraint competency_edges_prerequisite_class_consistent check (
    (edge_type = 'prerequisite' and prerequisite_class is not null)
    or (edge_type <> 'prerequisite' and prerequisite_class is null)
  );

create table public.competency_mastery_evidence (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.competency_nodes(id) on delete cascade,
  evidence_key text not null,
  observable_action_fr text not null,
  modality text not null check (modality in ('reading','writing','listening','speaking','multimodal')),
  expectation text not null check (expectation in (
    'receptive','controlled_production','independent_production'
  )),
  success_criteria jsonb not null,
  minimum_distinct_items int not null default 2 check (minimum_distinct_items > 0),
  minimum_occasions int not null default 2 check (minimum_occasions > 0),
  negative_evidence_fr text,
  source_version_id uuid references public.taxonomy_source_versions(id) on delete restrict,
  review_status text not null default 'draft'
    check (review_status in ('draft','human_approved','rejected','retired')),
  created_at timestamptz not null default now(),
  unique (node_id, evidence_key)
);

create table public.competency_progression_mappings (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.competency_nodes(id) on delete cascade,
  learner_mode text not null check (learner_mode in (
    'french_first_language','french_second_language','heritage','bilingual','allophone','immersion'
  )),
  framework text not null check (framework in ('native_grade','cefr','delf_dalf','immersion','local_curriculum')),
  level_min text,
  level_max text,
  expectation text not null check (expectation in (
    'receptive','controlled_production','independent_production','mixed'
  )),
  mapping_status text not null default 'provisional'
    check (mapping_status in ('provisional','reviewed','disputed','retired')),
  confidence numeric not null default 0.5 check (confidence between 0 and 1),
  rationale text not null,
  source_version_id uuid not null references public.taxonomy_source_versions(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (node_id, learner_mode, framework, expectation)
);

create table public.taxonomy_record_sources (
  id uuid primary key default gen_random_uuid(),
  record_type text not null check (record_type in (
    'competency_node','competency_edge','mastery_evidence','progression_mapping',
    'lexical_record','construction','content_concept'
  )),
  record_id uuid not null,
  source_version_id uuid not null references public.taxonomy_source_versions(id) on delete restrict,
  relationship text not null check (relationship in (
    'authored_from','mapped_to','validated_by','frequency_from','form_from','inspired_by'
  )),
  source_locator text,
  transformation_version text,
  created_at timestamptz not null default now(),
  unique (record_type, record_id, source_version_id, relationship)
);

create table public.taxonomy_releases (
  id uuid primary key default gen_random_uuid(),
  release_key text unique not null,
  version text unique not null,
  ontology_version_id uuid not null references public.ontology_versions(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','validating','published','withdrawn')),
  manifest jsonb,
  manifest_checksum text,
  validation_report jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  withdrawn_at timestamptz,
  constraint published_release_complete check (
    status <> 'published'
    or (
      published_at is not null
      and published_by is not null
      and manifest is not null
      and coalesce(manifest_checksum, '') <> ''
      and validation_report is not null
      and validation_report @> '{"valid": true}'::jsonb
    )
  )
);

create table public.taxonomy_release_memberships (
  release_id uuid not null references public.taxonomy_releases(id) on delete restrict,
  record_type text not null check (record_type in (
    'competency_node','competency_edge','mastery_evidence','progression_mapping',
    'lexical_record','construction','content_concept'
  )),
  record_id uuid not null,
  stable_key text not null,
  record_version int not null check (record_version > 0),
  record_snapshot jsonb not null,
  record_checksum text not null,
  created_at timestamptz not null default now(),
  primary key (release_id, record_type, record_id)
);

create or replace function public.guard_published_taxonomy_release()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' and old.status = 'published' then
    raise exception 'published_taxonomy_release_is_immutable';
  end if;
  if tg_op = 'UPDATE' and old.status = 'published' then
    if new.status = 'withdrawn'
      and new.release_key = old.release_key
      and new.version = old.version
      and new.ontology_version_id = old.ontology_version_id
      and new.manifest = old.manifest
      and new.manifest_checksum = old.manifest_checksum
      and new.validation_report = old.validation_report
      and new.created_by is not distinct from old.created_by
      and new.published_by is not distinct from old.published_by
      and new.created_at = old.created_at
      and new.published_at is not distinct from old.published_at
      and new.withdrawn_at is not null
    then
      return new;
    end if;
    raise exception 'published_taxonomy_release_is_immutable';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger taxonomy_release_immutability
before update or delete on public.taxonomy_releases
for each row execute function public.guard_published_taxonomy_release();

create or replace function public.guard_published_taxonomy_membership()
returns trigger
language plpgsql
set search_path = public
as $$
declare target_release_id uuid := coalesce(new.release_id, old.release_id);
begin
  if exists (
    select 1 from public.taxonomy_releases
    where id = target_release_id and status in ('published','withdrawn')
  ) then
    raise exception 'published_taxonomy_membership_is_immutable';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger taxonomy_membership_immutability
before insert or update or delete on public.taxonomy_release_memberships
for each row execute function public.guard_published_taxonomy_membership();

create index taxonomy_release_membership_lookup
  on public.taxonomy_release_memberships(record_type, record_id);
create index taxonomy_record_sources_lookup
  on public.taxonomy_record_sources(record_type, record_id);
create index competency_mastery_evidence_node
  on public.competency_mastery_evidence(node_id);
create index competency_progression_mapping_node
  on public.competency_progression_mappings(node_id, learner_mode, framework);

-- Reference data is readable to authenticated users only after it is approved or
-- published; staff retain authoring access. Source rights details stay staff-only.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'ontology_versions','taxonomy_sources','taxonomy_source_versions',
    'taxonomy_domains','taxonomy_clusters','competency_mastery_evidence',
    'competency_progression_mappings','taxonomy_record_sources',
    'taxonomy_releases','taxonomy_release_memberships'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for all using (public.is_staff()) with check (public.is_staff())',
      table_name || '_staff_write', table_name
    );
  end loop;
end $$;

create policy ontology_versions_authenticated_read on public.ontology_versions
  for select using (auth.uid() is not null and status = 'active');
create policy taxonomy_domains_authenticated_read on public.taxonomy_domains
  for select using (auth.uid() is not null);
create policy taxonomy_clusters_authenticated_read on public.taxonomy_clusters
  for select using (auth.uid() is not null);
create policy competency_mastery_evidence_authenticated_read on public.competency_mastery_evidence
  for select using (auth.uid() is not null and review_status = 'human_approved');
create policy competency_progression_mappings_authenticated_read on public.competency_progression_mappings
  for select using (auth.uid() is not null and mapping_status = 'reviewed');
create policy taxonomy_releases_authenticated_read on public.taxonomy_releases
  for select using (auth.uid() is not null and status in ('published','withdrawn'));
create policy taxonomy_release_memberships_authenticated_read on public.taxonomy_release_memberships
  for select using (
    auth.uid() is not null and exists (
      select 1 from public.taxonomy_releases r
      where r.id = release_id and r.status in ('published','withdrawn')
    )
  );

comment on table public.taxonomy_release_memberships is
  'Immutable snapshots make a published taxonomy reproducible even when authoring records evolve.';
comment on table public.taxonomy_source_versions is
  'Fail-closed source rights decisions; importable versions require recorded terms, fields, commercial permission, and approval.';
