-- Preserve shadow evidence, introduce a bounded live trial, and make every
-- evidence-gated promotion or manual rollback an immutable policy version.

alter table public.content_reuse_policies
  drop constraint content_reuse_policies_mode_check,
  add constraint content_reuse_policies_mode_check
    check (mode in ('off','shadow','trial','live')),
  add column trial_cohort_percent integer not null default 10
    check (trial_cohort_percent between 1 and 100);

alter table public.content_reuse_observations
  drop constraint content_reuse_observations_mode_check,
  add constraint content_reuse_observations_mode_check
    check (mode in ('shadow','trial','live')),
  add column matcher_exposed boolean not null default false;

create table public.content_reuse_policy_events (
  id uuid primary key default gen_random_uuid(),
  from_policy_id uuid not null references public.content_reuse_policies(id) on delete restrict,
  to_policy_id uuid not null references public.content_reuse_policies(id) on delete restrict,
  event_type text not null
    check (event_type in ('started_live_trial','promoted_live','returned_to_shadow','disabled')),
  evidence_snapshot jsonb not null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.transition_content_reuse_policy(
  p_policy_id uuid,
  p_mode text,
  p_minimum_score numeric,
  p_evidence jsonb,
  p_actor_profile_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_policy public.content_reuse_policies;
  next_id uuid;
  next_version integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  if p_mode not in ('off','shadow','trial','live') then
    raise exception 'invalid_reuse_mode';
  end if;
  if p_minimum_score < 0 or p_minimum_score > 1 then
    raise exception 'invalid_reuse_threshold';
  end if;

  select * into current_policy
  from public.content_reuse_policies
  where id = p_policy_id and active
  for update;
  if not found then raise exception 'active_reuse_policy_not_found'; end if;

  if current_policy.mode = 'shadow' and p_mode = 'trial'
    and coalesce(p_evidence->>'decision','') <> 'eligible_for_trial' then
    raise exception 'shadow_calibration_evidence_required';
  end if;
  if p_mode = 'trial' and current_policy.mode <> 'shadow' then
    raise exception 'trial_requires_shadow';
  end if;
  if current_policy.mode = 'trial' and p_mode = 'live'
    and coalesce(p_evidence->>'decision','') <> 'eligible_for_live' then
    raise exception 'trial_calibration_evidence_required';
  end if;
  if p_mode = 'live' and current_policy.mode <> 'trial' then
    raise exception 'live_requires_trial';
  end if;

  select coalesce(max(version), 0) + 1 into next_version
  from public.content_reuse_policies
  where policy_key = current_policy.policy_key;

  update public.content_reuse_policies set active = false where id = current_policy.id;
  insert into public.content_reuse_policies(
    policy_key, version, mode, minimum_score, recent_exclusion_days,
    maximum_candidates, trial_cohort_percent, minimum_calibration_observations,
    minimum_completion_rate, minimum_average_success, weights, active
  ) values (
    current_policy.policy_key, next_version, p_mode, p_minimum_score,
    current_policy.recent_exclusion_days, current_policy.maximum_candidates,
    current_policy.trial_cohort_percent,
    current_policy.minimum_calibration_observations,
    current_policy.minimum_completion_rate, current_policy.minimum_average_success,
    current_policy.weights, true
  ) returning id into next_id;

  insert into public.content_reuse_policy_events(
    from_policy_id, to_policy_id, event_type, evidence_snapshot, actor_profile_id
  ) values (
    current_policy.id, next_id,
    case when p_mode = 'trial' then 'started_live_trial'
      when p_mode = 'live' then 'promoted_live'
      when p_mode = 'shadow' then 'returned_to_shadow'
      else 'disabled' end,
    p_evidence, p_actor_profile_id
  );
  return next_id;
end;
$$;
revoke all on function public.transition_content_reuse_policy(uuid,text,numeric,jsonb,uuid) from public;
grant execute on function public.transition_content_reuse_policy(uuid,text,numeric,jsonb,uuid) to service_role;

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
  o.created_at,
  o.matcher_exposed
from public.content_reuse_observations o
left join public.reading_sessions r on r.reuse_observation_id = o.id;

alter table public.content_reuse_policy_events enable row level security;
create policy content_reuse_policy_events_staff_read on public.content_reuse_policy_events
  for select using (public.is_staff());
grant select on public.content_reuse_policy_events to authenticated;

comment on column public.content_reuse_observations.matcher_exposed is
  'True only when the matcher was permitted to change the displayed recommendation order.';
comment on table public.content_reuse_policy_events is
  'Immutable evidence and actor record for reuse rollout transitions.';
