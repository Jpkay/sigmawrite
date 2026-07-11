-- Sprint 11: inferred interest evidence and vector similarity operations.

create table if not exists public.student_interest_stats (
  student_id uuid not null references public.students(id) on delete cascade,
  interest_key text not null,
  sessions_started integer not null default 0,
  sessions_completed integer not null default 0,
  completion_rate numeric not null default 0,
  avg_success numeric not null default 0,
  avg_time_on_task numeric not null default 0,
  abandon_count integer not null default 0,
  inferred_strength numeric not null default 0 check (inferred_strength between 0 and 1),
  last_used_at timestamptz,
  primary key (student_id, interest_key)
);
alter table public.student_interest_stats enable row level security;
create policy student_interest_stats_select on public.student_interest_stats for select using (public.can_view_student(student_id));

alter table public.text_versions add column if not exists embedding_model text;

create or replace function public.match_text_versions(
  p_embedding vector(1536), p_threshold numeric default 0.92, p_limit integer default 5
)
returns table(text_version_id uuid, title text, similarity numeric)
language sql stable set search_path = public as $$
  select tv.id, tv.title, (1 - (tv.embedding <=> p_embedding))::numeric as similarity
  from public.text_versions tv
  where tv.embedding is not null
    and tv.review_status in ('human_approved','benchmark_locked')
    and 1 - (tv.embedding <=> p_embedding) >= p_threshold
  order by tv.embedding <=> p_embedding
  limit p_limit
$$;
grant execute on function public.match_text_versions(vector,numeric,integer) to authenticated;

create or replace function public.record_interest_session(
  p_student_id uuid, p_interest_key text, p_completed boolean, p_success numeric, p_time_seconds integer
)
returns void language plpgsql security definer set search_path = public as $$
declare v_started integer; v_completed integer; v_avg_success numeric; v_avg_time numeric; v_abandoned integer;
begin
  if not public.owns_student(p_student_id) and auth.role() <> 'service_role' then raise exception 'forbidden' using errcode='42501'; end if;
  insert into public.student_interest_stats (student_id, interest_key, sessions_started, sessions_completed, abandon_count, last_used_at)
  values (p_student_id, p_interest_key, 1, case when p_completed then 1 else 0 end, case when p_completed then 0 else 1 end, now())
  on conflict (student_id, interest_key) do update set
    sessions_started = student_interest_stats.sessions_started + 1,
    sessions_completed = student_interest_stats.sessions_completed + case when p_completed then 1 else 0 end,
    abandon_count = student_interest_stats.abandon_count + case when p_completed then 0 else 1 end,
    last_used_at = now();
  select sessions_started,sessions_completed,avg_success,avg_time_on_task,abandon_count into v_started,v_completed,v_avg_success,v_avg_time,v_abandoned
    from public.student_interest_stats where student_id=p_student_id and interest_key=p_interest_key for update;
  update public.student_interest_stats set
    completion_rate = v_completed::numeric / greatest(v_started,1),
    avg_success = case when p_completed then ((v_avg_success * greatest(v_completed-1,0)) + coalesce(p_success,0)) / greatest(v_completed,1) else v_avg_success end,
    avg_time_on_task = case when p_completed then ((v_avg_time * greatest(v_completed-1,0)) + coalesce(p_time_seconds,0)) / greatest(v_completed,1) else v_avg_time end,
    inferred_strength = least(1, greatest(0, (v_completed::numeric/greatest(v_started,1))*0.35 + coalesce(p_success,0)*0.35 + least(v_completed,5)/5.0*0.3 - least(v_abandoned,3)*0.12))
  where student_id=p_student_id and interest_key=p_interest_key;
end $$;
revoke all on function public.record_interest_session(uuid,text,boolean,numeric,integer) from public;
grant execute on function public.record_interest_session(uuid,text,boolean,numeric,integer) to authenticated, service_role;
