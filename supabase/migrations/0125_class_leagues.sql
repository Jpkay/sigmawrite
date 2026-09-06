-- Class leagues (roadmap 6.6, product decision 2026-09-06): weekly XP ranking
-- with streak days, Duolingo-style tiers from cumulative XP. Safeguards for
-- minors: scoped to one class (never global), a teacher can switch a class
-- league off, and a student or guardian can hide the name while staying
-- counted. Only aggregates leave the database.

alter table public.classes add column if not exists league_enabled boolean not null default true;
alter table public.student_motivation_settings add column if not exists league_visible boolean not null default true;

create or replace function public.league_tier(p_total_xp integer)
returns text language sql immutable as $$
  select case
    when p_total_xp >= 5000 then 'diamant'
    when p_total_xp >= 2000 then 'platine'
    when p_total_xp >= 750 then 'or'
    when p_total_xp >= 250 then 'argent'
    else 'bronze' end
$$;

-- Weekly league of one class: XP earned this week, current streak (goal days
-- or freezes, consecutive up to today or yesterday), total XP and tier.
create or replace function public.class_league(p_class_id uuid, p_week_start date)
returns table (
  student_id uuid, display_name text, visible boolean, is_me boolean,
  week_xp integer, streak integer, total_xp integer, tier text, rank integer
)
language sql stable security definer set search_path = public as $$
  with allowed as (
    select (
      current_setting('request.jwt.claim.role', true) = 'service_role'
      or public.teaches_class(p_class_id) or public.is_staff()
      or exists (select 1 from public.enrollments e where e.class_id = p_class_id and e.status = 'active' and public.owns_student(e.student_id))
    ) ok
  ),
  members as (
    select s.id, coalesce(s.display_name, p.display_name, p.username, 'Élève') display_name,
      coalesce(ms.league_visible, true) visible, public.owns_student(s.id) is_me
    from public.enrollments e
    join public.students s on s.id = e.student_id
    left join public.profiles p on p.id = s.profile_id
    left join public.student_motivation_settings ms on ms.student_id = s.id
    where e.class_id = p_class_id and e.status = 'active'
  ),
  week as (
    select a.student_id, sum(a.xp_earned)::int week_xp
    from public.student_daily_activity a
    where a.activity_date >= p_week_start and a.activity_date < p_week_start + 7
    group by a.student_id
  ),
  totals as (
    select l.student_id, sum(l.base_xp + l.bonus_xp)::int total_xp
    from public.student_xp_ledger l group by l.student_id
  ),
  qualifying as (
    select a.student_id, (current_date - a.activity_date) offs,
      row_number() over (partition by a.student_id order by a.activity_date desc) rn
    from public.student_daily_activity a
    where (a.goal_completed or a.streak_freeze_used) and a.activity_date >= current_date - 400
  ),
  streaks as (
    select q.student_id,
      case when min(q.offs) > 1 then 0
        else count(*) filter (where q.offs - q.rn + 1 = (select min(offs) from qualifying q2 where q2.student_id = q.student_id)) end::int streak
    from qualifying q group by q.student_id
  ),
  ranked as (
    select m.id student_id,
      case when m.visible or m.is_me then m.display_name else 'Un·e camarade' end display_name,
      m.visible, m.is_me,
      coalesce(w.week_xp, 0) week_xp, coalesce(st.streak, 0) streak, coalesce(t.total_xp, 0) total_xp,
      public.league_tier(coalesce(t.total_xp, 0)) tier,
      rank() over (order by coalesce(w.week_xp, 0) desc, coalesce(st.streak, 0) desc, coalesce(t.total_xp, 0) desc, m.display_name)::int rank
    from members m
    left join week w on w.student_id = m.id
    left join totals t on t.student_id = m.id
    left join streaks st on st.student_id = m.id
  )
  select r.student_id, r.display_name, r.visible, r.is_me, r.week_xp, r.streak, r.total_xp, r.tier, r.rank
  from ranked r, allowed
  where allowed.ok and exists (select 1 from public.classes c where c.id = p_class_id and c.league_enabled)
  order by r.rank
$$;
revoke all on function public.class_league(uuid,date) from public;
grant execute on function public.class_league(uuid,date) to authenticated, service_role;

create or replace function public.set_league_visibility(p_student_id uuid, p_visible boolean)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.role() <> 'service_role' and not public.owns_student(p_student_id) and not public.can_view_student(p_student_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.student_motivation_settings(student_id, league_visible) values (p_student_id, p_visible)
  on conflict (student_id) do update set league_visible = excluded.league_visible, updated_at = now();
  return p_visible;
end $$;
revoke all on function public.set_league_visibility(uuid,boolean) from public;
grant execute on function public.set_league_visibility(uuid,boolean) to authenticated, service_role;

create or replace function public.set_class_league_enabled(p_class_id uuid, p_enabled boolean)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.role() <> 'service_role' and not public.teaches_class(p_class_id) and not public.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.classes set league_enabled = p_enabled where id = p_class_id;
  return p_enabled;
end $$;
revoke all on function public.set_class_league_enabled(uuid,boolean) from public;
grant execute on function public.set_class_league_enabled(uuid,boolean) to authenticated, service_role;
