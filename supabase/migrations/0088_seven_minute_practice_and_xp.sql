-- Seven-minute, exercise-first practice sessions with idempotent XP awards.
-- Competency memory already uses FSRS; next_review_at makes the resulting
-- schedule explicit so due practice can be selected without approximating it.

alter table public.student_competency_estimates
  add column if not exists next_review_at timestamptz;

create index if not exists student_competency_next_review_idx
  on public.student_competency_estimates(student_id, next_review_at)
  where next_review_at is not null;

create table public.practice_learning_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  node_id uuid not null references public.competency_nodes(id) on delete restrict,
  client_request_id uuid not null,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 minutes'),
  completed_at timestamptz,
  status text not null default 'active' check(status in ('active','completed','expired')),
  planned_exercises integer not null check(planned_exercises between 1 and 6),
  completed_exercises integer not null default 0 check(completed_exercises between 0 and 6),
  first_try_correct integer not null default 0 check(first_try_correct between 0 and 6),
  base_xp integer not null default 0 check(base_xp between 0 and 7),
  bonus_xp integer not null default 0 check(bonus_xp between 0 and 3),
  unique(student_id, client_request_id),
  check(expires_at <= started_at + interval '7 minutes'),
  check(completed_at is null or completed_at >= started_at)
);

alter table public.competency_attempts
  add column if not exists practice_session_id uuid
    references public.practice_learning_sessions(id) on delete set null,
  add column if not exists exercise_position smallint
    check(exercise_position between 0 and 5);

create index if not exists competency_attempts_practice_session_idx
  on public.competency_attempts(practice_session_id, attempted_at);

create table public.student_xp_ledger (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  event_key text not null,
  source_type text not null check(source_type in ('practice_lesson')),
  source_id uuid not null,
  base_xp integer not null check(base_xp >= 0),
  bonus_xp integer not null default 0 check(bonus_xp >= 0),
  awarded_at timestamptz not null default now(),
  unique(student_id, event_key)
);

create index if not exists student_xp_ledger_recent_idx
  on public.student_xp_ledger(student_id, awarded_at desc);

alter table public.practice_learning_sessions enable row level security;
alter table public.student_xp_ledger enable row level security;

create policy practice_learning_sessions_read
  on public.practice_learning_sessions for select
  using(public.can_view_student(student_id));

create policy student_xp_ledger_read
  on public.student_xp_ledger for select
  using(public.can_view_student(student_id));

grant select on public.practice_learning_sessions, public.student_xp_ledger to authenticated;

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

  update public.practice_learning_sessions set
    completed_at = greatest(p_completed_at, started_at),
    status = case when v_qualifies then 'completed' else 'expired' end,
    completed_exercises = least(v_completed, 6),
    first_try_correct = least(v_first_correct, 6),
    base_xp = v_base,
    bonus_xp = v_bonus
  where id = p_session_id;

  if v_qualifies then
    insert into public.student_xp_ledger(
      student_id,event_key,source_type,source_id,base_xp,bonus_xp,awarded_at
    ) values (
      p_student_id,'practice_session:' || p_session_id::text,
      'practice_lesson',p_session_id,v_base,v_bonus,greatest(p_completed_at,v_session.started_at)
    ) on conflict(student_id,event_key) do nothing;

    insert into public.student_daily_activity(
      student_id,activity_date,practice_steps,goal_completed
    ) values (
      p_student_id,(greatest(p_completed_at,v_session.started_at) at time zone 'UTC')::date,1,true
    ) on conflict(student_id,activity_date) do update set
      practice_steps = public.student_daily_activity.practice_steps + 1,
      goal_completed = true;
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

revoke all on function public.complete_practice_learning_session(uuid,uuid,timestamptz) from public;
grant execute on function public.complete_practice_learning_session(uuid,uuid,timestamptz) to authenticated, service_role;

comment on table public.practice_learning_sessions is
  'Server-timed practice lessons: at most six exercises and seven minutes, with idempotent XP completion.';
comment on table public.student_xp_ledger is
  'Append-only, idempotent XP awards. Practice lessons grant 7 XP plus a 3 XP first-try perfect bonus.';
comment on column public.student_competency_estimates.next_review_at is
  'Explicit next review date derived from the node FSRS memory state.';
