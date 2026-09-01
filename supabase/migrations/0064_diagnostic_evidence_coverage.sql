-- A node is confirmed only when the run has sampled every live evidence
-- expectation required by its pinned taxonomy. Repeating recognition questions
-- cannot stand in for controlled production, even when the item bank is sparse.

alter table public.diagnostic_node_results
  add column evidence_expectations text[] not null default '{}',
  add column evidence_coverage_confirmed boolean not null default false;

alter table public.diagnostic_node_results
  add constraint diagnostic_node_results_evidence_expectations_check check (
    evidence_expectations <@ array[
      'receptive','controlled_production','independent_production'
    ]::text[]
  );

create table public.diagnostic_node_evidence_results (
  run_id uuid not null references public.diagnostic_runs(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  node_id uuid not null references public.competency_nodes(id) on delete restrict,
  mastery_evidence_id uuid not null references public.competency_mastery_evidence(id) on delete restrict,
  evidence_expectation text not null check (evidence_expectation in (
    'receptive','controlled_production'
  )),
  mastery_probability numeric not null check (mastery_probability between 0 and 1),
  uncertainty numeric not null check (uncertainty between 0 and 1),
  direct_evidence_count integer not null default 0 check (direct_evidence_count>=0),
  correct_evidence_count integer not null default 0 check (
    correct_evidence_count>=0 and correct_evidence_count<=direct_evidence_count
  ),
  observed_accuracy numeric not null default 0 check (observed_accuracy between 0 and 1),
  distinct_item_count integer not null default 0 check (distinct_item_count>=0),
  occasion_count integer not null default 0 check (occasion_count>=0),
  observed_item_ids uuid[] not null default '{}',
  required_distinct_items integer not null check (required_distinct_items>=2),
  required_occasions integer not null check (required_occasions>=2),
  required_accuracy numeric not null check (required_accuracy between 0 and 1),
  classification text not null check (classification in (
    'mastered','fragile','missing','unknown'
  )),
  updated_at timestamptz not null default now(),
  primary key (run_id,node_id,mastery_evidence_id)
);

alter table public.diagnostic_node_evidence_results enable row level security;
create policy diagnostic_node_evidence_results_select
  on public.diagnostic_node_evidence_results
  for select using (public.can_view_student(student_id));
grant select on public.diagnostic_node_evidence_results to authenticated;

create index diagnostic_node_evidence_results_run
  on public.diagnostic_node_evidence_results(run_id,evidence_expectation,classification);

comment on column public.diagnostic_node_results.evidence_expectations is
  'Distinct evidence expectations directly observed in this run; this is evidence received, not the taxonomy requirement.';
comment on column public.diagnostic_node_results.evidence_coverage_confirmed is
  'True only after every live mastery-evidence definition in the pinned taxonomy meets its own distinct-item and occasion quotas.';
comment on table public.diagnostic_node_evidence_results is
  'Run-local BKT posterior and sufficiency ledger per pinned mastery-evidence definition; repeated recognition cannot mask weak or absent production.';
comment on column public.diagnostic_node_evidence_results.occasion_count is
  'Launch rule: each distinct, idempotently accepted answered run item is one assessment occasion inside the initial diagnostic.';
comment on column public.diagnostic_node_evidence_results.distinct_item_count is
  'Count of distinct pinned item IDs in observed_item_ids; evaluated separately from assessment occasions.';

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
    coalesce(evidence_membership.record_snapshot->>'expectation',evidence.expectation) expectation,
    greatest(2,coalesce(
      nullif(evidence_membership.record_snapshot->'successCriteria'->>'minimumDistinctItems','')::int,
      evidence.minimum_distinct_items
    )) required_distinct_items,
    greatest(2,coalesce(
      nullif(evidence_membership.record_snapshot->'successCriteria'->>'minimumOccasions','')::int,
      evidence.minimum_occasions
    )) required_occasions
  from target_nodes target
  join public.taxonomy_release_memberships evidence_membership
    on evidence_membership.release_id=p_taxonomy_release_id
    and evidence_membership.record_type='mastery_evidence'
  join public.competency_mastery_evidence evidence
    on evidence.id=evidence_membership.record_id and evidence.node_id=target.id
  where coalesce(evidence_membership.record_snapshot->>'expectation',evidence.expectation)
    in ('receptive','controlled_production')
), eligible_bank_items as (
  select membership.node_id,membership.item_id,membership.mastery_evidence_id,
    membership.evidence_expectation,
    membership.prompt_family,membership.difficulty_tier
  from public.diagnostic_item_bank_memberships membership
  join public.competency_items item on item.id=membership.item_id
  join public.taxonomy_release_memberships evidence_membership
    on evidence_membership.release_id=p_taxonomy_release_id
    and evidence_membership.record_type='mastery_evidence'
    and evidence_membership.record_id=membership.mastery_evidence_id
  where membership.bank_release_id=p_bank_release_id
    and membership.evidence_expectation in ('receptive','controlled_production')
    and membership.evidence_expectation=coalesce(
      evidence_membership.record_snapshot->>'expectation',membership.evidence_expectation
    )
    and (item.review_status='human_approved'
      or (item.review_status='auto_approved' and item.validator_type='conjugator'
        and coalesce((item.qc_gates->'gate0_computed'->>'applied')::boolean,false)))
), expectation_item_stats as (
  select target.section_key,target.id node_id,required.mastery_evidence_id,
    required.expectation,required.required_distinct_items,required.required_occasions,
    count(distinct eligible.item_id)::int item_count
  from target_nodes target
  join required_expectations required on required.node_id=target.id
  left join eligible_bank_items eligible
    on eligible.node_id=target.id
    and eligible.mastery_evidence_id=required.mastery_evidence_id
    and eligible.evidence_expectation=required.expectation
  group by target.section_key,target.id,required.mastery_evidence_id,
    required.expectation,required.required_distinct_items,required.required_occasions
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
  select config.section_key,config.min_nodes,config.min_items,config.min_production,
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
  group by config.section_key,config.min_nodes,config.min_items,config.min_production
), validity as (
  select *,target_node_count>=min_nodes and nodes_with_items>=min_nodes
    and approved_item_count>=min_items and confirmable_node_count>=2
    and production_item_count>=min_production
    and prompt_family_count>=2 and difficulty_tier_count>=2 as ready
  from section_stats
)
select jsonb_build_object(
  'ready',coalesce(bool_and(ready),false) and exists(
    select 1 from public.diagnostic_item_bank_releases bank
    where bank.id=p_bank_release_id and bank.taxonomy_release_id=p_taxonomy_release_id
      and bank.status='published'
  ),
  'sections',jsonb_agg(jsonb_build_object(
    'key',section_key,'targetNodeCount',target_node_count,
    'nodesWithItems',nodes_with_items,'approvedItemCount',approved_item_count,
    'confirmableNodeCount',confirmable_node_count,
    'productionItemCount',production_item_count,'promptFamilyCount',prompt_family_count,
    'difficultyTierCount',difficulty_tier_count,'ready',ready
  ) order by case section_key when 'reading_comprehension' then 1
    when 'grammar' then 2 when 'spelling' then 3 else 4 end)
) from validity
$$;

