begin;
set local role postgres;
set local search_path=public,extensions;
create extension if not exists pgtap with schema extensions;
select plan(26);

select has_function('public','student_access_is_authorized',array['uuid'],'Student access has one authoritative database predicate');
select function_privs_are('public','student_access_is_authorized',array['uuid'],'anon',array[]::text[],'Anonymous callers cannot inspect student access');
select function_privs_are('public','student_access_is_authorized',array['uuid'],'authenticated',array['EXECUTE'],'An authenticated student may check their own access');
select has_trigger('public','enrollments','enrollment_records_authorization','Enrollment automatically records its authorization trail');
select has_column('public','student_learning_paths','diagnostic_taxonomy_release_id','Paths retain their diagnostic source taxonomy');
select has_column('public','student_learning_paths','taxonomy_transition_key','Paths identify an approved taxonomy transition');
select has_function(
  'public','complete_student_onboarding',
  array['uuid','integer','text','text[]','text','text','text','text','text','text','numeric','jsonb'],
  'Onboarding is one atomic database operation'
);
select col_default_is('public','class_join_codes','school_consent_enabled','true','New class invitations authorize access by default');
select function_privs_are(
  'public','validate_class_join_code',array['text'],'anon',array['EXECUTE'],
  'Anonymous invitees can validate a class code before account creation'
);

insert into public.organizations(id,name,type)
values('a3000000-0000-4000-8000-000000000001','Invitation contract','school');
insert into public.schools(id,organization_id,name)
values('a3000000-0000-4000-8000-000000000002','a3000000-0000-4000-8000-000000000001','Invitation school');
insert into public.classes(id,school_id,name,grade_level,academic_year)
values('a3000000-0000-4000-8000-000000000003','a3000000-0000-4000-8000-000000000002','Grade eight',8,'2026-2027');

select throws_ok(
  $$insert into public.class_join_codes(id,code,class_id,expires_at,school_consent_enabled)
    values('a3000000-0000-4000-8000-000000000004','SW-CANNOT-BLOCK','a3000000-0000-4000-8000-000000000003',now()+interval '1 day',false)$$,
  '23514',null,
  'A class code can no longer create an invited-but-blocked student'
);

insert into public.class_join_codes(id,code,class_id,expires_at,max_uses)
values('a3000000-0000-4000-8000-000000000005','SW-INVITED','a3000000-0000-4000-8000-000000000003',now()+interval '1 day',5);

