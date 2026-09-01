-- Diagnostic launch/runtime guards that must hold even when two application
-- requests race or a trusted caller presents stale aggregate mastery.

begin;

-- Preserve the newest in-flight run for each protocol before installing the
-- invariant. The table lock closes the migration-time race between cleanup and
-- index creation; older duplicates remain auditable as abandoned runs.
lock table public.diagnostic_runs in share row exclusive mode;

with ranked_running_runs as (
  select id,row_number() over (
    partition by student_id,protocol_version
    order by started_at desc,id desc
  ) as duplicate_rank
  from public.diagnostic_runs
  where status='running'
)
update public.diagnostic_runs run
set status='abandoned'
from ranked_running_runs ranked
where run.id=ranked.id and ranked.duplicate_rank>1;

create unique index diagnostic_runs_one_running_per_student_protocol
  on public.diagnostic_runs(student_id,protocol_version)
  where status='running';

comment on index public.diagnostic_runs_one_running_per_student_protocol is
  'Database race guard: a student may have only one running diagnostic for a protocol.';

-- A complete adaptive diagnostic can issue 80 probes. Keep ordinary answer
-- submissions at 60 per ten minutes, while allowing the diagnostic envelope
-- plus up to 40 exact network/idempotency retries in its own counter.
create or replace function public.consume_student_action(p_scope text)
returns table (allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql security definer set search_path = public as $$
declare
  v_limit integer;
begin
  if auth.uid() is null then
    return query select false,0,600;
    return;
  end if;
  v_limit:=case p_scope
    when 'submit_answer' then 60
    when 'diagnostic_answer' then 120
    when 'free_text' then 15
    when 'start_session' then 20
    else null
  end;
  if v_limit is null then raise exception 'Unknown rate-limit scope'; end if;
  return query select * from public.take_rate_limit(
    auth.uid()::text,p_scope,v_limit,600
  );
end
$$;

revoke all on function public.consume_student_action(text) from public,anon;
grant execute on function public.consume_student_action(text) to authenticated;

comment on function public.consume_student_action(text) is
  'Consumes a user-scoped action budget; diagnostic_answer has an isolated 120-call diagnostic envelope without changing submit_answer.';

-- A pending or skipped verification step cannot be completed by unrelated or
-- stale aggregate evidence. Likewise, when a prerequisite is deliberately
-- retained in the active path, that step (rather than the aggregate estimate)
-- is authoritative for unlocking its dependents.
create or replace function public.advance_student_learning_path(
  p_student_id uuid,p_node_id uuid,p_mastery numeric,
  p_completed_at timestamptz default now()
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_path_id uuid;
  v_completed integer:=0;
  v_unlocked integer:=0;
begin
  if auth.role()<>'service_role' then raise exception 'service_role_required'; end if;

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
      and status in ('available','in_progress');
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

revoke all on function public.advance_student_learning_path(
  uuid,uuid,numeric,timestamptz
) from public,anon,authenticated;
grant execute on function public.advance_student_learning_path(
  uuid,uuid,numeric,timestamptz
) to service_role;

comment on function public.advance_student_learning_path(
  uuid,uuid,numeric,timestamptz
) is 'Completes only started/available steps and requires retained prerequisite steps to complete before dependents unlock.';

commit;
