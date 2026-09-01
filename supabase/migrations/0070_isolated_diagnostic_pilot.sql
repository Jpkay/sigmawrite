-- Controlled diagnostic pilots may exercise a draft bank without weakening
-- production publication, reviewer provenance, or the assessment-first gate.

begin;

create table public.diagnostic_pilot_settings (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.diagnostic_pilot_settings(singleton,enabled)
values (true,false) on conflict (singleton) do nothing;

create table public.diagnostic_pilot_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  taxonomy_release_id uuid not null references public.taxonomy_releases(id) on delete restrict,
  bank_release_id uuid not null references public.diagnostic_item_bank_releases(id) on delete restrict,
  active boolean not null default true,
  expires_at timestamptz not null,
  enrolled_by uuid not null references public.profiles(id) on delete restrict,
  revoked_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  constraint diagnostic_pilot_enrollment_expiry check (expires_at>created_at),
  constraint diagnostic_pilot_enrollment_revoke check (
    (active and revoked_at is null) or (not active)
  )
);

create unique index diagnostic_pilot_one_active_enrollment
  on public.diagnostic_pilot_enrollments(student_id)
  where active;

alter table public.diagnostic_runs
  add column if not exists is_pilot boolean not null default false,
  add column if not exists pilot_enrollment_id uuid
    references public.diagnostic_pilot_enrollments(id) on delete restrict;

alter table public.diagnostic_runs
  add constraint diagnostic_runs_pilot_enrollment_check check (
    is_pilot=(pilot_enrollment_id is not null)
  );

alter table public.student_learning_paths
  add column if not exists provisional boolean not null default false;
alter table public.student_reading_estimates
  add column if not exists provisional boolean not null default false;
alter table public.diagnostic_results
  add column if not exists provisional boolean not null default false;
alter table public.competency_attempts
  add column if not exists provisional boolean not null default false;
alter table public.diagnostic_responses
  add column if not exists provisional boolean not null default false;

alter table public.diagnostic_pilot_settings enable row level security;
alter table public.diagnostic_pilot_enrollments enable row level security;
create policy diagnostic_pilot_settings_admin on public.diagnostic_pilot_settings
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy diagnostic_pilot_enrollments_admin on public.diagnostic_pilot_enrollments
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy diagnostic_pilot_enrollments_student_read on public.diagnostic_pilot_enrollments
  for select using (public.owns_student(student_id));
grant select,insert,update,delete on public.diagnostic_pilot_settings to authenticated;
grant select,insert,update,delete on public.diagnostic_pilot_enrollments to authenticated;

create or replace function public.validate_diagnostic_pilot_enrollment()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists (
    select 1 from public.profiles profile
    where profile.id=new.enrolled_by and profile.role='platform_admin'
  ) then raise exception 'diagnostic_pilot_admin_required'; end if;
  if not exists (
    select 1
    from public.diagnostic_item_bank_releases bank
    join public.taxonomy_releases taxonomy on taxonomy.id=bank.taxonomy_release_id
    where bank.id=new.bank_release_id
      and taxonomy.id=new.taxonomy_release_id
      and bank.status in ('draft','validating')
      and taxonomy.status in ('validating','published')
  ) then raise exception 'diagnostic_pilot_release_ineligible'; end if;
  if exists (
    select 1 from public.diagnostic_runs run
    join public.diagnostic_item_bank_releases bank on bank.id=run.item_bank_release_id
    where run.student_id=new.student_id and run.status='completed'
      and bank.status='published'
  ) then raise exception 'diagnostic_pilot_test_accounts_only'; end if;
  return new;
end
$$;

create trigger validate_diagnostic_pilot_enrollment_trigger
before insert or update of student_id,taxonomy_release_id,bank_release_id,enrolled_by
on public.diagnostic_pilot_enrollments
for each row execute function public.validate_diagnostic_pilot_enrollment();