insert into auth.users(
  id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values
('a3000000-0000-4000-8000-000000000010','00000000-0000-0000-0000-000000000000','authenticated','authenticated','invited@test.local','',now(),'{}','{"role":"student","display_name":"Invited learner","join_code":"SW-INVITED","date_of_birth":"2013-01-02","username":"invited.learner"}',now(),now()),
('a3000000-0000-4000-8000-000000000011','00000000-0000-0000-0000-000000000000','authenticated','authenticated','orphan@test.local','',now(),'{}','{"role":"student","display_name":"Orphan learner","date_of_birth":"2010-01-02","username":"orphan.learner"}',now(),now());

select is(
  (select count(*) from public.enrollments enrollment join public.students student on student.id=enrollment.student_id join public.profiles profile on profile.id=student.profile_id where profile.auth_user_id='a3000000-0000-4000-8000-000000000010' and enrollment.status='active'),
  1::bigint,
  'Accepting the invitation creates the active enrollment'
);
select is(
  (select count(*) from public.consent_records consent join public.students student on student.id=consent.student_id join public.profiles profile on profile.id=student.profile_id where profile.auth_user_id='a3000000-0000-4000-8000-000000000010' and consent.consent_type='school' and consent.revoked_at is null),
  1::bigint,
  'Accepting the invitation records school authorization automatically'
);

select set_config('request.jwt.claim.role','service_role',true);
select ok(
  public.student_access_is_authorized((select student.id from public.students student join public.profiles profile on profile.id=student.profile_id where profile.auth_user_id='a3000000-0000-4000-8000-000000000010')),
  'An invited student is authorized immediately'
);
select is(
  public.student_access_is_authorized((select student.id from public.students student join public.profiles profile on profile.id=student.profile_id where profile.auth_user_id='a3000000-0000-4000-8000-000000000011')),
  false,
  'An account without an invitation or guardian authorization remains closed'
);

select set_config('request.jwt.claim.sub','a3000000-0000-4000-8000-000000000010',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select lives_ok(
  $$select public.complete_student_onboarding(
    (select student.id from public.students student join public.profiles profile on profile.id=student.profile_id where profile.auth_user_id='a3000000-0000-4000-8000-000000000010'),
    7,'bilingual',array['music','history','technology'],'immersion','anglais','school','prepare_delf','cefr','B2',null,
    '{"strands":["comprehension_ecrite"],"modalities":["reading","writing"],"mastery_threshold":0.85}'::jsonb
  )$$,
  'An authorized student completes onboarding atomically'
);
reset role;

select is(
  (select student.current_grade from public.students student join public.profiles profile on profile.id=student.profile_id where profile.auth_user_id='a3000000-0000-4000-8000-000000000010'),
  8,
  'Onboarding preserves the authoritative grade from the class invitation'
);
select is(
  (select count(*) from public.student_interests interest join public.students student on student.id=interest.student_id join public.profiles profile on profile.id=student.profile_id where profile.auth_user_id='a3000000-0000-4000-8000-000000000010'),
  3::bigint,
  'All selected interests commit together'
);
select is(
  (select goal.target_level from public.learning_goals goal join public.students student on student.id=goal.student_id join public.profiles profile on profile.id=student.profile_id where profile.auth_user_id='a3000000-0000-4000-8000-000000000010' and goal.status='active'),
  'B2',
  'The learner explicit CEFR target is persisted instead of a hard-coded B1'
);
select ok(
  (select student.onboarding_completed_at is not null from public.students student join public.profiles profile on profile.id=student.profile_id where profile.auth_user_id='a3000000-0000-4000-8000-000000000010'),
  'Onboarding is marked complete only after the profile and goal transaction succeeds'
);

select set_config('request.jwt.claim.role','service_role',true);
update public.consent_records set revoked_at=now()
where student_id=(select student.id from public.students student join public.profiles profile on profile.id=student.profile_id where profile.auth_user_id='a3000000-0000-4000-8000-000000000010')
  and revoked_at is null;
select ok(
  public.student_access_is_authorized((select student.id from public.students student join public.profiles profile on profile.id=student.profile_id where profile.auth_user_id='a3000000-0000-4000-8000-000000000010')),
  'An active institutional enrollment remains the live authorization after an audit record is revoked'
);
insert into public.consent_records(student_id,consent_type,consent_version,privacy_policy_version)
select student.id,'school','school-invitation-v1','privacy-v1'
from public.students student join public.profiles profile on profile.id=student.profile_id
where profile.auth_user_id='a3000000-0000-4000-8000-000000000010';
update public.enrollments set status='removed'
where student_id=(select student.id from public.students student join public.profiles profile on profile.id=student.profile_id where profile.auth_user_id='a3000000-0000-4000-8000-000000000010');
select is(
  public.student_access_is_authorized((select student.id from public.students student join public.profiles profile on profile.id=student.profile_id where profile.auth_user_id='a3000000-0000-4000-8000-000000000010')),
  false,
  'Removing the enrollment withdraws institutional access when no other authorization remains'
);
select is(
  (select count(*) from public.consent_records consent join public.students student on student.id=consent.student_id join public.profiles profile on profile.id=student.profile_id where profile.auth_user_id='a3000000-0000-4000-8000-000000000010' and consent.consent_type='school' and consent.revoked_at is null),
  0::bigint,
  'Removing the last enrollment closes the institutional authorization audit row'
);

select extensions.ok(
  pg_get_functiondef('public.student_learning_is_unlocked(uuid)'::regprocedure) like '%student_access_is_authorized%',
  'Every guarded learning mutation now also requires active student access'
);
select extensions.ok(
  pg_get_functiondef('public.student_learning_is_unlocked(uuid)'::regprocedure) like '%french-v2-to-v3-stable-key-v1%',
  'Learning unlock recognizes only the explicit checksum-bound v2-to-v3 transition'
);
select extensions.ok(
  pg_get_functiondef('public.student_learning_is_unlocked(uuid)'::regprocedure) like '%taxonomy_release_memberships%',
  'A transitioned path proves that every persisted step belongs to its destination release'
);
select function_privs_are(
  'public','complete_student_onboarding',
  array['uuid','integer','text','text[]','text','text','text','text','text','text','numeric','jsonb'],
  'anon',array[]::text[],
  'Anonymous callers cannot invoke onboarding'
);

select * from finish();
rollback;
