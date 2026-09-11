-- Compare the relational bank under write-conflicting locks in the publication
-- transaction. Concurrent question/choice/membership edits cannot slip between
-- the trusted publisher's read-only preflight and publication.
begin;
create function public.verify_granular_bank_snapshot(p_bank_id uuid,p_taxonomy_id uuid,p_bank jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare
 entry jsonb; expected jsonb; stored competency_items%rowtype;
 member diagnostic_item_bank_memberships%rowtype;
 digest_hex text; v_expected_item_id uuid; expected_choices jsonb; actual_choices jsonb;
 item_count integer;
begin
 lock table competency_items,competency_item_choices,diagnostic_item_bank_memberships in share mode;
 if jsonb_typeof(p_bank->'items') is distinct from 'array' or jsonb_array_length(p_bank->'items')=0 then raise exception 'Empty canonical bank snapshot'; end if;
 select count(*) into item_count from diagnostic_item_bank_memberships where bank_release_id=p_bank_id;
 if item_count<>jsonb_array_length(p_bank->'items') then raise exception 'Canonical bank membership count mismatch'; end if;
 for entry in select value from jsonb_array_elements(p_bank->'items') loop
  expected:=entry->'item';
  digest_hex:=encode(sha256(convert_to('sigmawrite-diagnostic-item:'||(p_bank#>>'{bank,key}')||':'||(entry->>'itemKey'),'UTF8')),'hex');
  digest_hex:=overlay(substring(digest_hex from 1 for 32) placing '5' from 13 for 1);
  digest_hex:=overlay(digest_hex placing substring('89ab' from ((strpos('0123456789abcdef',substring(digest_hex from 17 for 1))-1)%4)+1 for 1) from 17 for 1);
  v_expected_item_id:=digest_hex::uuid;
  select * into member from diagnostic_item_bank_memberships where bank_release_id=p_bank_id and diagnostic_item_bank_memberships.item_id=v_expected_item_id;
  if not found then raise exception 'Canonical bank member missing: %',entry->>'itemKey'; end if;
  if not exists(select 1 from taxonomy_release_memberships where release_id=p_taxonomy_id and record_type='competency_node' and record_id=member.node_id and stable_key=expected->>'nodeKey')
   or not exists(select 1 from taxonomy_release_memberships where release_id=p_taxonomy_id and record_type='mastery_evidence' and record_id=member.mastery_evidence_id and stable_key=(expected->>'nodeKey')||':'||(entry->>'evidenceKey'))
   or member.section_key is distinct from entry->>'sectionKey'
   or member.evidence_expectation is distinct from entry->>'evidenceExpectation'
   or member.modality is distinct from expected->>'modality'
   or member.prompt_family is distinct from entry->>'promptFamily'
   or member.difficulty_tier is distinct from entry->>'difficultyTier'
   or member.difficulty is distinct from coalesce((expected->>'difficulty')::integer,50)
  then raise exception 'Canonical membership differs: %',entry->>'itemKey'; end if;
  select * into strict stored from competency_items where id=v_expected_item_id;
  if stored.primary_node_id is distinct from member.node_id
   or stored.strand is distinct from expected->>'strand'
   or stored.modality is distinct from expected->>'modality'
   or stored.learner_mode is distinct from expected->>'learnerMode'
   or stored.response_type is distinct from expected->>'responseType'
   or stored.prompt_fr is distinct from expected->>'promptFr'
   or stored.instructions_fr is distinct from expected->>'instructionsFr'
   or stored.correct_answer is distinct from expected->>'correctAnswer'
   or to_jsonb(coalesce(stored.acceptable_answers,'{}'::text[])) is distinct from coalesce(expected->'acceptableAnswers','[]'::jsonb)
   or stored.validator_type is distinct from expected->>'validatorType'
   or coalesce(stored.validator_config,'null'::jsonb) is distinct from coalesce(expected->'validatorConfig','null'::jsonb)
   or stored.difficulty is distinct from coalesce((expected->>'difficulty')::integer,50)
   or stored.cefr_level is distinct from expected->>'cefrLevel'
   or stored.qc_gates is distinct from entry->'qcGates'
   or stored.review_status is distinct from entry->>'reviewStatus'
   or stored.reviewer_profile_id is distinct from (entry#>>'{review,reviewerProfileId}')::uuid
   or stored.reviewed_at is distinct from (entry#>>'{review,reviewedAt}')::timestamptz
  then raise exception 'Canonical question differs: %',entry->>'itemKey'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('text',value->>'text','correct',(value->>'correct')::boolean,'position',ordinality-1,'feedback',value->>'feedbackFr') order by ordinality),'[]'::jsonb)
   into expected_choices from jsonb_array_elements(coalesce(expected->'choices','[]'::jsonb)) with ordinality;
  select coalesce(jsonb_agg(jsonb_build_object('text',choice_text,'correct',is_correct,'position',position,'feedback',feedback_fr) order by position),'[]'::jsonb)
   into actual_choices from competency_item_choices where competency_item_choices.item_id=v_expected_item_id;
  if actual_choices is distinct from expected_choices then raise exception 'Canonical answer choices differ: %',entry->>'itemKey'; end if;
 end loop;
end $$;
revoke all on function public.verify_granular_bank_snapshot(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.verify_granular_bank_snapshot(uuid,uuid,jsonb) to service_role;

create or replace function public.publish_granular_parallel_release(
 p_release_key text,p_bundle jsonb,p_bundle_checksum text,p_preflight jsonb,p_publisher uuid
) returns uuid language plpgsql security definer set search_path=public as $$
declare
 bank_row diagnostic_item_bank_releases%rowtype;
 taxonomy_row taxonomy_releases%rowtype;
 existing granular_assessment_releases%rowtype;
 result_id uuid; saved_proof jsonb;
begin
 if nullif(btrim(p_release_key),'') is null or jsonb_typeof(p_bundle) is distinct from 'object'
  or p_bundle_checksum !~ '^sha256:[a-f0-9]{64}$' or p_bundle_checksum is null
  or p_preflight->>'bundleChecksum' is distinct from p_bundle_checksum
  or p_bundle #>> '{assessment,reviewPolicy,mode}' is distinct from 'parallel_review'
 then raise exception 'Invalid granular publication request'; end if;
 if not exists(select 1 from profiles where id=p_publisher and role='platform_admin') then
  raise exception 'Granular publisher must be a platform administrator'; end if;
 select * into strict bank_row from diagnostic_item_bank_releases where id=(p_bundle->>'bankId')::uuid for update;
 select * into strict taxonomy_row from taxonomy_releases where id=(p_bundle->>'taxonomyId')::uuid for share;
 if bank_row.bank_key<>'french-diagnostic-bank-v3' or bank_row.status='withdrawn'
  or bank_row.taxonomy_release_id<>taxonomy_row.id or taxonomy_row.status<>'published'
  or bank_row.manifest_checksum is distinct from p_bundle #>> '{assessment,bankChecksum}'
  or taxonomy_row.manifest_checksum is distinct from p_bundle #>> '{assessment,taxonomyChecksum}'
 then raise exception 'Granular publication parent mismatch'; end if;
 perform public.verify_granular_bank_snapshot(bank_row.id,taxonomy_row.id,p_bundle->'bank');
 insert into granular_bank_publication_permissions(bank_release_id,bundle_checksum,bank_checksum,taxonomy_checksum,preflight)
 values(bank_row.id,p_bundle_checksum,bank_row.manifest_checksum,taxonomy_row.manifest_checksum,p_preflight)
 on conflict(bank_release_id,bundle_checksum) do nothing;
 select preflight into strict saved_proof from granular_bank_publication_permissions where bank_release_id=bank_row.id and bundle_checksum=p_bundle_checksum;
 if saved_proof is distinct from p_preflight then raise exception 'Granular publication proof conflict'; end if;
 if bank_row.status<>'published' then
  update diagnostic_item_bank_releases set status='published',published_by=p_publisher,published_at=now(),
   validation_report=jsonb_build_object('valid',true,'mode','parallel_review','canonicalApprovedReadiness',bank_row.validation_report,'bundleChecksum',p_bundle_checksum)
  where id=bank_row.id;
 end if;
 select * into existing from granular_assessment_releases where release_key=p_release_key for update;
 if found then
  if existing.status<>'published' or existing.content_checksum<>p_bundle_checksum or existing.bundle is distinct from p_bundle then
   raise exception 'Granular release key already has different content'; end if;
  return existing.id;
 end if;
 insert into granular_assessment_releases(release_key,taxonomy_release_id,bank_release_id,status,content_checksum,bundle)
 values(p_release_key,taxonomy_row.id,bank_row.id,'published',p_bundle_checksum,p_bundle) returning id into result_id;
 return result_id;
end $$;

commit;
