-- Calibrated reuse in the live recommendation path, followed by versioned
-- knowledge packets that may safely ground unavoidable generation.

alter table public.content_contract_profiles
  add column if not exists interest_key text,
  add column if not exists text_type text,
  add column if not exists empirical_session_count integer not null default 0
    check (empirical_session_count >= 0);

create table public.text_version_concepts (
  text_version_id uuid not null references public.text_versions(id) on delete cascade,
  concept_id uuid not null references public.knowledge_concepts(id) on delete cascade,
  source text not null check (source in ('human_confirmed','packet_grounding','interest_backfill')),
  confidence numeric not null check (confidence between 0 and 1),
  confirmed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (text_version_id, concept_id)
);
create index text_version_concepts_concept_idx
  on public.text_version_concepts(concept_id, text_version_id);

create table public.knowledge_concept_packets (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.knowledge_concepts(id) on delete cascade,
  version integer not null check (version > 0),
  status text not null default 'draft'
    check (status in ('draft','human_approved','rejected','retired')),
  explanation_fr text not null check (char_length(trim(explanation_fr)) >= 10),
  claims jsonb not null default '[]'::jsonb check (jsonb_typeof(claims) = 'array'),
  misconceptions jsonb not null default '[]'::jsonb check (jsonb_typeof(misconceptions) = 'array'),
  examples jsonb not null default '[]'::jsonb check (jsonb_typeof(examples) = 'array'),
  vocabulary jsonb not null default '[]'::jsonb check (jsonb_typeof(vocabulary) = 'array'),
  risk_class text not null check (risk_class in ('low','medium','high')),
  source_requirement text not null
    check (source_requirement in ('none','trusted_evergreen','current_primary_sources')),
  generation_provenance jsonb not null default '{}'::jsonb,
  review_after timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (concept_id, version),
  check (status <> 'human_approved' or reviewed_at is not null),
  check (source_requirement = 'none' or review_after is not null)
);
create unique index knowledge_concept_packets_one_approved_idx
  on public.knowledge_concept_packets(concept_id) where status = 'human_approved';
create index knowledge_concept_packets_lookup_idx
  on public.knowledge_concept_packets(concept_id, status, review_after);

create table public.knowledge_packet_sources (
  id uuid primary key default gen_random_uuid(),
  packet_id uuid not null references public.knowledge_concept_packets(id) on delete cascade,
  source_uri text not null,
  title text not null,
  publisher text not null,
  relationship text not null check (relationship in ('grounded_by','validated_by','updated_from')),
  is_primary boolean not null default false,
  published_at timestamptz,
  accessed_at timestamptz not null,
  content_checksum text,
  created_at timestamptz not null default now(),
  unique (packet_id, source_uri, relationship)
);

create or replace function public.guard_knowledge_packet_publication()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_concept public.knowledge_concepts;
begin
  select * into v_concept from public.knowledge_concepts where id = new.concept_id;
  if not found then raise exception 'knowledge_concept_not_found'; end if;

  if tg_op = 'UPDATE' and old.status = 'human_approved' then
    if new.status = 'retired'
      and new.concept_id = old.concept_id
      and new.version = old.version
      and new.explanation_fr = old.explanation_fr
      and new.claims = old.claims
      and new.misconceptions = old.misconceptions
      and new.examples = old.examples
      and new.vocabulary = old.vocabulary
      and new.risk_class = old.risk_class
      and new.source_requirement = old.source_requirement
      and new.generation_provenance = old.generation_provenance
      and new.review_after is not distinct from old.review_after
      and new.reviewed_by is not distinct from old.reviewed_by
      and new.reviewed_at is not distinct from old.reviewed_at
      and new.created_at = old.created_at
    then
      return new;
    end if;
    raise exception 'approved_knowledge_packet_is_immutable';
  end if;

  if new.status = 'human_approved' then
    if v_concept.review_status <> 'human_approved' then
      raise exception 'concept_requires_human_approval';
    end if;
    if new.risk_class <> v_concept.risk_class
      or new.source_requirement <> v_concept.source_requirement then
      raise exception 'packet_policy_must_match_concept';
    end if;
    if new.review_after is not null and new.review_after <= now() then
      raise exception 'knowledge_packet_review_is_expired';
    end if;
    if new.source_requirement <> 'none' and not exists (
      select 1 from public.knowledge_packet_sources s where s.packet_id = new.id
    ) then
      raise exception 'knowledge_packet_sources_required';
    end if;
    if new.source_requirement = 'current_primary_sources' then
      if new.review_after > now() + interval '90 days' then
        raise exception 'high_risk_packet_review_window_too_long';
      end if;
      if not exists (
        select 1 from public.knowledge_packet_sources s
        where s.packet_id = new.id and s.is_primary
          and s.accessed_at >= now() - interval '90 days'
      ) then
        raise exception 'current_primary_source_required';
      end if;
    end if;
  end if;
  return new;