revoke all on function public.diagnostic_bank_readiness(uuid,uuid) from public;
grant execute on function public.diagnostic_bank_readiness(uuid,uuid)
  to authenticated,service_role;

create or replace function public.next_section_diagnostic_item(
  p_student_id uuid,p_run_id uuid,p_section_key text
) returns jsonb
language sql stable security definer set search_path = public as $$
with recursive run_record as (
  select run.id,run.run_type,run.taxonomy_release_id,run.item_bank_release_id
  from public.diagnostic_runs run
  where run.id=p_run_id and run.student_id=p_student_id and run.status='running'
    and run.taxonomy_release_id is not null and run.item_bank_release_id is not null
    and (auth.role()='service_role' or public.owns_student(p_student_id))
    and exists (
      select 1 from public.diagnostic_run_sections section
      where section.run_id=run.id and section.section_key=p_section_key
        and section.status='active'
        and (select count(*) from public.diagnostic_run_items answered
          where answered.run_id=run.id and answered.section_key=p_section_key
            and answered.answered_at is not null)<section.max_probes
    )
), learner as (
  select case profile.student_type
    when 'french_first_language' then 'native'
    when 'french_second_language' then 'fsl'
    else profile.student_type end learner_mode
  from public.learner_profiles profile where profile.student_id=p_student_id
), attempt_stats as (
  select attempt.node_id,count(*)::int asked
  from public.competency_attempts attempt
  where attempt.diagnostic_run_id=p_run_id group by attempt.node_id
), section_attempt_count as (
  select count(*)::int count from public.diagnostic_run_items
  where run_id=p_run_id and section_key=p_section_key and answered_at is not null
), used_families as (
  select membership.prompt_family,count(*)::int count
  from public.diagnostic_run_items assigned
  join run_record run on run.id=assigned.run_id
  join public.diagnostic_item_bank_memberships membership
    on membership.bank_release_id=run.item_bank_release_id and membership.item_id=assigned.item_id
  where assigned.section_key=p_section_key group by membership.prompt_family
), last_failed as (
  select attempt.node_id from public.competency_attempts attempt
  join public.competency_nodes node on node.id=attempt.node_id
  join run_record run on true
  join public.taxonomy_release_memberships node_membership
    on node_membership.release_id=run.taxonomy_release_id
    and node_membership.record_type='competency_node'
    and node_membership.record_id=node.id
  where attempt.diagnostic_run_id=p_run_id and attempt.is_correct=false
    and public.diagnostic_section_for_strand(coalesce(
      node_membership.record_snapshot->>'strand',node.strand
    ))=p_section_key
  order by attempt.attempted_at desc,attempt.id desc limit 1
), prerequisite_paths(root_id,node_id,depth) as (
  select edge.target_node_id,edge.source_node_id,1
  from public.competency_edges edge
  join public.diagnostic_run_targets target on target.run_id=p_run_id and target.node_id=edge.target_node_id
  where edge.edge_type='prerequisite' and coalesce(edge.prerequisite_class,'hard')='hard'
  union all
  select path.root_id,edge.source_node_id,path.depth+1
  from prerequisite_paths path join public.competency_edges edge on edge.target_node_id=path.node_id
  where edge.edge_type='prerequisite' and coalesce(edge.prerequisite_class,'hard')='hard' and path.depth<30
), prerequisite_counts as (
  select root_id,count(distinct node_id)::int prerequisite_count
  from prerequisite_paths group by root_id
), section_state as (
  select count(distinct assigned.node_id) filter (where assigned.answered_at is not null)::int distinct_nodes,
    coalesce(max(section.min_distinct_nodes),6)::int min_distinct_nodes
  from run_record run
  left join public.diagnostic_run_items assigned
    on assigned.run_id=run.id and assigned.section_key=p_section_key
  left join public.diagnostic_run_sections section
    on section.run_id=run.id and section.section_key=p_section_key
), required_live_evidence as (
  select distinct target.node_id,run.item_bank_release_id,
    evidence.id mastery_evidence_id,
    greatest(2,coalesce(
      nullif(evidence_membership.record_snapshot->'successCriteria'->>'minimumDistinctItems','')::int,
      evidence.minimum_distinct_items
    )) required_distinct_items,
    greatest(2,coalesce(
      nullif(evidence_membership.record_snapshot->'successCriteria'->>'minimumOccasions','')::int,
      evidence.minimum_occasions
    )) required_occasions
  from run_record run
  join public.diagnostic_run_targets target on target.run_id=run.id
  join public.competency_nodes node on node.id=target.node_id
  join public.taxonomy_release_memberships evidence_membership
    on evidence_membership.release_id=run.taxonomy_release_id
    and evidence_membership.record_type='mastery_evidence'
  join public.competency_mastery_evidence evidence
    on evidence.id=evidence_membership.record_id and evidence.node_id=target.node_id
  where public.diagnostic_section_for_strand(coalesce(
      (select node_membership.record_snapshot->>'strand'
       from public.taxonomy_release_memberships node_membership
       where node_membership.release_id=run.taxonomy_release_id
         and node_membership.record_type='competency_node'
         and node_membership.record_id=node.id),
      node.strand
    ))=p_section_key
    and coalesce(evidence_membership.record_snapshot->>'expectation',evidence.expectation)
      in ('receptive','controlled_production')
), bank_evidence_capacity as (
  select required.node_id,required.mastery_evidence_id,
    required.required_distinct_items,required.required_occasions,
    count(distinct membership.item_id) filter (
      where item.id is not null
        and item.learner_mode in ('shared',coalesce(learner.learner_mode,'shared'))
        and (item.review_status='human_approved'
          or (item.review_status='auto_approved' and item.validator_type='conjugator'
            and coalesce((item.qc_gates->'gate0_computed'->>'applied')::boolean,false)))
    )::int item_count
  from required_live_evidence required
  left join public.diagnostic_item_bank_memberships membership
    on membership.bank_release_id=required.item_bank_release_id
    and membership.node_id=required.node_id
    and membership.mastery_evidence_id=required.mastery_evidence_id
  left join public.competency_items item on item.id=membership.item_id
  left join learner on true
  group by required.node_id,required.mastery_evidence_id,
    required.required_distinct_items,required.required_occasions
), confirmable_nodes as (
  select capacity.node_id
  from bank_evidence_capacity capacity
  group by capacity.node_id
  having count(*)>0 and bool_and(
    capacity.item_count>=greatest(
      capacity.required_distinct_items,capacity.required_occasions
    )
  )
), first_node_assignments as (
  select assigned.node_id,min(assigned.position)::int first_position,
    max(assigned.information_gain) initial_information_gain
  from public.diagnostic_run_items assigned
  where assigned.run_id=p_run_id and assigned.section_key=p_section_key
  group by assigned.node_id
), anchor_candidates as (
  select first_assignment.node_id,row_number() over(order by
    first_assignment.initial_information_gain desc,
    first_assignment.first_position,first_assignment.node_id) anchor_rank
  from first_node_assignments first_assignment
  join confirmable_nodes confirmable on confirmable.node_id=first_assignment.node_id
), anchor_nodes as (
  select candidate.node_id from anchor_candidates candidate where candidate.anchor_rank<=2
), candidates as (
  select item.id,item.primary_node_id,item.prompt_fr,item.instructions_fr,item.response_type,
    membership.difficulty,node.key node_key,node.label_fr node_label,
    coalesce(taxonomy_membership.record_snapshot->>'strand',node.strand) strand,
    membership.mastery_evidence_id,
    membership.evidence_expectation,membership.prompt_family,membership.difficulty_tier,
    coalesce(expectation_result.uncertainty,result.uncertainty,estimate.uncertainty,1)::numeric uncertainty,
    coalesce(expectation_result.mastery_probability,result.mastery_probability,
      estimate.mastery_probability,.5)::numeric mastery,
    coalesce(stats.asked,0) asked,coalesce(counts.prerequisite_count,0) prerequisite_count,
    coalesce(family.count,0) family_asked,target.target_reason,
    (
      coalesce(expectation_result.distinct_item_count,0)<greatest(2,coalesce(
        nullif(evidence_membership.record_snapshot->'successCriteria'->>'minimumDistinctItems','')::int,
        evidence_definition.minimum_distinct_items
      ))
      or coalesce(expectation_result.occasion_count,0)<greatest(2,coalesce(
        nullif(evidence_membership.record_snapshot->'successCriteria'->>'minimumOccasions','')::int,
        evidence_definition.minimum_occasions
      ))
    ) evidence_underprobed,
    coalesce(expectation_result.uncertainty,1)::numeric expectation_uncertainty,
    exists(select 1 from last_failed failed join public.competency_edges edge
      on edge.target_node_id=failed.node_id and edge.source_node_id=item.primary_node_id
      and edge.edge_type='prerequisite' and coalesce(edge.prerequisite_class,'hard')='hard') descends_from_failure,
    row_number() over(partition by item.primary_node_id order by
      (
        coalesce(expectation_result.distinct_item_count,0)<greatest(2,coalesce(
          nullif(evidence_membership.record_snapshot->'successCriteria'->>'minimumDistinctItems','')::int,
          evidence_definition.minimum_distinct_items
        ))
        or coalesce(expectation_result.occasion_count,0)<greatest(2,coalesce(
          nullif(evidence_membership.record_snapshot->'successCriteria'->>'minimumOccasions','')::int,
          evidence_definition.minimum_occasions
        ))
      ) desc,
      coalesce(expectation_result.uncertainty,1) desc,
      abs(membership.difficulty-coalesce(expectation_result.mastery_probability,
        result.mastery_probability,estimate.mastery_probability,.5)*100),
      item.id) item_rank
  from run_record run
  join public.diagnostic_run_targets target on target.run_id=run.id
  join public.taxonomy_release_memberships taxonomy_membership
    on taxonomy_membership.release_id=run.taxonomy_release_id
    and taxonomy_membership.record_type='competency_node' and taxonomy_membership.record_id=target.node_id
  join public.competency_nodes node on node.id=target.node_id
  join public.diagnostic_item_bank_memberships membership
    on membership.bank_release_id=run.item_bank_release_id and membership.node_id=node.id
    and membership.section_key=p_section_key
    and membership.evidence_expectation in ('receptive','controlled_production')
  join public.taxonomy_release_memberships evidence_membership
    on evidence_membership.release_id=run.taxonomy_release_id
    and evidence_membership.record_type='mastery_evidence'
    and evidence_membership.record_id=membership.mastery_evidence_id
    and membership.evidence_expectation=coalesce(
      evidence_membership.record_snapshot->>'expectation',membership.evidence_expectation
    )
  join public.competency_mastery_evidence evidence_definition
    on evidence_definition.id=membership.mastery_evidence_id
    and evidence_definition.node_id=node.id
  join public.competency_items item on item.id=membership.item_id and item.primary_node_id=node.id
  left join learner on true
  left join public.diagnostic_node_results result on result.run_id=run.id and result.node_id=node.id
  left join public.diagnostic_node_evidence_results expectation_result
    on expectation_result.run_id=run.id and expectation_result.node_id=node.id
    and expectation_result.mastery_evidence_id=membership.mastery_evidence_id
  left join public.student_competency_estimates estimate on estimate.student_id=p_student_id and estimate.node_id=node.id
  left join attempt_stats stats on stats.node_id=node.id
  left join prerequisite_counts counts on counts.root_id=node.id
  left join used_families family on family.prompt_family=membership.prompt_family
  where public.diagnostic_section_for_strand(coalesce(
      taxonomy_membership.record_snapshot->>'strand',node.strand
    ))=p_section_key
    and node.review_status in ('auto_approved','human_approved')
    and (item.review_status='human_approved'
      or (item.review_status='auto_approved' and item.validator_type='conjugator'
        and coalesce((item.qc_gates->'gate0_computed'->>'applied')::boolean,false)))
    and item.learner_mode in ('shared',coalesce(learner.learner_mode,'shared'))
    and not exists(select 1 from public.diagnostic_run_items assigned
      where assigned.run_id=p_run_id and assigned.item_id=item.id)
), selected as (
  select candidate.*,
    greatest(0,candidate.uncertainty*(1+ln(1+candidate.prerequisite_count))) information_gain
  from candidates candidate
  cross join section_state state
  left join confirmable_nodes confirmable on confirmable.node_id=candidate.primary_node_id
  left join anchor_nodes anchor on anchor.node_id=candidate.primary_node_id
  where candidate.item_rank=1
  order by
    case when state.distinct_nodes<state.min_distinct_nodes
      then (candidate.asked=0)::int
      else (anchor.node_id is not null
        and not coalesce((select node_result.evidence_coverage_confirmed
          from public.diagnostic_node_results node_result
          where node_result.run_id=p_run_id
            and node_result.node_id=candidate.primary_node_id),false))::int end desc,
    case when state.distinct_nodes<state.min_distinct_nodes
      then (confirmable.node_id is not null)::int
      else (anchor.node_id is not null)::int end desc,
    candidate.descends_from_failure desc,
    candidate.evidence_underprobed desc,
    candidate.expectation_uncertainty desc,
    (candidate.family_asked=0) desc,
    (candidate.target_reason in ('stale','uncertain')) desc,
    information_gain desc,candidate.node_key,candidate.id limit 1
)
select jsonb_build_object(
  'id',selected.id,'nodeId',selected.primary_node_id,'nodeKey',selected.node_key,
  'nodeLabel',selected.node_label,'strand',selected.strand,'sectionKey',p_section_key,
  'promptFr',selected.prompt_fr,'instructionsFr',selected.instructions_fr,
  'responseType',selected.response_type,'informationGain',selected.information_gain,
  'masteryEvidenceId',selected.mastery_evidence_id,
  'evidenceExpectation',selected.evidence_expectation,'promptFamily',selected.prompt_family,
  'difficultyTier',selected.difficulty_tier,
  'choices',coalesce((select jsonb_agg(jsonb_build_object('id',choice.id,'text',choice.choice_text)
    order by choice.position nulls last,choice.id)
    from public.competency_item_choices choice where choice.item_id=selected.id),'[]'::jsonb)
) from selected
$$;