create or replace function public.diagnostic_pilot_context(p_student_id uuid)
returns jsonb language sql stable security definer set search_path=public as $$
  select case when coalesce(setting.enabled,false) then jsonb_build_object(
    'enrollmentId',enrollment.id,
    'taxonomyReleaseId',enrollment.taxonomy_release_id,
    'bankReleaseId',enrollment.bank_release_id,
    'expiresAt',enrollment.expires_at
  ) else null end
  from public.diagnostic_pilot_enrollments enrollment
  join public.diagnostic_pilot_settings setting on setting.singleton
  join public.diagnostic_item_bank_releases bank on bank.id=enrollment.bank_release_id
    and bank.taxonomy_release_id=enrollment.taxonomy_release_id
    and bank.status in ('draft','validating')
  join public.taxonomy_releases taxonomy on taxonomy.id=enrollment.taxonomy_release_id
    and taxonomy.status in ('validating','published')
  where enrollment.student_id=p_student_id and enrollment.active
    and enrollment.revoked_at is null and enrollment.expires_at>now()
    and (auth.role()='service_role' or public.owns_student(p_student_id))
  order by enrollment.created_at desc limit 1
$$;

revoke all on function public.diagnostic_pilot_context(uuid) from public,anon,authenticated;
grant execute on function public.diagnostic_pilot_context(uuid) to service_role;

