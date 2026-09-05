-- Contract-profile evidence counts must use the same eligible-outcome
-- definition as reuse calibration: completed, non-abandoned reading sessions.

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

  select count(*) filter (where completed_at is not null and not abandoned)::integer,
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

do $$
declare r record;
begin
  for r in select tv.id from public.text_versions tv loop
    perform public.refresh_content_contract_profile(r.id);
  end loop;
end;
$$;