end;
$$;
create trigger guard_knowledge_packet_publication
  before insert or update on public.knowledge_concept_packets
  for each row execute function public.guard_knowledge_packet_publication();

create or replace function public.ensure_knowledge_packet_draft()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.knowledge_concept_packets(
    concept_id, version, status, explanation_fr, risk_class,
    source_requirement, generation_provenance, review_after
  ) values (
    new.id, 1, 'draft',
    coalesce(nullif(trim(new.description_fr), ''), new.label_fr || ' est une notion à documenter.'),
    new.risk_class, new.source_requirement,
    jsonb_build_object('kind','concept_draft_bootstrap'),
    case when new.source_requirement = 'none' then null else now() + interval '30 days' end
  )
  on conflict (concept_id, version) do update set
    risk_class = excluded.risk_class,
    source_requirement = excluded.source_requirement,
    review_after = excluded.review_after
  where knowledge_concept_packets.status = 'draft';
  return new;
end;
$$;
create trigger ensure_knowledge_packet_draft
  after insert or update of risk_class, source_requirement on public.knowledge_concepts
  for each row execute function public.ensure_knowledge_packet_draft();

-- Existing human-approved, source-free descriptions are safe starter packets.
-- Concepts requiring sources remain drafts until their evidence is attached and
-- an editor explicitly approves the packet.
insert into public.knowledge_concept_packets(
  concept_id, version, status, explanation_fr, risk_class, source_requirement,
  generation_provenance, review_after, reviewed_at
)
select c.id, 1,
  case when c.review_status = 'human_approved' and c.source_requirement = 'none'
    then 'human_approved' else 'draft' end,
  coalesce(nullif(trim(c.description_fr), ''), c.label_fr || ' est une notion à documenter.'),
  c.risk_class, c.source_requirement,
  jsonb_build_object('kind','migrated_concept_description','conceptReviewStatus',c.review_status),
  case when c.source_requirement = 'none' then null else now() + interval '30 days' end,
  case when c.review_status = 'human_approved' and c.source_requirement = 'none' then now() else null end
from public.knowledge_concepts c
on conflict (concept_id, version) do nothing;

create table public.content_reuse_policies (
  id uuid primary key default gen_random_uuid(),
  policy_key text not null,
  version integer not null check (version > 0),
  mode text not null check (mode in ('off','shadow','live')),
  minimum_score numeric not null check (minimum_score between 0 and 1),
  recent_exclusion_days integer not null check (recent_exclusion_days between 0 and 365),
  maximum_candidates integer not null check (maximum_candidates between 1 and 100),
  minimum_calibration_observations integer not null check (minimum_calibration_observations > 0),
  minimum_completion_rate numeric not null check (minimum_completion_rate between 0 and 1),
  minimum_average_success numeric not null check (minimum_average_success between 0 and 1),
  weights jsonb not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (policy_key, version)
);
create unique index content_reuse_one_active_policy_idx
  on public.content_reuse_policies(policy_key) where active;
