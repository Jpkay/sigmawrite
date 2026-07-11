-- Sprint 5: server-enforced per-user throttles and daily student AI budgets.

create table rate_limit_counters (
  subject_hash text not null,
  scope text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (subject_hash, scope)
);

create table student_daily_ai_budgets (
  student_id uuid not null references students(id) on delete cascade,
  budget_date date not null default current_date,
  units_used integer not null default 0 check (units_used >= 0),
  updated_at timestamptz not null default now(),
  primary key (student_id, budget_date)
);

alter table rate_limit_counters enable row level security;
alter table student_daily_ai_budgets enable row level security;
create policy rate_limits_admin_read on rate_limit_counters
  for select using (public.is_platform_admin());
create policy ai_budgets_admin_read on student_daily_ai_budgets
  for select using (public.is_platform_admin());
create policy ai_budgets_student_read on student_daily_ai_budgets
  for select using (public.owns_student(student_id));

create or replace function public.take_rate_limit(
  p_subject_hash text,
  p_scope text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql security definer set search_path = public as $$
declare
  v_row rate_limit_counters%rowtype;
  v_now timestamptz := now();
begin
  insert into rate_limit_counters (subject_hash, scope, window_started_at, request_count)
  values (p_subject_hash, p_scope, v_now, 0)
  on conflict (subject_hash, scope) do nothing;
  select * into v_row from rate_limit_counters
  where subject_hash = p_subject_hash and scope = p_scope
  for update;

  if v_row.window_started_at <= v_now - make_interval(secs => p_window_seconds) then
    update rate_limit_counters set window_started_at = v_now, request_count = 1, updated_at = v_now
    where subject_hash = p_subject_hash and scope = p_scope;
    return query select true, greatest(0, p_limit - 1), 0;
  elsif v_row.request_count >= p_limit then
    return query select false, 0,
      greatest(1, ceil(extract(epoch from (v_row.window_started_at + make_interval(secs => p_window_seconds) - v_now)))::integer);
    return;
  end if;

  update rate_limit_counters set request_count = request_count + 1, updated_at = v_now
  where subject_hash = p_subject_hash and scope = p_scope;
  return query select true, greatest(0, p_limit - v_row.request_count - 1), 0;
end;
$$;

revoke all on function public.take_rate_limit(text,text,integer,integer) from public;

create or replace function public.consume_auth_attempt(p_subject_hash text)
returns table (allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql security definer set search_path = public as $$
begin
  if p_subject_hash !~ '^[0-9a-f]{64}$' then
    return query select false, 0, 900;
    return;
  end if;
  return query select * from public.take_rate_limit(p_subject_hash, 'auth_attempt', 10, 900);
end;
$$;

create or replace function public.consume_student_action(p_scope text)
returns table (allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql security definer set search_path = public as $$
declare
  v_limit integer;
begin
  if auth.uid() is null then
    return query select false, 0, 600;
    return;
  end if;
  v_limit := case p_scope
    when 'submit_answer' then 60
    when 'free_text' then 15
    when 'start_session' then 20
    else null
  end;
  if v_limit is null then raise exception 'Unknown rate-limit scope'; end if;
  return query select * from public.take_rate_limit(auth.uid()::text, p_scope, v_limit, 600);
end;
$$;

create or replace function public.consume_student_llm_budget(p_student_id uuid, p_units integer default 1)
returns table (allowed boolean, remaining integer)
language plpgsql security definer set search_path = public as $$
declare
  v_used integer;
  v_limit constant integer := 100;
begin
  if not public.owns_student(p_student_id) or p_units < 1 or p_units > 10 then
    return query select false, 0;
    return;
  end if;
  insert into student_daily_ai_budgets (student_id, budget_date, units_used)
  values (p_student_id, current_date, 0)
  on conflict (student_id, budget_date) do nothing;
  select units_used into v_used from student_daily_ai_budgets
  where student_id = p_student_id and budget_date = current_date for update;
  if v_used + p_units > v_limit then
    return query select false, greatest(0, v_limit - v_used);
    return;
  end if;
  update student_daily_ai_budgets set units_used = units_used + p_units, updated_at = now()
  where student_id = p_student_id and budget_date = current_date;
  return query select true, greatest(0, v_limit - v_used - p_units);
end;
$$;

grant execute on function public.consume_auth_attempt(text) to anon, authenticated;
grant execute on function public.consume_student_action(text) to authenticated;
grant execute on function public.consume_student_llm_budget(uuid,integer) to authenticated;
