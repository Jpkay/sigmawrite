-- At-most-once boundary for the multi-system reading completion workflow.
create table if not exists public.reading_completion_runs(
  session_id uuid primary key references public.reading_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null default 'processing' check(status in ('processing','completed','failed')),
  result_payload jsonb,
  started_at timestamptz not null default now(),completed_at timestamptz,error_message text
);
alter table public.reading_completion_runs enable row level security;
create policy reading_completion_runs_view on public.reading_completion_runs for select using(public.can_view_student(student_id));
create or replace function public.claim_reading_completion(p_session_id uuid,p_student_id uuid)
returns table(claimed boolean,status text,result_payload jsonb) language plpgsql security definer set search_path=public as $$
declare v public.reading_completion_runs%rowtype;begin
 if current_setting('request.jwt.claim.role',true) is distinct from 'service_role' then raise exception 'service role required' using errcode='42501';end if;
 insert into public.reading_completion_runs(session_id,student_id) values(p_session_id,p_student_id) on conflict do nothing returning * into v;
 if found then return query select true,v.status,v.result_payload;return;end if;
 select * into v from public.reading_completion_runs where session_id=p_session_id for update;
 return query select false,v.status,v.result_payload;
end;$$;
create or replace function public.finish_reading_completion(p_session_id uuid,p_result jsonb)
returns void language plpgsql security definer set search_path=public as $$ begin
 if current_setting('request.jwt.claim.role',true) is distinct from 'service_role' then raise exception 'service role required' using errcode='42501';end if;
 update public.reading_completion_runs set status='completed',result_payload=p_result,completed_at=now() where session_id=p_session_id and status='processing';
 if not found then raise exception 'completion claim missing';end if;
end;$$;
revoke all on function public.claim_reading_completion(uuid,uuid),public.finish_reading_completion(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.claim_reading_completion(uuid,uuid),public.finish_reading_completion(uuid,jsonb) to service_role;
