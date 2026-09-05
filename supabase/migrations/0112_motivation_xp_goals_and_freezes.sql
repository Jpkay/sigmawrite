-- Motivation v1 (roadmap 6.1–6.3): every learning activity awards
-- effort-calibrated XP through one idempotent function, the daily goal is a
-- settable XP target instead of a binary flag, and streaks can be protected
-- by earned (never purchased) freezes.

alter table public.student_xp_ledger drop constraint if exists student_xp_ledger_source_type_check;
alter table public.student_xp_ledger add constraint student_xp_ledger_source_type_check
  check(source_type in (
    'practice_lesson','reading_session','retrieval_review',
    'vocabulary_review','independent_production','dictation'
  ));

alter table public.student_daily_activity
  add column if not exists xp_earned integer not null default 0 check(xp_earned >= 0),
  add column if not exists writing_tasks integer not null default 0 check(writing_tasks >= 0),
  add column if not exists streak_freeze_used boolean not null default false;

create table public.student_motivation_settings (
  student_id uuid primary key references public.students(id) on delete cascade,
  daily_xp_goal integer not null default 10 check(daily_xp_goal in (10,15,20)),
  streak_freezes_available integer not null default 0 check(streak_freezes_available between 0 and 2),
  streak_freezes_earned integer not null default 0 check(streak_freezes_earned >= 0),
  last_freeze_milestone integer not null default 0 check(last_freeze_milestone >= 0),
  updated_at timestamptz not null default now()
);

alter table public.student_motivation_settings enable row level security;
create policy student_motivation_settings_read
  on public.student_motivation_settings for select
  using(public.can_view_student(student_id));
grant select on public.student_motivation_settings to authenticated;

