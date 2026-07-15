-- A diagnostic is reproducible only when both its taxonomy and its item bank
-- are immutable and explicitly linked through mastery-evidence definitions.

create table public.diagnostic_item_bank_releases (
  id uuid primary key default gen_random_uuid(),
  bank_key text not null unique,
  version text not null unique,
  taxonomy_release_id uuid not null references public.taxonomy_releases(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','validating','published','withdrawn')),
  manifest jsonb not null default '{}'::jsonb,
  manifest_checksum text,
  validation_report jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  withdrawn_at timestamptz,
  constraint diagnostic_bank_published_complete check (
    status <> 'published' or (
      published_at is not null and published_by is not null
      and coalesce(manifest_checksum,'') <> ''
      and validation_report is not null
      and validation_report @> '{"valid":true}'::jsonb
    )
  )
);

create table public.diagnostic_item_bank_memberships (
  bank_release_id uuid not null references public.diagnostic_item_bank_releases(id) on delete restrict,
  item_id uuid not null references public.competency_items(id) on delete restrict,
  node_id uuid not null references public.competency_nodes(id) on delete restrict,
  mastery_evidence_id uuid not null references public.competency_mastery_evidence(id) on delete restrict,
  section_key text not null check (section_key in (
    'reading_comprehension','grammar','spelling','conjugation'
  )),
  evidence_expectation text not null check (evidence_expectation in (
    'receptive','controlled_production','independent_production'
  )),
  modality text not null check (modality in (
    'reading','writing','listening','speaking','grammar_analysis','dictee'
  )),
  prompt_family text not null,
  difficulty_tier text not null check (difficulty_tier in ('foundation','core','stretch')),
  difficulty numeric not null check (difficulty between 0 and 100),
  created_at timestamptz not null default now(),
  primary key (bank_release_id,item_id),
  unique (bank_release_id,node_id,item_id)
);

alter table public.diagnostic_runs
  add column if not exists item_bank_release_id uuid
    references public.diagnostic_item_bank_releases(id) on delete restrict;

create index diagnostic_bank_taxonomy_lookup
  on public.diagnostic_item_bank_releases(taxonomy_release_id,status);
create index diagnostic_bank_membership_node
  on public.diagnostic_item_bank_memberships(bank_release_id,node_id,evidence_expectation);

alter table public.diagnostic_item_bank_releases enable row level security;
alter table public.diagnostic_item_bank_memberships enable row level security;

create policy diagnostic_bank_staff_write on public.diagnostic_item_bank_releases
  for all using (public.is_staff()) with check (public.is_staff());
create policy diagnostic_bank_membership_staff_write on public.diagnostic_item_bank_memberships
  for all using (public.is_staff()) with check (public.is_staff());
create policy diagnostic_bank_authenticated_read on public.diagnostic_item_bank_releases
  for select using (auth.uid() is not null and status in ('published','withdrawn'));
create policy diagnostic_bank_membership_authenticated_read on public.diagnostic_item_bank_memberships
  for select using (auth.uid() is not null and exists (
    select 1 from public.diagnostic_item_bank_releases bank
    where bank.id = bank_release_id and bank.status in ('published','withdrawn')
  ));

grant select on public.diagnostic_item_bank_releases,
  public.diagnostic_item_bank_memberships to authenticated;

create or replace function public.validate_diagnostic_bank_membership()
returns trigger language plpgsql set search_path = public as $$
declare item_node uuid; item_modality text; item_difficulty numeric; evidence_node uuid; evidence_expectation text;
begin
  select primary_node_id,modality,difficulty into item_node,item_modality,item_difficulty
  from public.competency_items where id=new.item_id;
  select node_id,expectation into evidence_node,evidence_expectation
  from public.competency_mastery_evidence where id=new.mastery_evidence_id;
  if item_node is distinct from new.node_id then raise exception 'diagnostic item/node mismatch'; end if;
  if evidence_node is distinct from new.node_id then raise exception 'diagnostic evidence/node mismatch'; end if;
  if item_modality is distinct from new.modality then raise exception 'diagnostic item/modality mismatch'; end if;
  if item_difficulty is distinct from new.difficulty then raise exception 'diagnostic item/difficulty mismatch'; end if;
  if evidence_expectation is distinct from new.evidence_expectation then raise exception 'diagnostic evidence/expectation mismatch'; end if;
  if public.diagnostic_section_for_strand((select strand from public.competency_nodes where id=new.node_id)) is distinct from new.section_key then
    raise exception 'diagnostic node/section mismatch';
  end if;
  if not exists (
    select 1
    from public.diagnostic_item_bank_releases bank
    join public.taxonomy_release_memberships membership
      on membership.release_id=bank.taxonomy_release_id
      and membership.record_type='competency_node'
      and membership.record_id=new.node_id
    where bank.id=new.bank_release_id
  ) then raise exception 'diagnostic node is outside the bank taxonomy release'; end if;
  return new;
end
$$;

create trigger diagnostic_bank_membership_consistency
before insert or update on public.diagnostic_item_bank_memberships
for each row execute function public.validate_diagnostic_bank_membership();

create or replace function public.guard_published_diagnostic_bank_release()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status in ('published','withdrawn') then
    if tg_op='UPDATE' and old.status='published' and new.status='withdrawn'
      and new.bank_key=old.bank_key and new.version=old.version
      and new.taxonomy_release_id=old.taxonomy_release_id and new.manifest=old.manifest
      and new.manifest_checksum=old.manifest_checksum and new.validation_report=old.validation_report
      and new.published_at=old.published_at and new.withdrawn_at is not null then return new;
    end if;
    raise exception 'published diagnostic bank is immutable';
  end if;
  return coalesce(new,old);
end
$$;

create or replace function public.guard_published_diagnostic_bank_membership()
returns trigger language plpgsql set search_path = public as $$
declare bank_id uuid := coalesce(new.bank_release_id,old.bank_release_id);
begin
  if exists(select 1 from public.diagnostic_item_bank_releases where id=bank_id and status in ('published','withdrawn')) then
    raise exception 'published diagnostic bank membership is immutable';
  end if;
  return coalesce(new,old);
end
$$;

create trigger diagnostic_bank_release_immutability
before update or delete on public.diagnostic_item_bank_releases
for each row execute function public.guard_published_diagnostic_bank_release();
create trigger diagnostic_bank_membership_immutability
before insert or update or delete on public.diagnostic_item_bank_memberships
for each row execute function public.guard_published_diagnostic_bank_membership();

create or replace function public.guard_published_diagnostic_item_content()
returns trigger language plpgsql set search_path = public as $$
begin
  if exists(
    select 1
    from public.diagnostic_item_bank_memberships membership
    join public.diagnostic_item_bank_releases bank on bank.id=membership.bank_release_id
    where membership.item_id=old.id and bank.status in ('published','withdrawn')
  ) then
    -- Operational psychometrics may continue to accrue, but the scored item
    -- itself must remain byte-for-byte stable for reproducible diagnostics.
    if tg_op='UPDATE' and
      to_jsonb(new)-array[
        'p_value','discrimination','attempts_count','psychometric_flags',
        'difficulty','updated_at'
      ] =
      to_jsonb(old)-array[
        'p_value','discrimination','attempts_count','psychometric_flags',
        'difficulty','updated_at'
      ]
    then return new;
    end if;
    raise exception 'published diagnostic item content is immutable';
  end if;
  return coalesce(new,old);
end
$$;

create or replace function public.guard_published_diagnostic_item_choice()
returns trigger language plpgsql set search_path = public as $$
declare v_item_id uuid := coalesce(new.item_id,old.item_id);
begin
  if exists(
    select 1
    from public.diagnostic_item_bank_memberships membership
    join public.diagnostic_item_bank_releases bank on bank.id=membership.bank_release_id
    where membership.item_id=v_item_id and bank.status in ('published','withdrawn')
  ) then raise exception 'published diagnostic item choices are immutable';
  end if;
  return coalesce(new,old);
end
$$;

create or replace function public.guard_published_diagnostic_mastery_evidence()
returns trigger language plpgsql set search_path = public as $$
begin
  if exists(
    select 1
    from public.diagnostic_item_bank_memberships membership
    join public.diagnostic_item_bank_releases bank on bank.id=membership.bank_release_id
    where membership.mastery_evidence_id=old.id and bank.status in ('published','withdrawn')
  ) then raise exception 'published diagnostic mastery evidence is immutable';
  end if;
  return coalesce(new,old);
end
$$;

create trigger diagnostic_bank_item_content_immutability
before update or delete on public.competency_items
for each row execute function public.guard_published_diagnostic_item_content();
create trigger diagnostic_bank_item_choice_immutability
before insert or update or delete on public.competency_item_choices
for each row execute function public.guard_published_diagnostic_item_choice();
create trigger diagnostic_bank_mastery_evidence_immutability
before update or delete on public.competency_mastery_evidence
for each row execute function public.guard_published_diagnostic_mastery_evidence();

drop function if exists public.diagnostic_bank_readiness(uuid);
create function public.diagnostic_bank_readiness(p_taxonomy_release_id uuid,p_bank_release_id uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
with configs(section_key,min_nodes,min_items,min_production) as (
  values
    ('reading_comprehension',6,8,2),
    ('grammar',6,8,2),
    ('spelling',6,8,4),
    ('conjugation',6,8,4)
), target_nodes as (
  select node.id,public.diagnostic_section_for_strand(node.strand) section_key
  from public.taxonomy_release_memberships taxonomy_membership
  join public.competency_nodes node on node.id=taxonomy_membership.record_id
  where taxonomy_membership.release_id=p_taxonomy_release_id
    and taxonomy_membership.record_type='competency_node'
    and node.review_status in ('auto_approved','human_approved')
), node_item_stats as (
  select target.section_key,target.id node_id,count(distinct item.id)::int item_count
  from target_nodes target
  left join public.diagnostic_item_bank_memberships membership
    on membership.bank_release_id=p_bank_release_id and membership.node_id=target.id
  left join public.competency_items item on item.id=membership.item_id
    and (item.review_status='human_approved'
      or (item.review_status='auto_approved' and item.validator_type='conjugator'
        and coalesce((item.qc_gates->'gate0_computed'->>'applied')::boolean,false)))
  group by target.section_key,target.id
), section_stats as (
  select config.section_key,config.min_nodes,config.min_items,config.min_production,
    count(distinct target.id)::int target_node_count,
    count(distinct membership.node_id) filter (where item.id is not null)::int nodes_with_items,
    count(distinct item.id)::int approved_item_count,
    count(distinct node_stats.node_id) filter (where node_stats.item_count>=2)::int confirmable_node_count,
    count(distinct item.id) filter (
      where item.id is not null and membership.evidence_expectation in ('controlled_production','independent_production')
    )::int production_item_count,
    count(distinct membership.prompt_family) filter (where item.id is not null)::int prompt_family_count,
    count(distinct membership.difficulty_tier) filter (where item.id is not null)::int difficulty_tier_count
  from configs config
  left join target_nodes target on target.section_key=config.section_key
  left join node_item_stats node_stats on node_stats.node_id=target.id
  left join public.diagnostic_item_bank_memberships membership
    on membership.bank_release_id=p_bank_release_id
    and membership.node_id=target.id and membership.section_key=config.section_key
  left join public.competency_items item on item.id=membership.item_id
    and (item.review_status='human_approved'
      or (item.review_status='auto_approved' and item.validator_type='conjugator'
        and coalesce((item.qc_gates->'gate0_computed'->>'applied')::boolean,false)))
  group by config.section_key,config.min_nodes,config.min_items,config.min_production
), validity as (
  select *, target_node_count>=min_nodes and nodes_with_items>=min_nodes
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
grant execute on function public.diagnostic_bank_readiness(uuid,uuid) to authenticated,service_role;

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
  where attempt.diagnostic_run_id=p_run_id and attempt.is_correct=false
    and public.diagnostic_section_for_strand(node.strand)=p_section_key
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
), candidates as (
  select item.id,item.primary_node_id,item.prompt_fr,item.instructions_fr,item.response_type,
    membership.difficulty,node.key node_key,node.label_fr node_label,node.strand,
    membership.mastery_evidence_id,
    membership.evidence_expectation,membership.prompt_family,membership.difficulty_tier,
    coalesce(result.uncertainty,estimate.uncertainty,1)::numeric uncertainty,
    coalesce(result.mastery_probability,estimate.mastery_probability,.5)::numeric mastery,
    coalesce(stats.asked,0) asked,coalesce(counts.prerequisite_count,0) prerequisite_count,
    coalesce(family.count,0) family_asked,target.target_reason,
    exists(select 1 from last_failed failed join public.competency_edges edge
      on edge.target_node_id=failed.node_id and edge.source_node_id=item.primary_node_id
      and edge.edge_type='prerequisite' and coalesce(edge.prerequisite_class,'hard')='hard') descends_from_failure,
    row_number() over(partition by item.primary_node_id order by
      abs(membership.difficulty-coalesce(result.mastery_probability,estimate.mastery_probability,.5)*100),item.id) item_rank
  from run_record run
  join public.diagnostic_run_targets target on target.run_id=run.id
  join public.taxonomy_release_memberships taxonomy_membership
    on taxonomy_membership.release_id=run.taxonomy_release_id
    and taxonomy_membership.record_type='competency_node' and taxonomy_membership.record_id=target.node_id
  join public.competency_nodes node on node.id=target.node_id
  join public.diagnostic_item_bank_memberships membership
    on membership.bank_release_id=run.item_bank_release_id and membership.node_id=node.id
    and membership.section_key=p_section_key
  join public.competency_items item on item.id=membership.item_id and item.primary_node_id=node.id
  left join learner on true
  left join public.diagnostic_node_results result on result.run_id=run.id and result.node_id=node.id
  left join public.student_competency_estimates estimate on estimate.student_id=p_student_id and estimate.node_id=node.id
  left join attempt_stats stats on stats.node_id=node.id
  left join prerequisite_counts counts on counts.root_id=node.id
  left join used_families family on family.prompt_family=membership.prompt_family
  where public.diagnostic_section_for_strand(node.strand)=p_section_key
    and node.review_status in ('auto_approved','human_approved')
    and (item.review_status='human_approved'
      or (item.review_status='auto_approved' and item.validator_type='conjugator'
        and coalesce((item.qc_gates->'gate0_computed'->>'applied')::boolean,false)))
    and item.learner_mode in ('shared',coalesce(learner.learner_mode,'shared'))
    and coalesce(stats.asked,0)<3
    and not exists(select 1 from public.diagnostic_run_items assigned
      where assigned.run_id=p_run_id and assigned.item_id=item.id)
), selected as (
  select candidate.*,
    greatest(0,candidate.uncertainty*(1+ln(1+candidate.prerequisite_count))) information_gain
  from candidates candidate cross join section_attempt_count section_count
  where candidate.item_rank=1
  order by candidate.descends_from_failure desc,
    case when section_count.count<8 then (candidate.asked=0)::int else (candidate.asked=1)::int end desc,
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
grant execute on function public.next_section_diagnostic_item(uuid,uuid,text) to authenticated,service_role;

comment on table public.diagnostic_item_bank_memberships is
  'Pins each diagnostic question to one canonical graph node and one reviewed mastery-evidence definition.';
