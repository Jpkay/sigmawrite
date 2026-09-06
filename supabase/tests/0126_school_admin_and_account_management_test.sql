begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(12);

select has_column('public','profiles','school_id','Administrators are linked to one school');
select has_column('public','profiles','deactivated_at','Accounts can be deactivated');
select has_column('public','schools','teacher_code','Schools carry a teacher sign-up code');
select has_function('public','set_teacher_class',array['uuid','uuid','boolean'],'Teachers can be attached to classes');
select has_function('public','validate_teacher_code',array['text'],'Teacher codes are validated server-side');

-- Two schools, one admin per school, one class each, one student each. Signup trigger builds the profiles.
insert into public.schools(id,name,teacher_code) values ('12600000-0000-0000-0000-000000000001','École A','ABCD1234'),('12600000-0000-0000-0000-000000000002','École B',null);
insert into public.classes(id,school_id,name) values ('12600000-0000-0000-0000-000000000011','12600000-0000-0000-0000-000000000001','6e A'),('12600000-0000-0000-0000-000000000012','12600000-0000-0000-0000-000000000002','6e B');
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
  ('12600000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin-a@test.local','',now(),'{}','{"role":"parent","display_name":"Admin A"}',now(),now()),
  ('12600000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','teacher-code@test.local','',now(),'{}','{"role":"teacher","display_name":"Prof avec code","teacher_code":"abcd1234"}',now(),now()),
  ('12600000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','teacher-nocode@test.local','',now(),'{}','{"role":"teacher","display_name":"Prof sans code"}',now(),now());
update public.profiles set role='school_admin', school_id='12600000-0000-0000-0000-000000000001' where auth_user_id='12600000-0000-4000-8000-000000000001';
insert into public.students(id,display_name,school_id) values ('12600000-0000-0000-0000-000000000021','Élève A','12600000-0000-0000-0000-000000000001'),('12600000-0000-0000-0000-000000000022','Élève B','12600000-0000-0000-0000-000000000002');
insert into public.enrollments(student_id,class_id,status) values ('12600000-0000-0000-0000-000000000021','12600000-0000-0000-0000-000000000011','active'),('12600000-0000-0000-0000-000000000022','12600000-0000-0000-0000-000000000012','active');

select is((select role from public.profiles where auth_user_id='12600000-0000-4000-8000-000000000002'),'teacher','A valid teacher code yields a teacher account linked to the school');
select is((select school_id from public.profiles where auth_user_id='12600000-0000-4000-8000-000000000002'),'12600000-0000-0000-0000-000000000001'::uuid,'The teacher is linked to the school of the code');
select is((select role from public.profiles where auth_user_id='12600000-0000-4000-8000-000000000003'),'parent','Without a code a self-declared teacher becomes a parent');

select set_config('request.jwt.claim.sub','12600000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('role','authenticated',true);
select is(public.can_view_student('12600000-0000-0000-0000-000000000021'),true,'The school admin sees a student of their school');
select is(public.can_view_student('12600000-0000-0000-0000-000000000022'),false,'The school admin does not see another school''s student');
select results_eq($$select name from public.classes order by name$$,$$values ('6e A')$$,'Class reads are scoped to the school');
select lives_ok($$select public.set_teacher_class((select id from public.profiles where auth_user_id='12600000-0000-4000-8000-000000000002'),'12600000-0000-0000-0000-000000000011',true)$$,'The school admin attaches a teacher to a class of the school');

select * from finish();
rollback;
