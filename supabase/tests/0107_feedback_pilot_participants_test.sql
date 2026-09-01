begin;
set local role postgres;
set local search_path=public,extensions;
create extension if not exists pgtap with schema extensions;
select plan(12);

select table_privs_are('public','competency_item_review_assignments','anon',array[]::text[],'Anonymous callers cannot inspect reviewer assignments');

select has_column('public','diagnostic_pilot_enrollments','cohort_kind','Pilot enrollment identifies its cohort');
select has_column('public','diagnostic_pilot_enrollments','feedback_agreement_source','Feedback agreement source is retained');
select has_column('public','diagnostic_pilot_enrollments','feedback_agreement_version','Feedback agreement wording is versioned');
select has_column('public','diagnostic_pilot_enrollments','feedback_agreed_at','Feedback agreement time is retained');
select has_function('public','feedback_agreement_source_is_eligible',array['uuid','text'],'Feedback agreement eligibility is database-enforced');
select function_privs_are('public','feedback_agreement_source_is_eligible',array['uuid','text'],'authenticated',array[]::text[],'Clients cannot bypass the enrollment action');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('a7000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','older.feedback@test.local','',now(),'{}',jsonb_build_object('role','student','display_name','Older feedback student','date_of_birth',(current_date-interval '16 years')::date),now(),now()),
('a7000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','younger.feedback@test.local','',now(),'{}',jsonb_build_object('role','student','display_name','Younger feedback student','date_of_birth',(current_date-interval '14 years')::date),now(),now());

select ok(public.feedback_agreement_source_is_eligible(
  (select student.id from public.students student join public.profiles profile on profile.id=student.profile_id where profile.auth_user_id='a7000000-0000-4000-8000-000000000001'),
  'student'
),'A student aged 15 or over may agree personally to feedback participation');
select is(public.feedback_agreement_source_is_eligible(
  (select student.id from public.students student join public.profiles profile on profile.id=student.profile_id where profile.auth_user_id='a7000000-0000-4000-8000-000000000002'),
  'student'
),false,'A younger student cannot be recorded as the agreement source');
select ok(public.feedback_agreement_source_is_eligible(
  (select student.id from public.students student join public.profiles profile on profile.id=student.profile_id where profile.auth_user_id='a7000000-0000-4000-8000-000000000002'),
  'guardian'
),'A guardian may agree for a younger feedback participant');
select is(public.feedback_agreement_source_is_eligible(
  (select student.id from public.students student join public.profiles profile on profile.id=student.profile_id where profile.auth_user_id='a7000000-0000-4000-8000-000000000001'),
  'school'
),false,'Ordinary school access authorization is not feedback participation agreement');
select is(public.feedback_agreement_source_is_eligible(gen_random_uuid(),'guardian'),false,'An unknown student cannot receive a feedback enrollment');

select * from finish();
rollback;
