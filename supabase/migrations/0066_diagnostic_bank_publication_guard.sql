-- A release row must not be publishable by bypassing the artifact importer.
-- The database independently verifies the frozen bank's coverage, reviewer
-- provenance, live validator support, and publication metadata.

begin;

create or replace function public.diagnostic_item_is_release_approved(
  p_item_id uuid
) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    item.validator_type in ('exact','regex','conjugator')
    and item.qc_gates is not null
    and coalesce(item.qc_gates->>'verdict','') <> 'rejected'
    and coalesce((item.qc_gates->>'gate1_schema')::boolean,false)
    and coalesce(
      (item.qc_gates->'gate1_invariants'->>'ok')::boolean,
      false
    )
    and coalesce(
      (item.qc_gates->'gate2_answer_key'->>'ok')::boolean,
      false
    )
    and (
      (
        item.review_status='human_approved'
        and item.reviewer_profile_id is not null
        and item.reviewed_at is not null
        and exists(
          select 1 from public.profiles reviewer
          where reviewer.id=item.reviewer_profile_id
            and (
              reviewer.role='platform_admin'
              or (
                reviewer.role='content_reviewer'
                and exists(
                  select 1
                  from public.content_reviewer_profiles reviewer_state
                  where reviewer_state.profile_id=reviewer.id
                    and reviewer_state.active
                    and reviewer_state.invite_status='active'
                )
              )
            )
        )
      )
      or (
        item.review_status='auto_approved'
        and item.validator_type='conjugator'
        and nullif(btrim(item.validator_config->>'verb'),'') is not null
        and nullif(btrim(item.validator_config->>'tense'),'') is not null
        and nullif(btrim(item.validator_config->>'person'),'') is not null
        and nullif(btrim(item.correct_answer),'') is not null
        and coalesce(
          (item.qc_gates->'gate0_computed'->>'applied')::boolean,
          false
        )
        and item.qc_gates->'gate0_computed'->>'correctedAnswer'
          = item.correct_answer
        and item.qc_gates->>'verdict'='auto_approved'
      )
    )
  ),false)
  from public.competency_items item
  where item.id=p_item_id
$$;

revoke all on function public.diagnostic_item_is_release_approved(uuid)
  from public,anon,authenticated;

comment on function public.diagnostic_item_is_release_approved(uuid) is
  'True only for live-validator items with attributable human approval or a SQL-verifiable deterministic conjugator gate.';

