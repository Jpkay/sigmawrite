-- Disposable database, independent of production. Exercise the real functions
-- with modern JWT JSON, missing claims and an authenticated student role.
create role anon;
create role authenticated;
create role service_role;
create schema auth;
create function auth.role() returns text language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claim.role',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role')
$$;
grant usage on schema auth to anon,authenticated,service_role;
create table students(id uuid primary key);
create table reading_sessions(id uuid primary key,student_id uuid,abandoned boolean default false,completed_at timestamptz);
create function can_view_student(uuid) returns boolean language sql as $$ select false $$;
\ir ../../../supabase/migrations/0081_reading_completion_idempotency.sql
insert into students values ('10000000-0000-4000-8000-000000000001');
insert into reading_sessions(id,student_id) values
 ('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000001'),
 ('10000000-0000-4000-8000-000000000012','10000000-0000-4000-8000-000000000001');
set role service_role;
set request.jwt.claims='{"role":"service_role"}';
do $$ begin
 begin
  perform * from claim_reading_completion('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000001');
  raise exception 'Old guard did not reproduce modern JWT failure';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
\ir ../../../supabase/migrations/20260912121000_reading_completion_role_claims.sql
set role service_role;
do $$ declare r record; begin
 select * into r from claim_reading_completion('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000001');
 if not r.claimed then raise exception 'Service claim rejected'; end if;
 select * into r from claim_reading_completion('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000001');
 if r.claimed then raise exception 'Duplicate processing claim'; end if;
 perform finish_reading_completion('10000000-0000-4000-8000-000000000011','{"checked":true}');
 select * into r from claim_reading_completion('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000001');
 if r.claimed or r.status<>'completed' or r.result_payload<>'{"checked":true}'::jsonb then raise exception 'Completed replay changed'; end if;
 perform * from claim_reading_completion('10000000-0000-4000-8000-000000000012','10000000-0000-4000-8000-000000000001');
 perform fail_reading_completion('10000000-0000-4000-8000-000000000012','test failure');
 -- A missing role remains denied even when the database role has execute.
 perform set_config('request.jwt.claims','{}',false);
 begin
  perform finish_reading_completion('10000000-0000-4000-8000-000000000012','{}');
  raise exception 'Missing JWT role accepted';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
 if not exists(select 1 from reading_completion_runs where status='failed' and error_message='test failure') then raise exception 'Failed state missing'; end if;
 if not exists(select 1 from reading_sessions where abandoned) then raise exception 'Recovery marker missing'; end if;
 if has_function_privilege('authenticated','claim_reading_completion(uuid,uuid)','execute')
 or has_function_privilege('authenticated','finish_reading_completion(uuid,jsonb)','execute')
 or has_function_privilege('anon','fail_reading_completion(uuid,text)','execute') then raise exception 'Student or anonymous execution granted'; end if;
end $$;
set role authenticated;
set request.jwt.claims='{"role":"authenticated"}';
do $$ begin
 begin
  perform * from claim_reading_completion('10000000-0000-4000-8000-000000000012','10000000-0000-4000-8000-000000000001');
  raise exception 'Authenticated student claimed server workflow';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
