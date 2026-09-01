begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(18);

select has_column('public','profiles','username','Profiles have usernames');
select has_column('public','profiles','must_change_password','First-login rotation is database-owned');
select has_column('public','profiles','email_recovery_enabled','Recovery capability is explicit');
select has_column('public','profiles','provisioned_by_profile_id','Managed account creation is attributable');
select has_table('public','teacher_students','Teachers can receive direct student assignments');
select has_table('public','supervisor_schools','Supervisors can be scoped to schools');
select has_table('public','supervisor_classes','Supervisors can be assigned to classes');
select has_table('public','supervisor_students','Supervisors can be assigned to students');
select has_function('public','supervises_student',array['uuid'],'Supervisor access helper exists');
select function_privs_are('public','supervises_student',array['uuid'],'anon',array[]::text[],'Anonymous callers cannot inspect supervisor access');
select function_privs_are('public','supervises_student',array['uuid'],'authenticated',array['EXECUTE'],'Authenticated RLS may use supervisor access');
select ok(not has_column_privilege('authenticated','public.profiles','must_change_password','UPDATE'),'Users cannot clear first-login rotation themselves');
select is((select count(*) from pg_class where oid in ('public.teacher_students'::regclass,'public.supervisor_schools'::regclass,'public.supervisor_classes'::regclass,'public.supervisor_students'::regclass) and relrowsecurity),4::bigint,'Every assignment table enforces RLS');

insert into public.organizations(id,name,type) values('a0000000-0000-4000-8000-000000000001','Test organization','school');
insert into public.schools(id,organization_id,name) values
('a1000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','School one'),
('a1000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000001','School two');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('a2000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','one@test.local','',now(),'{}','{"role":"student","display_name":"Student One"}',now(),now()),
('a2000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','two@test.local','',now(),'{}','{"role":"student","display_name":"Student Two"}',now(),now()),
('a2000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','teacher@test.local','',now(),'{}','{"role":"teacher","display_name":"Teacher"}',now(),now()),
('a2000000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','supervisor@test.local','',now(),'{}','{"role":"parent","display_name":"Supervisor"}',now(),now());

select is((select count(distinct username) from public.profiles where auth_user_id::text like 'a2000000-%'),4::bigint,'Auth trigger gives every account a unique username');
select is((select count(*) from public.profiles where auth_user_id::text like 'a2000000-%' and email_recovery_enabled),4::bigint,'Real email accounts are recovery-enabled');

update public.profiles set role='supervisor' where auth_user_id='a2000000-0000-4000-8000-000000000004';
select is((select role from public.profiles where auth_user_id='a2000000-0000-4000-8000-000000000004'),'supervisor','Supervisor role is accepted by the authorization constraint');

update public.students student set school_id='a1000000-0000-4000-8000-000000000001'
from public.profiles profile where student.profile_id=profile.id and profile.auth_user_id='a2000000-0000-4000-8000-000000000001';
update public.students student set school_id='a1000000-0000-4000-8000-000000000002'
from public.profiles profile where student.profile_id=profile.id and profile.auth_user_id='a2000000-0000-4000-8000-000000000002';
insert into public.supervisor_schools(supervisor_profile_id,school_id)
select id,'a1000000-0000-4000-8000-000000000001' from public.profiles where auth_user_id='a2000000-0000-4000-8000-000000000004';
insert into public.teacher_students(teacher_profile_id,student_id)
select teacher.id,student.id from public.profiles teacher cross join public.students student join public.profiles student_profile on student_profile.id=student.profile_id
where teacher.auth_user_id='a2000000-0000-4000-8000-000000000003' and student_profile.auth_user_id='a2000000-0000-4000-8000-000000000002';

set local role authenticated;
set local request.jwt.claims='{"sub":"a2000000-0000-4000-8000-000000000004","role":"authenticated"}';
select is((select count(*) from public.students),1::bigint,'A supervisor sees every student in an assigned school but no other school');
set local request.jwt.claims='{"sub":"a2000000-0000-4000-8000-000000000003","role":"authenticated"}';
select is((select count(*) from public.students),1::bigint,'A direct teacher assignment grants student progress visibility');

select * from finish();
rollback;
