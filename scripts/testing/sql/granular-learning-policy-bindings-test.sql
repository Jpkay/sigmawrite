-- Disposable PostgreSQL only. Synthetic eligibility predicates isolate RLS binding behavior.
create role authenticated;
create function owns_student(p uuid) returns boolean language sql stable as $$ select p::text=current_setting('plume_test.student_id',true) $$;
create function student_legacy_learning_is_unlocked(p uuid) returns boolean language sql stable as $$ select p='10000000-0000-4000-8000-000000000001'::uuid $$;
create function student_learning_is_unlocked(p uuid) returns boolean language sql stable as $$ select p in ('10000000-0000-4000-8000-000000000001'::uuid,'10000000-0000-4000-8000-000000000002'::uuid) $$;
create table competency_attempts(id uuid default gen_random_uuid(), student_id uuid, session_id uuid, retrieval_card_id uuid);
alter table competency_attempts enable row level security;
grant select,insert,update,delete on competency_attempts to authenticated;
create policy fixture_select on competency_attempts for select using (owns_student(student_id));
create table learning_retrieval_schedules(id uuid default gen_random_uuid(), student_id uuid, session_id uuid, retrieval_card_id uuid);
alter table learning_retrieval_schedules enable row level security;
grant select,insert,update,delete on learning_retrieval_schedules to authenticated;
create policy fixture_select on learning_retrieval_schedules for select using (owns_student(student_id));
create table quiz_responses(id uuid default gen_random_uuid(), student_id uuid, session_id uuid, retrieval_card_id uuid);
alter table quiz_responses enable row level security;
grant select,insert,update,delete on quiz_responses to authenticated;
create policy fixture_select on quiz_responses for select using (owns_student(student_id));
create table quiz_sessions(id uuid default gen_random_uuid(), student_id uuid, session_id uuid, retrieval_card_id uuid);
alter table quiz_sessions enable row level security;
grant select,insert,update,delete on quiz_sessions to authenticated;
create policy fixture_select on quiz_sessions for select using (owns_student(student_id));
create table reading_session_events(id uuid default gen_random_uuid(), student_id uuid, session_id uuid, retrieval_card_id uuid);
alter table reading_session_events enable row level security;
grant select,insert,update,delete on reading_session_events to authenticated;
create policy fixture_select on reading_session_events for select using (owns_student(student_id));
create table reading_sessions(id uuid default gen_random_uuid(), student_id uuid, session_id uuid, retrieval_card_id uuid);
alter table reading_sessions enable row level security;
grant select,insert,update,delete on reading_sessions to authenticated;
create policy fixture_select on reading_sessions for select using (owns_student(student_id));
create table retrieval_cards(id uuid default gen_random_uuid(), student_id uuid, session_id uuid, retrieval_card_id uuid);
alter table retrieval_cards enable row level security;
grant select,insert,update,delete on retrieval_cards to authenticated;
create policy fixture_select on retrieval_cards for select using (owns_student(student_id));
create table retrieval_schedules(id uuid default gen_random_uuid(), student_id uuid, session_id uuid, retrieval_card_id uuid);
alter table retrieval_schedules enable row level security;
grant select,insert,update,delete on retrieval_schedules to authenticated;
create policy fixture_select on retrieval_schedules for select using (owns_student(student_id));
create table student_answers(id uuid default gen_random_uuid(), student_id uuid, session_id uuid, retrieval_card_id uuid);
alter table student_answers enable row level security;
grant select,insert,update,delete on student_answers to authenticated;
create policy fixture_select on student_answers for select using (owns_student(student_id));
create table student_package_progress(id uuid default gen_random_uuid(), student_id uuid, session_id uuid, retrieval_card_id uuid);
alter table student_package_progress enable row level security;
grant select,insert,update,delete on student_package_progress to authenticated;
create policy fixture_select on student_package_progress for select using (owns_student(student_id));
create table student_reading_estimates(id uuid default gen_random_uuid(), student_id uuid, session_id uuid, retrieval_card_id uuid);
alter table student_reading_estimates enable row level security;
grant select,insert,update,delete on student_reading_estimates to authenticated;
create policy fixture_select on student_reading_estimates for select using (owns_student(student_id));
create table student_skill_estimates(id uuid default gen_random_uuid(), student_id uuid, session_id uuid, retrieval_card_id uuid);
alter table student_skill_estimates enable row level security;
grant select,insert,update,delete on student_skill_estimates to authenticated;
create policy fixture_select on student_skill_estimates for select using (owns_student(student_id));
create table student_word_mastery(id uuid default gen_random_uuid(), student_id uuid, session_id uuid, retrieval_card_id uuid);
alter table student_word_mastery enable row level security;
grant select,insert,update,delete on student_word_mastery to authenticated;
create policy fixture_select on student_word_mastery for select using (owns_student(student_id));
create policy competency_attempts_insert on competency_attempts for INSERT with check ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id)));
create policy learning_retrieval_student_write on learning_retrieval_schedules for ALL using ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id))) with check ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id)));
create policy quiz_response_write on quiz_responses for INSERT with check ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id)));
create policy quiz_session_write on quiz_sessions for ALL using ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id))) with check ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id)));
create policy events_insert on reading_session_events for INSERT with check ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id)));
create policy sessions_insert on reading_sessions for INSERT with check ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id)));
create policy sessions_update on reading_sessions for UPDATE using ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id))) with check ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id)));
create policy retrieval_cards_insert on retrieval_cards for INSERT with check ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id)));
create policy retrieval_cards_update on retrieval_cards for UPDATE using ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id))) with check ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id)));
create policy retrieval_schedules_insert on retrieval_schedules for INSERT with check ((EXISTS ( SELECT 1
   FROM retrieval_cards card
  WHERE ((card.id = retrieval_schedules.retrieval_card_id) AND owns_student(card.student_id) AND student_legacy_learning_is_unlocked(card.student_id)))));