create or replace function public.diagnostic_pilot_item_is_eligible(p_item_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select coalesce((
    item.review_status in ('needs_human_review','human_approved','auto_approved')
    and item.validator_type in ('exact','regex','conjugator')
    and coalesce((item.qc_gates->>'gate1_schema')::boolean,false)
    and coalesce((item.qc_gates->'gate1_invariants'->>'ok')::boolean,false)
    and coalesce((item.qc_gates->'gate2_answer_key'->>'ok')::boolean,false)
    and coalesce(item.qc_gates->>'verdict','')<>'rejected'
  ),false) from public.competency_items item where item.id=p_item_id
$$;

revoke all on function public.diagnostic_pilot_item_is_eligible(uuid)
  from public,anon,authenticated;
grant execute on function public.diagnostic_pilot_item_is_eligible(uuid) to service_role;

create or replace function public.diagnostic_pilot_bank_readiness(
  p_taxonomy_release_id uuid,p_bank_release_id uuid
) returns jsonb language sql stable security definer set search_path=public as $$
with required as (
  select node.record_id node_id,evidence.record_id evidence_id,
    public.diagnostic_section_for_strand(node.record_snapshot->>'strand') section_key,
    greatest(2,coalesce(
      nullif(evidence.record_snapshot->'successCriteria'->>'minimumDistinctItems','')::int,
      nullif(evidence.record_snapshot->'successCriteria'->>'minimumDistinctTexts','')::int,
      2
    )) required_items
  from public.taxonomy_release_memberships node
  join public.taxonomy_release_memberships evidence
    on evidence.release_id=node.release_id
    and evidence.record_type='mastery_evidence'
    and split_part(evidence.stable_key,':',1)=node.stable_key
  where node.release_id=p_taxonomy_release_id
    and node.record_type='competency_node'
    and evidence.record_snapshot->>'expectation' in ('receptive','controlled_production')
    and public.diagnostic_section_for_strand(node.record_snapshot->>'strand') is not null
), capacity as (
  select required.*,
    count(distinct membership.item_id) filter (
      where public.diagnostic_pilot_item_is_eligible(membership.item_id)
    )::int item_count
  from required
  left join public.diagnostic_item_bank_memberships membership
    on membership.bank_release_id=p_bank_release_id
    and membership.node_id=required.node_id
    and membership.mastery_evidence_id=required.evidence_id
  group by required.node_id,required.evidence_id,required.section_key,required.required_items
), section_rows as (
  select section.key,
    count(distinct required.node_id)::int target_node_count,
    count(distinct capacity.node_id) filter (where capacity.item_count>0)::int nodes_with_items,
    coalesce(sum(capacity.item_count),0)::int approved_item_count,
    count(distinct capacity.node_id) filter (
      where not exists (
        select 1 from capacity missing
        where missing.node_id=capacity.node_id
          and missing.item_count<missing.required_items
      )
    )::int confirmable_node_count
  from (values
    ('reading_comprehension'),('grammar'),('spelling'),('conjugation')
  ) section(key)
  left join required on required.section_key=section.key
  left join capacity on capacity.section_key=section.key
  group by section.key
), release_ok as (
  select exists (
    select 1 from public.diagnostic_item_bank_releases bank
    join public.taxonomy_releases taxonomy on taxonomy.id=bank.taxonomy_release_id
    where bank.id=p_bank_release_id and taxonomy.id=p_taxonomy_release_id
      and bank.status in ('draft','validating')
      and taxonomy.status in ('validating','published')
  ) ok
), sections as (
  select row.*,
    (row.target_node_count>=6 and row.nodes_with_items=row.target_node_count
      and row.confirmable_node_count=row.target_node_count) ready
  from section_rows row
)
select jsonb_build_object(
  'ready',(select ok from release_ok) and coalesce(bool_and(ready),false),
  'sections',coalesce(jsonb_agg(jsonb_build_object(
    'key',key,'targetNodeCount',target_node_count,'nodesWithItems',nodes_with_items,
    'approvedItemCount',approved_item_count,'confirmableNodeCount',confirmable_node_count,
    'ready',ready
  ) order by case key when 'reading_comprehension' then 1 when 'grammar' then 2
    when 'spelling' then 3 else 4 end),'[]'::jsonb)
) from sections
$$;

revoke all on function public.diagnostic_pilot_bank_readiness(uuid,uuid)
  from public,anon,authenticated;
grant execute on function public.diagnostic_pilot_bank_readiness(uuid,uuid) to service_role;

create or replace function public.next_pilot_section_diagnostic_item(
  p_student_id uuid,p_run_id uuid,p_section_key text
) returns jsonb language sql stable security definer set search_path=public as $$
with run_record as (
  select run.id,run.item_bank_release_id
  from public.diagnostic_runs run
  join public.diagnostic_pilot_enrollments enrollment
    on enrollment.id=run.pilot_enrollment_id and enrollment.student_id=run.student_id
  join public.diagnostic_pilot_settings setting on setting.singleton and setting.enabled
  where run.id=p_run_id and run.student_id=p_student_id and run.status='running'
    and run.is_pilot and enrollment.active and enrollment.revoked_at is null
    and enrollment.expires_at>now()
    and enrollment.bank_release_id=run.item_bank_release_id
    and (auth.role()='service_role' or public.owns_student(p_student_id))
    and exists (select 1 from public.diagnostic_run_sections section
      where section.run_id=run.id and section.section_key=p_section_key
        and section.status='active' and section.probe_count<section.max_probes)
), section_state as (
  select count(distinct assigned.node_id) filter (where assigned.answered_at is not null)::int distinct_nodes,
    coalesce(max(section.min_distinct_nodes),6)::int min_distinct_nodes
  from run_record run
  join public.diagnostic_run_sections section on section.run_id=run.id and section.section_key=p_section_key
  left join public.diagnostic_run_items assigned on assigned.run_id=run.id and assigned.section_key=p_section_key
), attempts as (
  select attempt.node_id,count(*)::int asked
  from public.competency_attempts attempt
  where attempt.diagnostic_run_id=p_run_id group by attempt.node_id
), used_families as (
  select membership.prompt_family,count(*)::int used
  from public.diagnostic_run_items assigned
  join run_record run on run.id=assigned.run_id
  join public.diagnostic_item_bank_memberships membership
    on membership.bank_release_id=run.item_bank_release_id and membership.item_id=assigned.item_id
  where assigned.section_key=p_section_key group by membership.prompt_family
), last_failed as (
  select attempt.node_id from public.competency_attempts attempt
  where attempt.diagnostic_run_id=p_run_id and attempt.is_correct=false
  order by attempt.attempted_at desc,attempt.id desc limit 1
), candidates as (
  select item.id,item.primary_node_id,item.prompt_fr,item.instructions_fr,item.response_type,
    node.key node_key,node.label_fr node_label,node.strand,membership.mastery_evidence_id,
    membership.evidence_expectation,membership.prompt_family,membership.difficulty_tier,
    membership.difficulty,
    coalesce(evidence_result.uncertainty,node_result.uncertainty,1)::numeric uncertainty,
    coalesce(evidence_result.mastery_probability,node_result.mastery_probability,.5)::numeric mastery,
    coalesce(attempts.asked,0) asked,coalesce(family.used,0) family_used,
    coalesce(evidence_result.distinct_item_count,0)<greatest(2,coalesce(
      evidence.minimum_distinct_items,2
    )) evidence_underprobed,
    exists(select 1 from last_failed failed join public.competency_edges edge
      on edge.target_node_id=failed.node_id and edge.source_node_id=item.primary_node_id
      and edge.edge_type='prerequisite' and coalesce(edge.prerequisite_class,'hard')='hard') descends_from_failure,
    (select count(*) from public.competency_edges edge where edge.target_node_id=item.primary_node_id
      and edge.edge_type='prerequisite' and coalesce(edge.prerequisite_class,'hard')='hard') prerequisite_count,
    target.target_reason
  from run_record run
  join public.diagnostic_run_targets target on target.run_id=run.id
  join public.competency_nodes node on node.id=target.node_id
  join public.diagnostic_item_bank_memberships membership
    on membership.bank_release_id=run.item_bank_release_id and membership.node_id=node.id
    and membership.section_key=p_section_key
    and membership.evidence_expectation in ('receptive','controlled_production')
  join public.competency_mastery_evidence evidence on evidence.id=membership.mastery_evidence_id
  join public.competency_items item on item.id=membership.item_id and item.primary_node_id=node.id
  left join attempts on attempts.node_id=node.id
  left join used_families family on family.prompt_family=membership.prompt_family
  left join public.diagnostic_node_results node_result on node_result.run_id=run.id and node_result.node_id=node.id
  left join public.diagnostic_node_evidence_results evidence_result
    on evidence_result.run_id=run.id and evidence_result.node_id=node.id
    and evidence_result.mastery_evidence_id=membership.mastery_evidence_id
  where public.diagnostic_section_for_strand(node.strand)=p_section_key
    and public.diagnostic_pilot_item_is_eligible(item.id)
    and not exists(select 1 from public.diagnostic_run_items assigned
      where assigned.run_id=run.id and assigned.item_id=item.id)
), selected as (
  select candidate.*,
    greatest(0,candidate.uncertainty*(1+ln(1+candidate.prerequisite_count))) information_gain
  from candidates candidate cross join section_state state
  order by
    case when state.distinct_nodes<state.min_distinct_nodes then (candidate.asked=0)::int else 0 end desc,
    candidate.descends_from_failure desc,candidate.evidence_underprobed desc,
    candidate.uncertainty desc,(candidate.family_used=0) desc,
    (candidate.target_reason in ('stale','uncertain')) desc,
    abs(candidate.difficulty-candidate.mastery*100),candidate.node_key,candidate.id
  limit 1
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

revoke all on function public.next_pilot_section_diagnostic_item(uuid,uuid,text)
  from public,anon,authenticated;
grant execute on function public.next_pilot_section_diagnostic_item(uuid,uuid,text) to service_role;

-- Pilot node results remain run-scoped. Prevent the inference function from
-- leaking them into the student's durable competency estimate table.
create or replace function public.suppress_pilot_competency_estimate()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.last_diagnostic_run_id is not null and exists (
    select 1 from public.diagnostic_runs run
    where run.id=new.last_diagnostic_run_id and run.is_pilot
  ) then
    if tg_op='INSERT' then return null; end if;
    return old;
  end if;
  return new;
end
$$;

create trigger suppress_pilot_competency_estimate_trigger
before insert or update on public.student_competency_estimates
for each row execute function public.suppress_pilot_competency_estimate();

create or replace function public.mark_pilot_diagnostic_evidence()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_run_id uuid;
begin
  if tg_table_name='diagnostic_responses' then
    v_run_id:=new.run_id;
  else
    v_run_id:=new.diagnostic_run_id;
  end if;
  if v_run_id is not null and exists (
    select 1 from public.diagnostic_runs run where run.id=v_run_id and run.is_pilot
  ) then new.provisional:=true; end if;
  return new;
end
$$;

create trigger mark_pilot_diagnostic_response_trigger
before insert or update on public.diagnostic_responses
for each row execute function public.mark_pilot_diagnostic_evidence();
create trigger mark_pilot_competency_attempt_trigger
before insert or update on public.competency_attempts
for each row execute function public.mark_pilot_diagnostic_evidence();

comment on table public.diagnostic_pilot_enrollments is
  'Expiring, administrator-controlled access for disposable test students to exercise an unpublished diagnostic bank.';
comment on column public.diagnostic_runs.is_pilot is
  'True only for a provisional run that must never satisfy the production learning-unlock contract.';

commit;
