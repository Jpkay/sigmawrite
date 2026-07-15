-- Keep graph-path completion tied to the kind of evidence the pinned
-- taxonomy requires. In particular, controlled exercises cannot stand in for
-- an unaided connected-writing verification.

begin;

alter table public.student_learning_path_steps
  add column required_evidence_expectation text
    check (required_evidence_expectation is null or required_evidence_expectation in (
      'receptive','controlled_production','independent_production'
    ));

comment on column public.student_learning_path_steps.required_evidence_expectation is
  'When set, only trusted evidence with this taxonomy expectation may complete the step.';

-- Preserve the semantics of paths generated before this column existed. The
-- path is pinned to a taxonomy release, so backfill from that immutable
-- release rather than from mutable live evidence rows.
update public.student_learning_path_steps step
set required_evidence_expectation='independent_production'
from public.student_learning_paths path,public.competency_nodes node
where path.id=step.path_id
  and node.id=step.node_id
  and exists (
    select 1
    from public.taxonomy_release_memberships membership
    where membership.release_id=path.taxonomy_release_id
      and membership.record_type='mastery_evidence'
      and split_part(membership.stable_key,':',1)=node.key
      and membership.record_snapshot->>'expectation'='independent_production'
  );

-- Canonical evidence-aware entry point. It intentionally has no defaults:
-- this keeps PostgreSQL/PostgREST overload resolution unambiguous while the
-- legacy four-argument wrapper below supplies the safe null default.
create or replace function public.advance_student_learning_path(
  p_student_id uuid,
  p_node_id uuid,
  p_mastery numeric,
  p_completed_at timestamptz,
  p_evidence_expectation text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_path_id uuid;
  v_completed integer:=0;
  v_unlocked integer:=0;
begin
  if auth.role()<>'service_role' then raise exception 'service_role_required'; end if;
  if p_evidence_expectation is not null and p_evidence_expectation not in (
    'receptive','controlled_production','independent_production'
  ) then
    raise exception 'invalid_evidence_expectation' using errcode='22023';
  end if;

  select id into v_path_id
  from public.student_learning_paths
  where student_id=p_student_id and status='active'
  order by created_at desc
  limit 1
  for update;

  if v_path_id is null then
    return jsonb_build_object('pathId',null,'completed',0,'unlocked',0);
  end if;

  if p_mastery>=.85 then
    update public.student_learning_path_steps
    set status='completed',completed_at=p_completed_at
    where path_id=v_path_id and node_id=p_node_id
      and status in ('available','in_progress')
      and (
        required_evidence_expectation is null
        or required_evidence_expectation=p_evidence_expectation
      );
    get diagnostics v_completed=row_count;
  end if;

  update public.student_learning_path_steps step
  set status='available'
  where step.path_id=v_path_id and step.status='pending'
    and not exists (
      select 1
      from unnest(step.prerequisite_node_ids) prerequisite(node_id)
      left join public.student_learning_path_steps prerequisite_step
        on prerequisite_step.path_id=v_path_id
        and prerequisite_step.node_id=prerequisite.node_id
      left join public.student_competency_estimates estimate
        on estimate.student_id=p_student_id
        and estimate.node_id=prerequisite.node_id
      where case
        when prerequisite_step.id is not null
          then prerequisite_step.status<>'completed'
        else coalesce(estimate.mastery_probability,0)<.85
      end
    );
  get diagnostics v_unlocked=row_count;

  if not exists (
    select 1 from public.student_learning_path_steps
    where path_id=v_path_id and status not in ('completed','skipped')
  ) then
    update public.student_learning_paths
    set status='completed',completed_at=p_completed_at
    where id=v_path_id;
  end if;

  return jsonb_build_object(
    'pathId',v_path_id,'completed',v_completed,'unlocked',v_unlocked
  );
end
$$;

-- Backward-compatible entry point. Legacy trusted writers receive the safe
-- default of no evidence expectation, which cannot complete a guarded step.
create or replace function public.advance_student_learning_path(
  p_student_id uuid,
  p_node_id uuid,
  p_mastery numeric,
  p_completed_at timestamptz default now()
) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  return public.advance_student_learning_path(
    p_student_id,p_node_id,p_mastery,p_completed_at,null::text
  );
end
$$;

revoke all on function public.advance_student_learning_path(
  uuid,uuid,numeric,timestamptz,text
) from public,anon,authenticated;
grant execute on function public.advance_student_learning_path(
  uuid,uuid,numeric,timestamptz,text
) to service_role;

revoke all on function public.advance_student_learning_path(
  uuid,uuid,numeric,timestamptz
) from public,anon,authenticated;
grant execute on function public.advance_student_learning_path(
  uuid,uuid,numeric,timestamptz
) to service_role;

comment on function public.advance_student_learning_path(
  uuid,uuid,numeric,timestamptz,text
) is 'Advances the active path only when trusted mastery evidence matches a guarded step expectation.';
comment on function public.advance_student_learning_path(
  uuid,uuid,numeric,timestamptz
) is 'Legacy trusted wrapper; null evidence cannot complete an evidence-guarded step.';

commit;