-- Readiness describes whether a mutable draft/validating bank can be
-- published. Student launch separately selects status=published before calling
-- this function, avoiding the old circular requirement that a bank already be
-- published before its publication guard could evaluate it.
create or replace function public.diagnostic_bank_readiness(
  p_taxonomy_release_id uuid,
  p_bank_release_id uuid
) returns jsonb
language sql stable security definer set search_path = public as $$
with configs(section_key,min_nodes,min_items,min_production) as (
  values
    ('reading_comprehension',6,8,2),
    ('grammar',6,8,2),
    ('spelling',6,8,4),
    ('conjugation',6,8,4)
), target_nodes as (
  select node.id,public.diagnostic_section_for_strand(coalesce(
    taxonomy_membership.record_snapshot->>'strand',node.strand
  )) section_key
  from public.taxonomy_release_memberships taxonomy_membership
  join public.competency_nodes node on node.id=taxonomy_membership.record_id
  where taxonomy_membership.release_id=p_taxonomy_release_id
    and taxonomy_membership.record_type='competency_node'
    and node.review_status in ('auto_approved','human_approved')
), required_expectations as (
  select distinct target.id node_id,evidence.id mastery_evidence_id,
    coalesce(
      evidence_membership.record_snapshot->>'expectation',
      evidence.expectation
    ) expectation,
    greatest(2,coalesce(
      nullif(
        evidence_membership.record_snapshot
          ->'successCriteria'->>'minimumDistinctItems',''
      )::int,
      evidence.minimum_distinct_items
    )) required_distinct_items,
    greatest(2,coalesce(
      nullif(
        evidence_membership.record_snapshot
          ->'successCriteria'->>'minimumOccasions',''
      )::int,
      evidence.minimum_occasions
    )) required_occasions
  from target_nodes target
  join public.taxonomy_release_memberships evidence_membership
    on evidence_membership.release_id=p_taxonomy_release_id
    and evidence_membership.record_type='mastery_evidence'
  join public.competency_mastery_evidence evidence
    on evidence.id=evidence_membership.record_id
    and evidence.node_id=target.id
  where coalesce(
    evidence_membership.record_snapshot->>'expectation',
    evidence.expectation
  ) in ('receptive','controlled_production')
), eligible_bank_items as (
  select membership.node_id,membership.item_id,
    membership.mastery_evidence_id,membership.evidence_expectation,
    membership.prompt_family,membership.difficulty_tier
  from public.diagnostic_item_bank_memberships membership
  join public.competency_items item on item.id=membership.item_id
  join public.taxonomy_release_memberships evidence_membership
    on evidence_membership.release_id=p_taxonomy_release_id
    and evidence_membership.record_type='mastery_evidence'
    and evidence_membership.record_id=membership.mastery_evidence_id
  where membership.bank_release_id=p_bank_release_id
    and membership.evidence_expectation in (
      'receptive','controlled_production'
    )
    and membership.evidence_expectation=coalesce(
      evidence_membership.record_snapshot->>'expectation',
      membership.evidence_expectation
    )
    and (
      membership.evidence_expectation<>'controlled_production'
      or item.response_type in ('short_answer','cloze','transform')
    )
    and public.diagnostic_item_is_release_approved(membership.item_id)
), expectation_item_stats as (
  select target.section_key,target.id node_id,
    required.mastery_evidence_id,required.expectation,
    required.required_distinct_items,required.required_occasions,
    count(distinct eligible.item_id)::int item_count
  from target_nodes target
  join required_expectations required on required.node_id=target.id
  left join eligible_bank_items eligible
    on eligible.node_id=target.id
    and eligible.mastery_evidence_id=required.mastery_evidence_id
    and eligible.evidence_expectation=required.expectation
  group by target.section_key,target.id,required.mastery_evidence_id,
    required.expectation,required.required_distinct_items,
    required.required_occasions
), node_item_stats as (
  select target.section_key,target.id node_id,
    count(distinct required.mastery_evidence_id)::int required_evidence_count,
    coalesce(bool_and(
      expectation_stats.item_count>=greatest(
        expectation_stats.required_distinct_items,
        expectation_stats.required_occasions
      )
    ),false) evidence_confirmable
  from target_nodes target
  left join required_expectations required on required.node_id=target.id
  left join expectation_item_stats expectation_stats
    on expectation_stats.node_id=target.id
    and expectation_stats.mastery_evidence_id=required.mastery_evidence_id
    and expectation_stats.expectation=required.expectation
  group by target.section_key,target.id
), section_stats as (
  select config.section_key,config.min_nodes,config.min_items,
    config.min_production,
    count(distinct target.id)::int target_node_count,
    count(distinct eligible.node_id)::int nodes_with_items,
    count(distinct eligible.item_id)::int approved_item_count,
    count(distinct node_stats.node_id) filter (
      where node_stats.required_evidence_count>0
        and node_stats.evidence_confirmable
    )::int confirmable_node_count,
    count(distinct eligible.item_id) filter (
      where eligible.evidence_expectation='controlled_production'
    )::int production_item_count,
    count(distinct eligible.prompt_family)::int prompt_family_count,
    count(distinct eligible.difficulty_tier)::int difficulty_tier_count
  from configs config
  left join target_nodes target on target.section_key=config.section_key
  left join node_item_stats node_stats on node_stats.node_id=target.id
  left join eligible_bank_items eligible on eligible.node_id=target.id
  group by config.section_key,config.min_nodes,config.min_items,
    config.min_production
), validity as (
  select *,target_node_count>=min_nodes and nodes_with_items>=min_nodes
    and approved_item_count>=min_items and confirmable_node_count>=2
    and production_item_count>=min_production
    and prompt_family_count>=2 and difficulty_tier_count>=2 as ready
  from section_stats
), release_validity as (
  select
    exists(
      select 1
      from public.diagnostic_item_bank_releases bank
      join public.taxonomy_releases taxonomy
        on taxonomy.id=bank.taxonomy_release_id
      where bank.id=p_bank_release_id
        and bank.taxonomy_release_id=p_taxonomy_release_id
        and bank.status in ('draft','validating','published')
        and taxonomy.status='published'
    ) release_exists,
    not exists(
      select 1
      from public.diagnostic_item_bank_memberships membership
      join public.competency_items item on item.id=membership.item_id
      where membership.bank_release_id=p_bank_release_id
        and (
          not public.diagnostic_item_is_release_approved(
            membership.item_id
          )
          or (
            membership.evidence_expectation='controlled_production'
            and item.response_type not in (
              'short_answer','cloze','transform'
            )
          )
        )
    ) all_memberships_approved
)
select jsonb_build_object(
  'ready',coalesce(bool_and(validity.ready),false)
    and release_validity.release_exists
    and release_validity.all_memberships_approved,
  'sections',jsonb_agg(jsonb_build_object(
    'key',section_key,'targetNodeCount',target_node_count,
    'nodesWithItems',nodes_with_items,
    'approvedItemCount',approved_item_count,
    'confirmableNodeCount',confirmable_node_count,
    'productionItemCount',production_item_count,
    'promptFamilyCount',prompt_family_count,
    'difficultyTierCount',difficulty_tier_count,'ready',ready
  ) order by case section_key
    when 'reading_comprehension' then 1
    when 'grammar' then 2 when 'spelling' then 3 else 4 end)
) from validity cross join release_validity
group by release_validity.release_exists,
  release_validity.all_memberships_approved