create or replace function public.award_student_xp(
  p_student_id uuid,
  p_event_key text,
  p_source_type text,
  p_source_id uuid,
  p_base_xp integer,
  p_bonus_xp integer default 0,
  p_awarded_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted boolean := false;
  v_day date := (p_awarded_at at time zone 'UTC')::date;
  v_goal integer;
  v_day_xp integer;
  v_goal_completed boolean;
begin
  if auth.role() <> 'service_role' and not public.owns_student(p_student_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_base_xp < 0 or p_bonus_xp < 0 or p_base_xp + p_bonus_xp > 30 then
    raise exception 'xp_out_of_range';
  end if;

  insert into public.student_motivation_settings(student_id)
  values (p_student_id) on conflict (student_id) do nothing;
  select daily_xp_goal into v_goal from public.student_motivation_settings where student_id = p_student_id;

  insert into public.student_xp_ledger(student_id,event_key,source_type,source_id,base_xp,bonus_xp,awarded_at)
  values (p_student_id,p_event_key,p_source_type,p_source_id,p_base_xp,p_bonus_xp,p_awarded_at)
  on conflict(student_id,event_key) do nothing;
  v_inserted := found;

  if v_inserted then
    insert into public.student_daily_activity(student_id,activity_date,xp_earned,goal_completed)
    values (p_student_id,v_day,p_base_xp + p_bonus_xp,p_base_xp + p_bonus_xp >= v_goal)
    on conflict(student_id,activity_date) do update set
      xp_earned = public.student_daily_activity.xp_earned + excluded.xp_earned,
      goal_completed = public.student_daily_activity.goal_completed
        or public.student_daily_activity.xp_earned + excluded.xp_earned >= v_goal;
  end if;

  select xp_earned, goal_completed into v_day_xp, v_goal_completed
  from public.student_daily_activity where student_id = p_student_id and activity_date = v_day;

  return jsonb_build_object(
    'awarded', v_inserted,
    'xp', case when v_inserted then p_base_xp + p_bonus_xp else 0 end,
    'dayXp', coalesce(v_day_xp,0),
    'goalXp', v_goal,
    'goalCompleted', coalesce(v_goal_completed,false)
  );
end
$$;

revoke all on function public.award_student_xp(uuid,text,text,uuid,integer,integer,timestamptz) from public;
grant execute on function public.award_student_xp(uuid,text,text,uuid,integer,integer,timestamptz) to authenticated, service_role;

create or replace function public.set_daily_xp_goal(p_student_id uuid, p_goal integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' and not public.owns_student(p_student_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.student_motivation_settings(student_id,daily_xp_goal)
  values (p_student_id,p_goal)
  on conflict(student_id) do update set daily_xp_goal = excluded.daily_xp_goal, updated_at = now();
  return p_goal;
end
$$;

revoke all on function public.set_daily_xp_goal(uuid,integer) from public;
grant execute on function public.set_daily_xp_goal(uuid,integer) to authenticated, service_role;

-- Consume one earned freeze for a missed day so the streak survives. The day
-- must be a real gap (no goal completed, no freeze already used) preceded by a
-- completed day, so freezes never pad an inactive account.
create or replace function public.apply_streak_freeze(p_student_id uuid, p_missed_day date)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available integer;
  v_missed boolean;
  v_prior boolean;
begin
  if auth.role() <> 'service_role' and not public.owns_student(p_student_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select streak_freezes_available into v_available
  from public.student_motivation_settings where student_id = p_student_id for update;
  if coalesce(v_available,0) <= 0 then return false; end if;

  select not coalesce(bool_or(goal_completed or streak_freeze_used),false) into v_missed
  from public.student_daily_activity where student_id = p_student_id and activity_date = p_missed_day;
  select coalesce(bool_or(goal_completed or streak_freeze_used),false) into v_prior
  from public.student_daily_activity where student_id = p_student_id and activity_date = p_missed_day - 1;
  if not v_missed or not v_prior then return false; end if;

  insert into public.student_daily_activity(student_id,activity_date,streak_freeze_used)
  values (p_student_id,p_missed_day,true)
  on conflict(student_id,activity_date) do update set streak_freeze_used = true;
  update public.student_motivation_settings
  set streak_freezes_available = streak_freezes_available - 1, updated_at = now()
  where student_id = p_student_id;
  return true;
end
$$;

revoke all on function public.apply_streak_freeze(uuid,date) from public;
grant execute on function public.apply_streak_freeze(uuid,date) to authenticated, service_role;

-- Grant one freeze (max two banked) each time a new seven-day milestone is
-- reached. Idempotent per milestone.
create or replace function public.grant_streak_freeze_for_milestone(p_student_id uuid, p_streak integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_milestone integer := (p_streak / 7) * 7;
  v_last integer;
begin
  if auth.role() <> 'service_role' and not public.owns_student(p_student_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_milestone < 7 then return false; end if;
  insert into public.student_motivation_settings(student_id)
  values (p_student_id) on conflict (student_id) do nothing;
  select last_freeze_milestone into v_last
  from public.student_motivation_settings where student_id = p_student_id for update;
  if v_last >= v_milestone then return false; end if;
  update public.student_motivation_settings set
    last_freeze_milestone = v_milestone,
    streak_freezes_earned = streak_freezes_earned + 1,
    streak_freezes_available = least(2, streak_freezes_available + 1),
    updated_at = now()
  where student_id = p_student_id;
  return true;
end
$$;

revoke all on function public.grant_streak_freeze_for_milestone(uuid,integer) from public;
grant execute on function public.grant_streak_freeze_for_milestone(uuid,integer) to authenticated, service_role;

-- Practice completion now awards XP through the shared function so the daily
-- goal reflects the XP target rather than being forced true by one lesson.
create or replace function public.complete_practice_learning_session(
  p_session_id uuid,
  p_student_id uuid,
  p_completed_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.practice_learning_sessions%rowtype;
  v_completed integer := 0;
  v_first_correct integer := 0;
  v_qualifies boolean := false;
  v_perfect boolean := false;
  v_base integer := 0;
  v_bonus integer := 0;
  v_at timestamptz;
begin
  if auth.role() <> 'service_role' and not public.owns_student(p_student_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_session
  from public.practice_learning_sessions
  where id = p_session_id and student_id = p_student_id
  for update;
  if not found then raise exception 'practice_session_not_found'; end if;

  if v_session.completed_at is not null then
    return jsonb_build_object(
      'completed', v_session.status = 'completed',
      'expired', v_session.status = 'expired',
      'exercisesCompleted', v_session.completed_exercises,
      'plannedExercises', v_session.planned_exercises,
      'firstTryCorrect', v_session.first_try_correct,
      'baseXp', v_session.base_xp,
      'bonusXp', v_session.bonus_xp,
      'totalXp', v_session.base_xp + v_session.bonus_xp
    );
  end if;

  select count(distinct exercise_position) filter(where is_correct is true)::integer
  into v_completed
  from public.competency_attempts
  where practice_session_id = p_session_id;

  select count(*) filter(where first_attempt_correct)::integer
  into v_first_correct
  from (
    select distinct on (exercise_position)
      exercise_position,
      (is_correct is true and hints_used = 0) as first_attempt_correct
    from public.competency_attempts
    where practice_session_id = p_session_id
    order by exercise_position, attempted_at, id
  ) first_attempts;

  v_qualifies := v_completed >= v_session.planned_exercises;
  v_perfect := v_qualifies and v_first_correct = v_session.planned_exercises;
  v_base := case when v_qualifies then 7 else 0 end;
  v_bonus := case when v_perfect then 3 else 0 end;
  v_at := greatest(p_completed_at, v_session.started_at);

  update public.practice_learning_sessions set
    completed_at = v_at,
    status = case when v_qualifies then 'completed' else 'expired' end,
    completed_exercises = least(v_completed, 6),
    first_try_correct = least(v_first_correct, 6),
    base_xp = v_base,
    bonus_xp = v_bonus
  where id = p_session_id;

  if v_qualifies then
    perform public.award_student_xp(
      p_student_id,'practice_session:' || p_session_id::text,'practice_lesson',
      p_session_id,v_base,v_bonus,v_at
    );
    insert into public.student_daily_activity(student_id,activity_date,practice_steps)
    values (p_student_id,(v_at at time zone 'UTC')::date,1)
    on conflict(student_id,activity_date) do update set
      practice_steps = public.student_daily_activity.practice_steps + 1;
  end if;

  return jsonb_build_object(
    'completed', v_qualifies,
    'expired', not v_qualifies,
    'exercisesCompleted', least(v_completed, 6),
    'plannedExercises', v_session.planned_exercises,
    'firstTryCorrect', least(v_first_correct, 6),
    'baseXp', v_base,
    'bonusXp', v_bonus,
    'totalXp', v_base + v_bonus
  );
end
$$;

comment on table public.student_motivation_settings is
  'Per-student daily XP goal (10/15/20 ≈ focused minutes) and earned streak freezes. Freezes are never purchased or wagered.';
comment on function public.award_student_xp(uuid,text,text,uuid,integer,integer,timestamptz) is
  'Idempotent XP award: one ledger row per event key, daily XP accumulation and goal completion against the student target.';
comment on column public.student_daily_activity.streak_freeze_used is
  'A missed day covered by an earned freeze; counts as streak-preserving but not as goal completion.';
