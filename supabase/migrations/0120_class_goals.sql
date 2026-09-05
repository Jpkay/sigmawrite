-- Class cooperative goal (roadmap 6.5): a weekly XP target for the whole
-- class. Students only ever see the class aggregate, never a ranking.
create table public.class_goals (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  week_start date not null,
  target_xp integer not null check (target_xp between 50 and 20000),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (class_id, week_start)
);
alter table public.class_goals enable row level security;
create policy class_goals_read on public.class_goals for select using (
  public.teaches_class(class_id)
  or exists (select 1 from public.enrollments e join public.students s on s.id = e.student_id
             where e.class_id = class_goals.class_id and e.status = 'active' and public.owns_student(s.id))
  or public.is_staff()
);
grant select on public.class_goals to authenticated;

-- Aggregate progress: total XP earned by active class members during the goal week.
create or replace function public.class_goal_progress(p_class_id uuid, p_week_start date)
returns table (target_xp integer, earned_xp bigint, members integer, active_members integer)
language sql stable security definer set search_path = public as $$
  select g.target_xp,
    coalesce((select sum(a.xp_earned) from public.student_daily_activity a
              join public.enrollments e on e.student_id = a.student_id and e.class_id = p_class_id and e.status = 'active'
              where a.activity_date >= p_week_start and a.activity_date < p_week_start + 7), 0) as earned_xp,
    (select count(*) from public.enrollments e where e.class_id = p_class_id and e.status = 'active')::int as members,
    (select count(distinct a.student_id) from public.student_daily_activity a
      join public.enrollments e on e.student_id = a.student_id and e.class_id = p_class_id and e.status = 'active'
      where a.activity_date >= p_week_start and a.activity_date < p_week_start + 7 and a.xp_earned > 0)::int as active_members
  from public.class_goals g where g.class_id = p_class_id and g.week_start = p_week_start
$$;
revoke all on function public.class_goal_progress(uuid,date) from public;
grant execute on function public.class_goal_progress(uuid,date) to authenticated, service_role;

create or replace function public.set_class_goal(p_class_id uuid, p_week_start date, p_target_xp integer)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.role() <> 'service_role' and not public.teaches_class(p_class_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.class_goals(class_id, week_start, target_xp, created_by)
  values (p_class_id, p_week_start, p_target_xp, public.current_profile_id())
  on conflict (class_id, week_start) do update set target_xp = excluded.target_xp
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.set_class_goal(uuid,date,integer) from public;
grant execute on function public.set_class_goal(uuid,date,integer) to authenticated, service_role;