insert into public.content_reuse_policies(
  policy_key, version, mode, minimum_score, recent_exclusion_days,
  maximum_candidates, minimum_calibration_observations,
  minimum_completion_rate, minimum_average_success, weights, active
) values (
  'student_reading_recommendation', 1, 'shadow', .78, 30, 10, 100, .70, .75,
  '{"competencies":0.28,"constructions":0.16,"tenses":0.16,"concepts":0.10,"difficulty":0.16,"lexical":0.09,"topic":0.05}'::jsonb,
  true
);

create table public.content_reuse_observations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  policy_id uuid not null references public.content_reuse_policies(id) on delete restrict,
  request_key text not null,
  mode text not null check (mode in ('shadow','live')),
  decision text not null check (decision in ('reuse','generate')),
  matched_text_version_id uuid references public.text_versions(id) on delete restrict,
  score numeric check (score between 0 and 1),
  recommended_text_version_ids uuid[] not null,
  baseline_text_version_ids uuid[] not null,
  ranked_candidates jsonb not null,
  excluded_candidates jsonb not null,
  request_snapshot jsonb not null,
  policy_snapshot jsonb not null,
  matcher_version text not null,
  latency_ms integer not null check (latency_ms >= 0),
  created_at timestamptz not null default now(),
  unique (student_id, request_key),
  check ((decision = 'reuse') = (matched_text_version_id is not null)),
  check (cardinality(recommended_text_version_ids) > 0)
);
create index content_reuse_observations_student_created_idx
  on public.content_reuse_observations(student_id, created_at desc);
create index content_reuse_observations_score_idx
  on public.content_reuse_observations(policy_id, score) where decision = 'reuse';

alter table public.reading_sessions
  add column if not exists reuse_observation_id uuid
    references public.content_reuse_observations(id) on delete set null;
create unique index reading_sessions_reuse_observation_idx
  on public.reading_sessions(reuse_observation_id) where reuse_observation_id is not null;

create or replace function public.bind_reading_session_reuse_observation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.reuse_observation_id is null then
    select o.id into new.reuse_observation_id
    from public.content_reuse_observations o
    where o.student_id = new.student_id
      and new.text_version_id = any(o.recommended_text_version_ids)
      and o.created_at >= new.started_at - interval '2 hours'
      and o.created_at <= new.started_at + interval '5 minutes'
      and not exists (
        select 1 from public.reading_sessions r where r.reuse_observation_id = o.id
      )
    order by o.created_at desc
    limit 1;
  end if;
  return new;
end;
$$;
create trigger bind_reading_session_reuse_observation
  before insert on public.reading_sessions
  for each row execute function public.bind_reading_session_reuse_observation();

create or replace view public.content_reuse_calibration_outcomes
with (security_invoker = true)
as
select
  o.id as observation_id,
  o.policy_id,
  o.mode,
  o.decision,
  o.score,
  o.matched_text_version_id,
  r.id as reading_session_id,
  (r.text_version_id = o.matched_text_version_id) as matched_text_chosen,
  (r.completed_at is not null) as completed,
  r.abandoned,
  r.success_rate,
  r.time_on_task_seconds,
  o.created_at
from public.content_reuse_observations o
left join public.reading_sessions r on r.reuse_observation_id = o.id;