$$;

revoke all on function public.diagnostic_bank_readiness(uuid,uuid)
  from public;
grant execute on function public.diagnostic_bank_readiness(uuid,uuid)
  to authenticated,service_role;

create or replace function public.guard_diagnostic_bank_publication()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_readiness jsonb;
begin
  -- Memberships cannot exist until their release row exists, so an insert
  -- cannot possibly prove bank readiness. Force every publication through a
  -- mutable draft/validating row and the fully guarded UPDATE transition.
  if tg_op='INSERT' then
    if new.status='published' then
      raise exception 'diagnostic_bank_must_publish_from_mutable_release';
    end if;
    return new;
  end if;

  -- Existing published/withdrawn rows remain governed by the original
  -- immutability trigger, including the one permitted withdrawal transition.
  if old.status not in ('published','withdrawn')
    and new.status='published'
  then
    if jsonb_typeof(new.manifest) is distinct from 'object'
      or new.manifest='{}'::jsonb
      or nullif(btrim(new.manifest_checksum),'') is null
      or nullif(btrim(new.manifest->>'checksum'),'') is null
      or new.manifest->>'checksum' is distinct from new.manifest_checksum
      or new.published_by is null
      or new.published_at is null
    then
      raise exception 'diagnostic_bank_publication_metadata_incomplete';
    end if;

    if jsonb_typeof(new.validation_report) is distinct from 'object'
      or not coalesce(
        new.validation_report @> '{"valid":true}'::jsonb,
        false
      )
    then
      raise exception 'diagnostic_bank_validation_failed';
    end if;

    if not exists(
      select 1 from public.taxonomy_releases taxonomy
      where taxonomy.id=new.taxonomy_release_id
        and taxonomy.status='published'
    ) then
      raise exception 'diagnostic_bank_taxonomy_not_published';
    end if;

    if exists(
      select 1
      from public.diagnostic_item_bank_memberships membership
      join public.competency_items item on item.id=membership.item_id
      where membership.bank_release_id=old.id
        and (
          not public.diagnostic_item_is_release_approved(
            membership.item_id
          )
          or (
            membership.evidence_expectation='controlled_production'
            and item.response_type not in (
              'short_answer','cloze','transform'
            )
          )
        )
    ) then
      raise exception 'diagnostic_bank_contains_unapproved_items';
    end if;

    v_readiness:=public.diagnostic_bank_readiness(
      new.taxonomy_release_id,old.id
    );
    if not coalesce((v_readiness->>'ready')::boolean,false) then
      raise exception 'diagnostic_bank_not_ready';
    end if;
  end if;

  return new;
end
$$;

revoke all on function public.guard_diagnostic_bank_publication()
  from public,anon,authenticated;

drop trigger if exists diagnostic_bank_publication_guard
  on public.diagnostic_item_bank_releases;
create trigger diagnostic_bank_publication_guard
before insert or update on public.diagnostic_item_bank_releases
for each row execute function public.guard_diagnostic_bank_publication();

comment on function public.guard_diagnostic_bank_publication() is
  'Fail-closed transition guard for publishing immutable diagnostic item banks.';

commit;