create policy retrieval_schedules_update on retrieval_schedules for UPDATE using ((EXISTS ( SELECT 1
   FROM retrieval_cards card
  WHERE ((card.id = retrieval_schedules.retrieval_card_id) AND owns_student(card.student_id) AND student_legacy_learning_is_unlocked(card.student_id))))) with check ((EXISTS ( SELECT 1
   FROM retrieval_cards card
  WHERE ((card.id = retrieval_schedules.retrieval_card_id) AND owns_student(card.student_id) AND student_legacy_learning_is_unlocked(card.student_id)))));
create policy answers_insert on student_answers for INSERT with check ((EXISTS ( SELECT 1
   FROM reading_sessions session
  WHERE ((session.id = student_answers.session_id) AND owns_student(session.student_id) AND student_legacy_learning_is_unlocked(session.student_id)))));
create policy answers_update on student_answers for UPDATE using ((EXISTS ( SELECT 1
   FROM reading_sessions session
  WHERE ((session.id = student_answers.session_id) AND owns_student(session.student_id) AND student_legacy_learning_is_unlocked(session.student_id))))) with check ((EXISTS ( SELECT 1
   FROM reading_sessions session
  WHERE ((session.id = student_answers.session_id) AND owns_student(session.student_id) AND student_legacy_learning_is_unlocked(session.student_id)))));
create policy package_progress_student_write on student_package_progress for ALL using ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id))) with check ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id)));
create policy reading_est_insert on student_reading_estimates for INSERT with check ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id)));
create policy skill_est_insert on student_skill_estimates for INSERT with check ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id)));
create policy skill_est_update on student_skill_estimates for UPDATE using ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id))) with check ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id)));
create policy word_mastery_rw on student_word_mastery for ALL using ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id))) with check ((owns_student(student_id) AND student_legacy_learning_is_unlocked(student_id)));
create temporary table policy_before as select tablename,policyname,cmd,roles,permissive,qual,with_check from pg_policies where schemaname='public';
set role authenticated;
set plume_test.student_id='10000000-0000-4000-8000-000000000002';
do $$ begin
 begin
  insert into reading_sessions(student_id) values ('10000000-0000-4000-8000-000000000002');
  raise exception 'Regression fixture did not reproduce granular denial';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
\ir ../../../supabase/migrations/20260912120000_granular_learning_policy_bindings.sql
-- Applying twice must leave the policies identical.
\ir ../../../supabase/migrations/20260912120000_granular_learning_policy_bindings.sql

do $$ begin
 if exists(select 1 from policy_before b full join pg_policies a on a.schemaname='public' and a.tablename=b.tablename and a.policyname=b.policyname
 where b.policyname is not null and (a.policyname is null or a.cmd<>b.cmd or a.roles<>b.roles or a.permissive<>b.permissive
 or a.qual is distinct from replace(b.qual,'student_legacy_learning_is_unlocked(','student_learning_is_unlocked(')
 or a.with_check is distinct from replace(b.with_check,'student_legacy_learning_is_unlocked(','student_learning_is_unlocked('))) then raise exception 'Policy attributes or unrelated predicates changed'; end if;
 if exists(select 1 from pg_policies where schemaname='public' and (coalesce(qual,'')||coalesce(with_check,'')) like '%student_legacy_learning_is_unlocked%') then raise exception 'Legacy-only binding remains'; end if;
end $$;
set role authenticated;
do $$ declare owner uuid; s uuid; card uuid; begin
 foreach owner in array array['10000000-0000-4000-8000-000000000001'::uuid,'10000000-0000-4000-8000-000000000002'::uuid] loop
  perform set_config('plume_test.student_id',owner::text,false);
  insert into reading_sessions(student_id) values(owner) returning id into s;
  update reading_sessions set student_id=owner where id=s;
  insert into student_answers(student_id,session_id) values(owner,s);
  insert into retrieval_cards(student_id) values(owner) returning id into card;
  insert into retrieval_schedules(student_id,retrieval_card_id) values(owner,card);
  insert into student_word_mastery(student_id) values(owner);
  begin
   update reading_sessions set student_id='10000000-0000-4000-8000-000000000003' where id=s;
   raise exception 'Ownership transfer accepted';
  exception when insufficient_privilege then null; end;
 end loop;
 -- A student without an assessment must not write, even their own records.
 perform set_config('plume_test.student_id','10000000-0000-4000-8000-000000000003',false);
 begin
  insert into reading_sessions(student_id) values('10000000-0000-4000-8000-000000000003');
  raise exception 'Unassessed student accepted';
 exception when insufficient_privilege then null; end;
 -- A valid student must not attach answers or schedules to another owner.
 perform set_config('plume_test.student_id','10000000-0000-4000-8000-000000000001',false);
 begin
  insert into student_answers(student_id,session_id) values('10000000-0000-4000-8000-000000000001',s);
  raise exception 'Cross-student answer accepted';
 exception when insufficient_privilege then null; end;
 begin
  insert into retrieval_schedules(student_id,retrieval_card_id) values('10000000-0000-4000-8000-000000000001',card);
  raise exception 'Cross-student schedule accepted';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