create or replace function public.get_published_knowledge_packets(
  p_interest_key text,
  p_concept_terms text[] default '{}'
)
returns table(
  packet_id uuid,
  concept_id uuid,
  concept_key text,
  label_fr text,
  risk_class text,
  source_requirement text,
  explanation_fr text,
  claims jsonb,
  misconceptions jsonb,
  examples jsonb,
  vocabulary jsonb,
  reviewed_at timestamptz,
  review_after timestamptz,
  sources jsonb
)
language sql
stable
set search_path = public
as $$
  with requested as (
    select distinct c.id,
      coalesce(ic.relevance, 0) as relevance
    from public.knowledge_concepts c
    left join public.interest_concepts ic
      on ic.concept_id = c.id and ic.interest_key = p_interest_key
    where ic.concept_id is not null
      or c.concept_key = any(coalesce(p_concept_terms, '{}'::text[]))
      or lower(c.label_fr) = any(
        select lower(trim(term)) from unnest(coalesce(p_concept_terms, '{}'::text[])) term
      )
      or exists (
        select 1 from public.topic_aliases a
        where a.concept_id = c.id
          and a.normalized_alias = any(
            select lower(trim(term)) from unnest(coalesce(p_concept_terms, '{}'::text[])) term
          )
      )
  )
  select p.id, c.id, c.concept_key, c.label_fr, p.risk_class,
    p.source_requirement, p.explanation_fr, p.claims, p.misconceptions,
    p.examples, p.vocabulary, p.reviewed_at, p.review_after,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'uri', s.source_uri,
        'title', s.title,
        'publisher', s.publisher,
        'relationship', s.relationship,
        'isPrimary', s.is_primary,
        'publishedAt', s.published_at,
        'accessedAt', s.accessed_at,
        'checksum', s.content_checksum
      ) order by s.is_primary desc, s.accessed_at desc)
      from public.knowledge_packet_sources s where s.packet_id = p.id
    ), '[]'::jsonb)
  from requested r
  join public.knowledge_concepts c on c.id = r.id
  join public.knowledge_concept_packets p on p.concept_id = c.id
  where p.status = 'human_approved'
    and (p.review_after is null or p.review_after > now())
  order by r.relevance desc, c.concept_key;
$$;

