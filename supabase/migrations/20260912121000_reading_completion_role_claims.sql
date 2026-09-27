begin;
-- Use Supabase role resolution for modern JSON JWT claims as well as legacy settings.
create or replace function public.claim_reading_completion(p_session_id uuid,p_student_id uuid)
returns table(claimed boolean,status text,result_payload jsonb) language plpgsql security definer set search_path=public as $$
declare v public.reading_completion_runs%rowtype;begin
 if auth.role() is distinct from 'service_role' then raise exception 'service role required' using errcode='42501';end if;
 insert into public.reading_completion_runs(session_id,student_id) values(p_session_id,p_student_id) on conflict do nothing returning * into v;
 if found then return query select true,v.status,v.result_payload;return;end if;
 select * into v from public.reading_completion_runs where session_id=p_session_id for update;
 return query select false,v.status,v.result_payload;
end;$$;
create or replace function public.finish_reading_completion(p_session_id uuid,p_result jsonb)
returns void language plpgsql security definer set search_path=public as $$ begin
 if auth.role() is distinct from 'service_role' then raise exception 'service role required' using errcode='42501';end if;
 update public.reading_completion_runs set status='completed',result_payload=p_result,completed_at=now() where session_id=p_session_id and status='processing';
 if not found then raise exception 'completion claim missing';end if;
end;$$;
revoke all on function public.claim_reading_completion(uuid,uuid),public.finish_reading_completion(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.claim_reading_completion(uuid,uuid),public.finish_reading_completion(uuid,jsonb) to service_role;

create or replace function public.fail_reading_completion(p_session_id uuid,p_error text)returns void language plpgsql security definer set search_path=public as $$begin if auth.role() is distinct from 'service_role' then raise exception 'service role required' using errcode='42501';end if;update public.reading_completion_runs set status='failed',error_message=left(p_error,1000),completed_at=now()where session_id=p_session_id and status='processing';update public.reading_sessions set abandoned=true where id=p_session_id and completed_at is null;end;$$;
revoke all on function public.fail_reading_completion(uuid,text) from public,anon,authenticated;
grant execute on function public.fail_reading_completion(uuid,text) to service_role;
commit;