revoke all on function public.next_section_diagnostic_item(uuid,uuid,text) from public;
grant execute on function public.next_section_diagnostic_item(uuid,uuid,text)
  to authenticated,service_role;

create or replace function public.apply_diagnostic_graph_inference(
  p_student_id uuid,
  p_run_id uuid,
  p_node_id uuid,
  p_section_key text,
  p_mastery numeric,
  p_uncertainty numeric,
  p_correct boolean
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_taxonomy_release_id uuid;
  v_bank_release_id uuid;
  v_current_item_id uuid;
  v_current_evidence_id uuid;
  v_current_expectation text;
  v_observed_item_ids uuid[] := '{}';
  v_observed_expectations text[] := '{}';
  v_direct_count integer := 0;
  v_expectation_mastery numeric := .5;
  v_expectation_uncertainty numeric := 1;
  v_expectation_count integer := 0;
  v_correct_evidence_count integer := 0;
  v_observed_accuracy numeric := 0;
  v_distinct_item_count integer := 0;
  v_occasion_count integer := 0;
  v_required_distinct_items integer := 2;
  v_required_occasions integer := 2;
  v_required_accuracy numeric := .85;
  v_guess numeric := .2;
  v_coverage_confirmed boolean := false;
  v_all_expectations_mastered boolean := false;
  v_any_confirmed_gap boolean := false;
  v_has_deferred_evidence boolean := false;
  v_node_mastery numeric := .5;
  v_node_uncertainty numeric := 1;
begin
  select run.taxonomy_release_id,run.item_bank_release_id
  into v_taxonomy_release_id,v_bank_release_id
  from public.diagnostic_runs run
  where run.id=p_run_id and run.student_id=p_student_id and run.status='running'
    and run.taxonomy_release_id is not null and run.item_bank_release_id is not null
    and (auth.role()='service_role' or public.owns_student(p_student_id))
  for update;
  if not found then raise exception 'diagnostic run not authorized'; end if;

  -- submit_section_diagnostic_response inserts the response before this call and
  -- marks the assignment answered afterwards. The still-open occurrence is thus
  -- the exact issued item whose pinned membership must be merged.
  select assigned.item_id,membership.mastery_evidence_id,
    coalesce(evidence_membership.record_snapshot->>'expectation',membership.evidence_expectation),
    greatest(2,coalesce(
      nullif(evidence_membership.record_snapshot->'successCriteria'->>'minimumDistinctItems','')::int,
      evidence.minimum_distinct_items
    )),
    greatest(2,coalesce(
      nullif(evidence_membership.record_snapshot->'successCriteria'->>'minimumOccasions','')::int,
      evidence.minimum_occasions
    )),
    coalesce(
      nullif(evidence_membership.record_snapshot->'successCriteria'->>'minimumAccuracy','')::numeric,
      .85
    )
  into v_current_item_id,v_current_evidence_id,v_current_expectation,
    v_required_distinct_items,v_required_occasions,v_required_accuracy
  from public.diagnostic_responses response
  join public.diagnostic_run_items assigned
    on assigned.id=response.run_item_id and assigned.run_id=response.run_id
  join public.diagnostic_item_bank_memberships membership
    on membership.bank_release_id=v_bank_release_id
    and membership.item_id=assigned.item_id
    and membership.node_id=assigned.node_id
  join public.taxonomy_release_memberships evidence_membership
    on evidence_membership.release_id=v_taxonomy_release_id
    and evidence_membership.record_type='mastery_evidence'
    and evidence_membership.record_id=membership.mastery_evidence_id
  join public.competency_mastery_evidence evidence
    on evidence.id=membership.mastery_evidence_id and evidence.node_id=p_node_id
  where response.run_id=p_run_id and response.student_id=p_student_id
    and assigned.node_id=p_node_id and assigned.section_key=p_section_key
    and assigned.answered_at is null
    and membership.evidence_expectation=coalesce(
      evidence_membership.record_snapshot->>'expectation',membership.evidence_expectation
    )
  order by response.answered_at desc,response.id desc
  limit 1;
  if v_current_expectation is null then
    raise exception 'diagnostic evidence expectation not found';
  end if;
  if v_current_expectation not in ('receptive','controlled_production') then
    raise exception 'unsupported diagnostic evidence expectation';
  end if;

  select result.mastery_probability,result.direct_evidence_count,
    result.correct_evidence_count,result.observed_item_ids,result.occasion_count
  into v_expectation_mastery,v_expectation_count,v_correct_evidence_count,
    v_observed_item_ids,v_occasion_count
  from public.diagnostic_node_evidence_results result
  where result.run_id=p_run_id and result.node_id=p_node_id
    and result.mastery_evidence_id=v_current_evidence_id
  for update;
  v_expectation_count:=coalesce(v_expectation_count,0)+1;
  v_correct_evidence_count:=coalesce(v_correct_evidence_count,0)+case when p_correct then 1 else 0 end;
  v_observed_accuracy:=v_correct_evidence_count::numeric/v_expectation_count;
  v_occasion_count:=coalesce(v_occasion_count,0)+1;
  select array_agg(distinct item_id order by item_id)
  into v_observed_item_ids
  from unnest(coalesce(v_observed_item_ids,'{}'::uuid[]) || array[v_current_item_id]) item_id;
  v_distinct_item_count:=cardinality(v_observed_item_ids);
  select count(*) into v_guess
  from public.competency_item_choices choice where choice.item_id=v_current_item_id;
  v_guess:=case when v_guess>=2 then 1/v_guess else .2 end;
  v_expectation_mastery:=public.diagnostic_bkt_update(
    coalesce(v_expectation_mastery,.5),p_correct,v_guess
  );
  v_expectation_uncertainty:=public.diagnostic_mastery_uncertainty(
    v_expectation_mastery,v_expectation_count
  );

  insert into public.diagnostic_node_evidence_results(
    run_id,student_id,node_id,mastery_evidence_id,evidence_expectation,
    mastery_probability,uncertainty,direct_evidence_count,correct_evidence_count,
    observed_accuracy,distinct_item_count,
    occasion_count,observed_item_ids,required_distinct_items,required_occasions,
    required_accuracy,classification,updated_at
  ) values (
    p_run_id,p_student_id,p_node_id,v_current_evidence_id,v_current_expectation,
    v_expectation_mastery,v_expectation_uncertainty,v_expectation_count,
    v_correct_evidence_count,v_observed_accuracy,v_distinct_item_count,
    v_occasion_count,v_observed_item_ids,
    v_required_distinct_items,v_required_occasions,v_required_accuracy,
    case
      when v_distinct_item_count>=v_required_distinct_items
        and v_occasion_count>=v_required_occasions
        and v_expectation_mastery>=.85
        and v_observed_accuracy>=v_required_accuracy then 'mastered'
      when v_distinct_item_count>=v_required_distinct_items
        and v_occasion_count>=v_required_occasions
        and v_expectation_mastery<.5 then 'missing'
      else 'fragile' end,
    now()
  ) on conflict (run_id,node_id,mastery_evidence_id) do update set
    mastery_probability=excluded.mastery_probability,
    uncertainty=excluded.uncertainty,
    direct_evidence_count=excluded.direct_evidence_count,
    correct_evidence_count=excluded.correct_evidence_count,
    observed_accuracy=excluded.observed_accuracy,
    distinct_item_count=excluded.distinct_item_count,
    occasion_count=excluded.occasion_count,
    observed_item_ids=excluded.observed_item_ids,
    required_distinct_items=excluded.required_distinct_items,
    required_occasions=excluded.required_occasions,
    required_accuracy=excluded.required_accuracy,
    classification=excluded.classification,updated_at=now();

  with required as (
    select distinct evidence.id mastery_evidence_id,
      coalesce(membership.record_snapshot->>'expectation',evidence.expectation) expectation,
      greatest(2,coalesce(
        nullif(membership.record_snapshot->'successCriteria'->>'minimumDistinctItems','')::int,
        evidence.minimum_distinct_items
      )) required_distinct_items,
      greatest(2,coalesce(
        nullif(membership.record_snapshot->'successCriteria'->>'minimumOccasions','')::int,
        evidence.minimum_occasions
      )) required_occasions,
      coalesce(
        nullif(membership.record_snapshot->'successCriteria'->>'minimumAccuracy','')::numeric,
        .85
      ) required_accuracy
    from public.taxonomy_release_memberships membership
    join public.competency_mastery_evidence evidence
      on evidence.id=membership.record_id and evidence.node_id=p_node_id
    where membership.release_id=v_taxonomy_release_id
      and membership.record_type='mastery_evidence'
  ), required_state as (
    select required.*,result.mastery_probability,result.uncertainty,
      result.observed_accuracy,result.distinct_item_count,result.occasion_count,
      result.classification
    from required
    left join public.diagnostic_node_evidence_results result
      on result.run_id=p_run_id and result.node_id=p_node_id
      and result.mastery_evidence_id=required.mastery_evidence_id
    where required.expectation in ('receptive','controlled_production')
  )
  select
    count(*)>0 and bool_and(
      coalesce(distinct_item_count,0)>=required_distinct_items
      and coalesce(occasion_count,0)>=required_occasions
    ),
    count(*)>0 and bool_and(
      coalesce(distinct_item_count,0)>=required_distinct_items
      and coalesce(occasion_count,0)>=required_occasions
      and coalesce(mastery_probability,.5)>=.85
      and coalesce(observed_accuracy,0)>=required_accuracy
    ),
    count(*)>0 and bool_and(
      coalesce(distinct_item_count,0)>=required_distinct_items
      and coalesce(occasion_count,0)>=required_occasions
    )
      and bool_or(classification='missing'),
    min(coalesce(mastery_probability,.5)),
    max(coalesce(uncertainty,1)),
    exists(select 1 from required where expectation='independent_production')
  into v_coverage_confirmed,v_all_expectations_mastered,v_any_confirmed_gap,
    v_node_mastery,v_node_uncertainty,v_has_deferred_evidence
  from required_state;
  if v_has_deferred_evidence then
    v_node_uncertainty:=greatest(v_node_uncertainty,.5);
  end if;

  select coalesce(array_agg(distinct result.evidence_expectation order by result.evidence_expectation),'{}'::text[]),
    coalesce(sum(result.direct_evidence_count),0)::int
  into v_observed_expectations,v_direct_count
  from public.diagnostic_node_evidence_results result
  where result.run_id=p_run_id and result.node_id=p_node_id;

  insert into public.diagnostic_node_results(
    run_id,student_id,node_id,section_key,mastery_probability,uncertainty,
    direct_evidence_count,evidence_kind,evidence_expectations,
    evidence_coverage_confirmed,classification,updated_at
  ) values (
    p_run_id,p_student_id,p_node_id,p_section_key,v_node_mastery,v_node_uncertainty,
    v_direct_count,'direct',v_observed_expectations,v_coverage_confirmed,
    case
      when v_all_expectations_mastered and not v_has_deferred_evidence then 'mastered'
      when v_any_confirmed_gap then 'missing'
      else 'fragile' end,
    now()
  ) on conflict (run_id,node_id) do update set
    mastery_probability=excluded.mastery_probability,
    uncertainty=excluded.uncertainty,
    direct_evidence_count=excluded.direct_evidence_count,
    evidence_kind='direct',inferred_from_node_id=null,inference_depth=null,
    evidence_expectations=excluded.evidence_expectations,
    evidence_coverage_confirmed=excluded.evidence_coverage_confirmed,
    classification=excluded.classification,updated_at=now();

  -- The trusted submission writer first updates its legacy aggregate BKT. Replace
  -- that value with the conjunctive (weakest required evidence) posterior so a
  -- strong receptive channel cannot leak out as longitudinal mastery. Until all
  -- live evidence is sufficient and no independent verification is deferred,
  -- cap the compatibility estimate below the mastery threshold.
  update public.student_competency_estimates estimate set
    mastery_probability=case
      when v_all_expectations_mastered and not v_has_deferred_evidence
        then v_node_mastery
      else least(v_node_mastery,.84) end,
    uncertainty=greatest(v_node_uncertainty,
      case when v_all_expectations_mastered and not v_has_deferred_evidence
        then 0 else .4 end),
    estimate_source='direct',inferred_from_node_id=null,
    last_diagnostic_run_id=p_run_id,last_evidence_at=now(),updated_at=now()
  where estimate.student_id=p_student_id and estimate.node_id=p_node_id;

  -- Rebuild inferred prerequisites from the currently mastered direct sources.
  -- This retracts stale mastery when a later probe weakens any required channel.
  delete from public.student_competency_estimates estimate
  where estimate.student_id=p_student_id
    and estimate.last_diagnostic_run_id=p_run_id
    and estimate.estimate_source='diagnostic_inference'
    and estimate.evidence_count=0;
  delete from public.diagnostic_node_results result
  where result.run_id=p_run_id and result.evidence_kind='inferred_prerequisite';

  with recursive mastered_sources as (
    select result.node_id source_node_id,result.mastery_probability source_mastery,
      result.uncertainty source_uncertainty
    from public.diagnostic_node_results result
    where result.run_id=p_run_id and result.evidence_kind='direct'
      and result.classification='mastered'
  ), prerequisite_paths(source_node_id,node_id,depth,source_mastery,source_uncertainty) as (
    select source.source_node_id,edge.source_node_id,1,
      source.source_mastery,source.source_uncertainty
    from mastered_sources source
    join public.competency_edges edge on edge.target_node_id=source.source_node_id
    join public.taxonomy_release_memberships edge_membership
      on edge_membership.release_id=v_taxonomy_release_id
      and edge_membership.record_type='competency_edge'
      and edge_membership.record_id=edge.id
    where coalesce(edge_membership.record_snapshot->>'type',edge.edge_type)='prerequisite'
      and coalesce(
        edge_membership.record_snapshot->>'prerequisiteClass',
        edge.prerequisite_class,'hard'
      )='hard'
    union all
    select path.source_node_id,edge.source_node_id,path.depth+1,
      path.source_mastery,path.source_uncertainty
    from prerequisite_paths path
    join public.competency_edges edge on edge.target_node_id=path.node_id
    join public.taxonomy_release_memberships edge_membership
      on edge_membership.release_id=v_taxonomy_release_id
      and edge_membership.record_type='competency_edge'
      and edge_membership.record_id=edge.id
    where coalesce(edge_membership.record_snapshot->>'type',edge.edge_type)='prerequisite'
      and coalesce(
        edge_membership.record_snapshot->>'prerequisiteClass',
        edge.prerequisite_class,'hard'
      )='hard' and path.depth<30
  ), candidates as (
    select path.source_node_id,path.node_id,path.depth,
      greatest(.55,least(.9,path.source_mastery-path.depth*.04)) inferred_mastery,
      least(.75,greatest(.35,path.source_uncertainty+path.depth*.04)) inferred_uncertainty
    from prerequisite_paths path
    join public.diagnostic_run_targets target
      on target.run_id=p_run_id and target.node_id=path.node_id
    where not exists (
      select 1 from public.diagnostic_node_results direct
      where direct.run_id=p_run_id and direct.node_id=path.node_id
        and direct.evidence_kind='direct'
    )
  ), ranked as (
    select candidate.*,row_number() over(partition by candidate.node_id order by
      candidate.inferred_mastery desc,candidate.inferred_uncertainty,
      candidate.depth,candidate.source_node_id) candidate_rank
    from candidates candidate
  )
  insert into public.diagnostic_node_results(
    run_id,student_id,node_id,section_key,mastery_probability,uncertainty,
    direct_evidence_count,evidence_kind,inferred_from_node_id,inference_depth,
    evidence_expectations,evidence_coverage_confirmed,classification,updated_at
  ) select
    p_run_id,p_student_id,ranked.node_id,
    public.diagnostic_section_for_strand(coalesce(
      node_membership.record_snapshot->>'strand',node.strand
    )),
    ranked.inferred_mastery,ranked.inferred_uncertainty,0,
    'inferred_prerequisite',ranked.source_node_id,ranked.depth,'{}'::text[],false,
    case when ranked.inferred_mastery>=.85 then 'mastered' else 'fragile' end,now()
  from ranked
  join public.competency_nodes node on node.id=ranked.node_id
  join public.taxonomy_release_memberships node_membership
    on node_membership.release_id=v_taxonomy_release_id
    and node_membership.record_type='competency_node'
    and node_membership.record_id=node.id
  where ranked.candidate_rank=1;

  insert into public.student_competency_estimates(
    student_id,node_id,mastery_probability,uncertainty,evidence_count,
    estimate_source,inferred_from_node_id,last_diagnostic_run_id,last_evidence_at,updated_at
  ) select
    result.student_id,result.node_id,result.mastery_probability,result.uncertainty,0,
    'diagnostic_inference',result.inferred_from_node_id,p_run_id,now(),now()
  from public.diagnostic_node_results result
  where result.run_id=p_run_id and result.evidence_kind='inferred_prerequisite'
  on conflict (student_id,node_id) do update set
    mastery_probability=excluded.mastery_probability,
    uncertainty=excluded.uncertainty,
    estimate_source=excluded.estimate_source,
    inferred_from_node_id=excluded.inferred_from_node_id,
    last_diagnostic_run_id=excluded.last_diagnostic_run_id,
    last_evidence_at=excluded.last_evidence_at,
    updated_at=excluded.updated_at
  where public.student_competency_estimates.evidence_count=0
     or public.student_competency_estimates.estimate_source='diagnostic_inference';
end
$$;

revoke all on function public.apply_diagnostic_graph_inference(
  uuid,uuid,uuid,text,numeric,numeric,boolean
) from public;
grant execute on function public.apply_diagnostic_graph_inference(
  uuid,uuid,uuid,text,numeric,numeric,boolean
) to service_role;

comment on function public.apply_diagnostic_graph_inference(
  uuid,uuid,uuid,text,numeric,numeric,boolean
) is 'Merges the issued item expectation and confirms direct/inferred mastery only after pinned taxonomy evidence coverage.';

-- Keep the proven atomic writer as a private implementation and put immutable
-- bank/evidence validation in front of it. The wrapper and implementation still
-- execute in one PostgreSQL transaction, preserving replay semantics.
alter function public.submit_section_diagnostic_response(
  uuid,uuid,uuid,uuid,uuid,uuid,text,boolean,integer,text[],uuid
) rename to submit_section_diagnostic_response_unvalidated_v1;

revoke all on function public.submit_section_diagnostic_response_unvalidated_v1(
  uuid,uuid,uuid,uuid,uuid,uuid,text,boolean,integer,text[],uuid
) from public,anon,authenticated,service_role;

create function public.submit_section_diagnostic_response(
  p_student_id uuid,
  p_run_id uuid,
  p_run_item_id uuid,
  p_item_id uuid,
  p_idempotency_key uuid,
  p_selected_choice_id uuid,
  p_answer_text text,
  p_is_correct boolean,
  p_latency_ms integer,
  p_dimensions text[],
  p_mastery_evidence_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_run public.diagnostic_runs%rowtype;
  v_assignment public.diagnostic_run_items%rowtype;
  v_item public.competency_items%rowtype;
  v_pinned_evidence_id uuid;
  v_pinned_expectation text;
  v_expected_dimensions text[];
  v_normalized_dimensions text[];
begin
  if auth.role()<>'service_role' then raise exception 'service_role_required'; end if;
  select * into v_run from public.diagnostic_runs
  where id=p_run_id and student_id=p_student_id and status='running';
  if not found then raise exception 'diagnostic_run_not_found'; end if;
  select * into v_assignment from public.diagnostic_run_items
  where id=p_run_item_id and run_id=p_run_id and item_id=p_item_id;
  if not found then raise exception 'diagnostic_assignment_mismatch'; end if;

  if v_run.item_bank_release_id is not null then
    select membership.mastery_evidence_id,coalesce(
      evidence_membership.record_snapshot->>'expectation',membership.evidence_expectation
    )
    into v_pinned_evidence_id,v_pinned_expectation
    from public.diagnostic_item_bank_memberships membership
    join public.taxonomy_release_memberships evidence_membership
      on evidence_membership.release_id=v_run.taxonomy_release_id
      and evidence_membership.record_type='mastery_evidence'
      and evidence_membership.record_id=membership.mastery_evidence_id
    where membership.bank_release_id=v_run.item_bank_release_id
      and membership.item_id=p_item_id
      and membership.node_id=v_assignment.node_id
      and membership.section_key=v_assignment.section_key
      and membership.evidence_expectation=coalesce(
        evidence_membership.record_snapshot->>'expectation',membership.evidence_expectation
      );
    if not found then raise exception 'diagnostic_item_not_in_pinned_bank'; end if;
    if p_mastery_evidence_id is distinct from v_pinned_evidence_id then
      raise exception 'diagnostic_mastery_evidence_mismatch';
    end if;
    if v_pinned_expectation not in ('receptive','controlled_production') then
      raise exception 'unsupported diagnostic evidence expectation';
    end if;

    select * into v_item from public.competency_items where id=p_item_id;
    if v_assignment.section_key='reading_comprehension' then
      v_expected_dimensions:=case when v_item.modality='writing'
        then array['receptive','written']::text[]
        else array['receptive']::text[] end;
    elsif v_pinned_expectation='receptive' then
      v_expected_dimensions:=case
        when v_item.modality='listening' then array['oral','receptive']::text[]
        when v_item.modality='reading' then array['receptive']::text[]
        else array['receptive','written']::text[] end;
    else
      v_expected_dimensions:=case
        when v_item.modality='reading' then array['receptive']::text[]
        when v_item.modality='listening' then array['oral','receptive']::text[]
        when v_item.modality in ('writing','dictee') then array['productive','written']::text[]
        when v_item.modality='grammar_analysis' then array['receptive','written']::text[]
        else array['oral','productive']::text[] end;
    end if;
    select coalesce(array_agg(distinct dimension order by dimension),'{}'::text[])
    into v_normalized_dimensions
    from unnest(coalesce(p_dimensions,'{}'::text[])) dimension;
    if v_normalized_dimensions is distinct from v_expected_dimensions
      or cardinality(v_normalized_dimensions)<>cardinality(coalesce(p_dimensions,'{}'::text[]))
    then raise exception 'diagnostic_dimensions_mismatch'; end if;
  end if;

  return public.submit_section_diagnostic_response_unvalidated_v1(
    p_student_id,p_run_id,p_run_item_id,p_item_id,p_idempotency_key,
    p_selected_choice_id,p_answer_text,p_is_correct,p_latency_ms,p_dimensions,
    p_mastery_evidence_id
  );
end
$$;

revoke all on function public.submit_section_diagnostic_response(
  uuid,uuid,uuid,uuid,uuid,uuid,text,boolean,integer,text[],uuid
) from public;
grant execute on function public.submit_section_diagnostic_response(
  uuid,uuid,uuid,uuid,uuid,uuid,text,boolean,integer,text[],uuid
) to service_role;

comment on function public.submit_section_diagnostic_response(
  uuid,uuid,uuid,uuid,uuid,uuid,text,boolean,integer,text[],uuid
) is 'Validates pinned evidence and canonical dimensions, then atomically records one issued occurrence exactly once.';