create or replace function public.refresh_content_contract_profile(p_text_version_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_version public.text_versions;
  v_text public.texts;
  v_taxonomy_release_id uuid;
  v_lexical_release_id uuid;
  v_competency_ids uuid[] := '{}';
  v_construction_ids uuid[] := '{}';
  v_tense_keys text[] := '{}';
  v_concept_ids uuid[] := '{}';
  v_risk_class text := 'low';
  v_source_verified boolean := true;
  v_session_count integer := 0;
  v_predicted_success numeric := .8;
begin
  select * into v_version from public.text_versions where id = p_text_version_id;
  if not found then return false; end if;
  select * into v_text from public.texts where id = v_version.text_id;
  if v_version.review_status not in ('human_approved','benchmark_locked')
    or v_text.status <> 'active' then
    delete from public.content_contract_profiles where text_version_id = p_text_version_id;
    return false;
  end if;

  select id into v_taxonomy_release_id from public.taxonomy_releases
  where status = 'published' order by published_at desc nulls last, created_at desc limit 1;
  select id into v_lexical_release_id from public.lexical_releases
  where status = 'published' order by published_at desc nulls last, created_at desc limit 1;
  if v_taxonomy_release_id is null or v_lexical_release_id is null then return false; end if;

  select coalesce(array_agg(n.id order by n.id), '{}'),
    coalesce(array_agg(n.id order by n.id) filter (where n.strand = 'grammaire_syntaxe'), '{}'),
    coalesce(array_agg(n.key order by n.key) filter (where n.strand = 'conjugaison'), '{}')
  into v_competency_ids, v_construction_ids, v_tense_keys
  from public.text_version_nodes tvn
  join public.competency_nodes n on n.id = tvn.node_id
  where tvn.text_version_id = p_text_version_id;

  select coalesce(array_agg(c.id order by c.id), '{}'),
    coalesce((array_agg(c.risk_class order by case c.risk_class when 'high' then 3 when 'medium' then 2 else 1 end desc))[1], 'low'),
    coalesce(bool_and(
      c.source_requirement = 'none' or exists (
        select 1 from public.knowledge_concept_packets p
        where p.concept_id = c.id and p.status = 'human_approved'
          and (p.review_after is null or p.review_after > now())
          and exists (select 1 from public.knowledge_packet_sources s where s.packet_id = p.id)
      )
    ), true)
  into v_concept_ids, v_risk_class, v_source_verified
  from public.text_version_concepts tvc
  join public.knowledge_concepts c on c.id = tvc.concept_id
  where tvc.text_version_id = p_text_version_id;

  select count(*)::integer,
    coalesce(avg(success_rate) filter (where completed_at is not null and not abandoned), .8)
  into v_session_count, v_predicted_success
  from public.reading_sessions where text_version_id = p_text_version_id;
  if v_session_count < 10 then v_predicted_success := .8; end if;
  v_predicted_success := greatest(0, least(1, v_predicted_success));

  insert into public.content_contract_profiles(
    text_version_id, taxonomy_release_id, lexical_release_id, qa_status,
    predicted_success, known_vocabulary_coverage, word_count,
    competency_ids, construction_ids, tense_keys, concept_ids, risk_class,
    source_verified, profile_payload, interest_key, text_type,
    empirical_session_count, updated_at
  ) values (
    p_text_version_id, v_taxonomy_release_id, v_lexical_release_id, 'passed',
    v_predicted_success, .8, coalesce(v_version.word_count, array_length(regexp_split_to_array(trim(v_version.body), '\s+'), 1), 1),
    v_competency_ids, v_construction_ids, v_tense_keys, v_concept_ids,
    v_risk_class, v_source_verified,
    jsonb_build_object(
      'version','calibrated-reuse-v1',
      'empiricalSessionCount',v_session_count,
      'predictedSuccessSemantics',case when v_session_count >= 10 then 'observed_mean_success' else 'cold_start_prior' end,
      'knownVocabularyCoverageSemantics','request_adapter_must_override'
    ),
    v_text.primary_interest, v_version.text_type, v_session_count, now()
  )
  on conflict (text_version_id) do update set
    taxonomy_release_id = excluded.taxonomy_release_id,
    lexical_release_id = excluded.lexical_release_id,
    qa_status = excluded.qa_status,
    predicted_success = excluded.predicted_success,
    word_count = excluded.word_count,
    competency_ids = excluded.competency_ids,
    construction_ids = excluded.construction_ids,
    tense_keys = excluded.tense_keys,
    concept_ids = excluded.concept_ids,
    risk_class = excluded.risk_class,
    source_verified = excluded.source_verified,
    profile_payload = excluded.profile_payload,
    interest_key = excluded.interest_key,
    text_type = excluded.text_type,
    empirical_session_count = excluded.empirical_session_count,
    updated_at = now();
  return true;
end;
$$;
revoke all on function public.refresh_content_contract_profile(uuid) from public;
grant execute on function public.refresh_content_contract_profile(uuid) to service_role;

create or replace function public.refresh_all_content_contract_profiles()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare r record; refreshed integer := 0;
begin
  if auth.role() <> 'service_role' and not public.is_platform_admin() then
    raise exception 'platform_admin_required' using errcode = '42501';
  end if;
  for r in select tv.id from public.text_versions tv loop
    if public.refresh_content_contract_profile(r.id) then refreshed := refreshed + 1; end if;
  end loop;
  return refreshed;
end;
$$;
revoke all on function public.refresh_all_content_contract_profiles() from public;
grant execute on function public.refresh_all_content_contract_profiles() to authenticated, service_role;

create or replace function public.refresh_profile_after_content_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'texts' then
    perform public.refresh_content_contract_profile(tv.id)
    from public.text_versions tv where tv.text_id = new.id;
  elsif tg_table_name = 'text_versions' then
    perform public.refresh_content_contract_profile(new.id);
  elsif tg_table_name = 'reading_sessions' then
    if new.completed_at is not null and old.completed_at is null then
      perform public.refresh_content_contract_profile(new.text_version_id);
    end if;
  else
    perform public.refresh_content_contract_profile(new.text_version_id);
  end if;
  return new;
end;
$$;
create trigger refresh_profile_after_text_status
  after update of status on public.texts
  for each row when (new.status is distinct from old.status)
  execute function public.refresh_profile_after_content_change();
create trigger refresh_profile_after_version_status
  after update of review_status on public.text_versions
  for each row when (new.review_status is distinct from old.review_status)
  execute function public.refresh_profile_after_content_change();
create trigger refresh_profile_after_node_link
  after insert or update on public.text_version_nodes
  for each row execute function public.refresh_profile_after_content_change();
create trigger refresh_profile_after_concept_link
  after insert or update on public.text_version_concepts
  for each row execute function public.refresh_profile_after_content_change();
create trigger refresh_profile_after_reading_outcome
  after update of completed_at on public.reading_sessions
  for each row when (new.completed_at is not null and old.completed_at is null)
  execute function public.refresh_profile_after_content_change();

-- Give existing approved texts a conservative concept mapping so profiles are
-- immediately useful. New publications use exact packet-grounding links.
insert into public.text_version_concepts(text_version_id, concept_id, source, confidence)
select tv.id, ic.concept_id, 'interest_backfill', ic.relevance
from public.text_versions tv
join public.texts t on t.id = tv.text_id
join public.interest_concepts ic on ic.interest_key = t.primary_interest
where tv.review_status in ('human_approved','benchmark_locked') and t.status = 'active'
on conflict do nothing;

do $$ declare r record; begin
  for r in select tv.id from public.text_versions tv loop
    perform public.refresh_content_contract_profile(r.id);
  end loop;
end $$;

alter table public.text_version_concepts enable row level security;
alter table public.knowledge_concept_packets enable row level security;
alter table public.knowledge_packet_sources enable row level security;
alter table public.content_reuse_policies enable row level security;
alter table public.content_reuse_observations enable row level security;

create policy text_version_concepts_read on public.text_version_concepts
  for select using (auth.uid() is not null);
create policy text_version_concepts_staff_write on public.text_version_concepts
  for all using (public.is_staff()) with check (public.is_staff());
create policy knowledge_packets_published_read on public.knowledge_concept_packets
  for select using (
    (status = 'human_approved' and (review_after is null or review_after > now()))
    or public.is_staff()
  );
create policy knowledge_packets_staff_write on public.knowledge_concept_packets
  for all using (public.is_staff()) with check (public.is_staff());
create policy knowledge_packet_sources_published_read on public.knowledge_packet_sources
  for select using (exists (
    select 1 from public.knowledge_concept_packets p where p.id = packet_id
      and ((p.status = 'human_approved' and (p.review_after is null or p.review_after > now())) or public.is_staff())
  ));
create policy knowledge_packet_sources_staff_write on public.knowledge_packet_sources
  for all using (public.is_staff()) with check (public.is_staff());
create policy content_reuse_policies_staff_read on public.content_reuse_policies
  for select using (public.is_staff());
create policy content_reuse_observations_staff_read on public.content_reuse_observations
  for select using (public.is_staff());

grant select on public.text_version_concepts, public.knowledge_concept_packets,
  public.knowledge_packet_sources to authenticated;
grant select on public.content_reuse_policies, public.content_reuse_observations,
  public.content_reuse_calibration_outcomes to authenticated;
grant execute on function public.get_published_knowledge_packets(text,text[]) to authenticated, service_role;

comment on table public.content_reuse_observations is
  'Shadow/live matcher decisions tied to subsequent reading outcomes for threshold calibration.';
comment on column public.content_contract_profiles.known_vocabulary_coverage is
  'Catalog prior only; the runtime adapter replaces it with per-student vocabulary coverage before matching.';
comment on table public.knowledge_concept_packets is
  'Versioned reviewed grounding bodies. Only approved, unexpired packets may enter generation prompts.';
