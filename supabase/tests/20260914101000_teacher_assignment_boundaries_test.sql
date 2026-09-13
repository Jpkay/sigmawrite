-- Synthetic users only; rolled back. Run against a disposable full-schema DB.
begin;
insert into public.schools(id,name) values
 ('14100000-0000-0000-0000-000000000001','Assignment test A'),
 ('14100000-0000-0000-0000-000000000002','Assignment test B');
insert into public.classes(id,school_id,name) values
 ('14100000-0000-0000-0000-000000000011','14100000-0000-0000-0000-000000000001','Class 1'),
 ('14100000-0000-0000-0000-000000000012','14100000-0000-0000-0000-000000000001','Class 2'),
 ('14100000-0000-0000-0000-000000000013','14100000-0000-0000-0000-000000000002','Foreign class');
insert into auth.users(id,email,raw_user_meta_data) values
 ('14100000-0000-4000-8000-000000000001','school-admin-a@example.invalid','{"role":"parent"}'),
 ('14100000-0000-4000-8000-000000000002','teacher-one@example.invalid','{"role":"parent"}'),
 ('14100000-0000-4000-8000-000000000003','teacher-two@example.invalid','{"role":"parent"}'),
 ('14100000-0000-4000-8000-000000000004','teacher-foreign@example.invalid','{"role":"parent"}');
update public.profiles set role = case when auth_user_id = '14100000-0000-4000-8000-000000000001' then 'school_admin' else 'teacher' end,
 school_id = case when auth_user_id = '14100000-0000-4000-8000-000000000004' then '14100000-0000-0000-0000-000000000002'::uuid else '14100000-0000-0000-0000-000000000001'::uuid end
 where auth_user_id::text like '14100000-0000-4000-8000-%';
select set_config('test.teacher1',(select id::text from public.profiles where auth_user_id='14100000-0000-4000-8000-000000000002'),true);
select set_config('test.teacher2',(select id::text from public.profiles where auth_user_id='14100000-0000-4000-8000-000000000003'),true);
select set_config('test.foreign_teacher',(select id::text from public.profiles where auth_user_id='14100000-0000-4000-8000-000000000004'),true);
insert into public.students(id,display_name,school_id) values
 ('14100000-0000-0000-0000-000000000021','Student 1','14100000-0000-0000-0000-000000000001'),
 ('14100000-0000-0000-0000-000000000022','Student 2','14100000-0000-0000-0000-000000000001'),
 ('14100000-0000-0000-0000-000000000023','Student 3','14100000-0000-0000-0000-000000000001'),
 ('14100000-0000-0000-0000-000000000024','Foreign student','14100000-0000-0000-0000-000000000002');
insert into public.enrollments(student_id,class_id) values
 ('14100000-0000-0000-0000-000000000021','14100000-0000-0000-0000-000000000011'),
 ('14100000-0000-0000-0000-000000000022','14100000-0000-0000-0000-000000000011'),
 ('14100000-0000-0000-0000-000000000023','14100000-0000-0000-0000-000000000012'),
 ('14100000-0000-0000-0000-000000000024','14100000-0000-0000-0000-000000000013');

select set_config('request.jwt.claim.sub','14100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
do $$ begin
 assert public.set_teacher_class(current_setting('test.teacher1')::uuid,'14100000-0000-0000-0000-000000000011',true);
 assert public.set_teacher_class(current_setting('test.teacher1')::uuid,'14100000-0000-0000-0000-000000000012',true);
 assert public.set_teacher_class(current_setting('test.teacher2')::uuid,'14100000-0000-0000-0000-000000000011',true);
 assert public.set_teacher_student(current_setting('test.teacher2')::uuid,'14100000-0000-0000-0000-000000000023',true);
 assert public.set_teacher_student(current_setting('test.teacher1')::uuid,'14100000-0000-0000-0000-000000000023',true);
 -- Idempotent grants and many-to-many direct assignment visibility for admin.
 perform public.set_teacher_student(current_setting('test.teacher1')::uuid,'14100000-0000-0000-0000-000000000023',true);
 assert (select count(*) from public.teacher_students where student_id='14100000-0000-0000-0000-000000000023') = 2;
 begin
  perform public.set_teacher_class(current_setting('test.foreign_teacher')::uuid,'14100000-0000-0000-0000-000000000011',true);
  raise exception 'foreign teacher class grant accepted';
 exception when insufficient_privilege then assert sqlerrm='teacher_school_mismatch'; end;
 begin
  perform public.set_teacher_student(current_setting('test.foreign_teacher')::uuid,'14100000-0000-0000-0000-000000000023',true);
  raise exception 'foreign teacher direct grant accepted';
 exception when insufficient_privilege then assert sqlerrm='teacher_school_mismatch'; end;
 begin
  perform public.set_teacher_student(current_setting('test.teacher1')::uuid,'14100000-0000-0000-0000-000000000024',true);
  raise exception 'foreign student grant accepted';
 exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
 begin
  perform public.set_teacher_class(current_setting('test.teacher1')::uuid,'14100000-0000-0000-0000-000000000013',true);
  raise exception 'foreign class grant accepted';
 exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
 assert not exists(select 1 from public.students where id='14100000-0000-0000-0000-000000000024');
 begin
  perform public.assign_student_class('14100000-0000-0000-0000-000000000024','14100000-0000-0000-0000-000000000011');
  raise exception 'school administrator moved a foreign student';
 exception when insufficient_privilege then assert sqlerrm='student_school_mismatch'; end;
 begin
  perform public.assign_student_class('14100000-0000-0000-0000-000000000022','14100000-0000-0000-0000-000000000012',current_setting('test.foreign_teacher')::uuid);
  raise exception 'invalid optional teacher assignment accepted';
 exception when insufficient_privilege then assert sqlerrm='teacher_school_mismatch'; end;
 assert not exists(select 1 from public.enrollments where student_id='14100000-0000-0000-0000-000000000022' and class_id='14100000-0000-0000-0000-000000000012'), 'failed direct grant must not partially enroll student';
 assert public.assign_student_class('14100000-0000-0000-0000-000000000021','14100000-0000-0000-0000-000000000012',current_setting('test.teacher1')::uuid);
end $$;

select set_config('request.jwt.claim.sub','14100000-0000-4000-8000-000000000002',true);
do $$ begin
 assert (select count(*) from public.students where id::text like '14100000-%')=3, 'one teacher sees three students over two classes';
 assert (select count(*) from public.classes where id::text like '14100000-%')=2;
 assert not public.can_view_student('14100000-0000-0000-0000-000000000024');
 begin
  perform public.set_teacher_student(current_setting('test.teacher1')::uuid,'14100000-0000-0000-0000-000000000024',true);
  raise exception 'teacher could self assign';
 exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
 begin
  insert into public.teacher_students(teacher_profile_id,student_id) values(current_setting('test.teacher1')::uuid,'14100000-0000-0000-0000-000000000024');
  raise exception 'direct table write bypassed RPC';
 exception when insufficient_privilege then null; end;
 begin
  update public.profiles set school_id='14100000-0000-0000-0000-000000000002' where id=public.current_profile_id();
  raise exception 'teacher changed own school';
 exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub','14100000-0000-4000-8000-000000000003',true);
do $$ begin
 assert (select count(*) from public.students where id::text like '14100000-%')=3, 'shared class plus directly assigned student visible';
 assert (select count(*) from public.classes where id::text like '14100000-%')=1, 'direct student assignment must not grant their entire class';
end $$;

select set_config('request.jwt.claim.sub','14100000-0000-4000-8000-000000000001',true);
select public.set_teacher_class(current_setting('test.teacher2')::uuid,'14100000-0000-0000-0000-000000000011',false);
select set_config('request.jwt.claim.sub','14100000-0000-4000-8000-000000000003',true);
do $$ begin
 assert not public.can_view_student('14100000-0000-0000-0000-000000000021'), 'class removal revokes student 1';
 assert not public.can_view_student('14100000-0000-0000-0000-000000000022'), 'class removal revokes student 2';
 assert public.can_view_student('14100000-0000-0000-0000-000000000023'), 'separate direct grant remains';
 assert (select count(*) from public.classes where id::text like '14100000-%')=0;
end $$;
select set_config('request.jwt.claim.sub','14100000-0000-4000-8000-000000000001',true);
select public.set_teacher_student(current_setting('test.teacher2')::uuid,'14100000-0000-0000-0000-000000000023',false);
select set_config('request.jwt.claim.sub','14100000-0000-4000-8000-000000000003',true);
do $$ begin
 assert not public.can_view_student('14100000-0000-0000-0000-000000000023'), 'last grant removal revokes access';
 assert (select count(*) from public.students where id::text like '14100000-%')=0;
end $$;

-- Deactivation blocks stale grants at RLS, not only in the web page guard.
reset role;
update public.profiles set deactivated_at=now() where id=current_setting('test.teacher1')::uuid;
select set_config('request.jwt.claim.sub','14100000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$ begin
 assert not public.teaches_student('14100000-0000-0000-0000-000000000021');
 assert (select count(*) from public.students where id::text like '14100000-%')=0;
 assert (select count(*) from public.classes where id::text like '14100000-%')=0;
end $$;
-- Missing JWT role must never turn the RPC IF guard into a NULL bypass.
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claim.role','',true);
do $$ begin
 begin
  perform public.set_teacher_student(current_setting('test.teacher2')::uuid,'14100000-0000-0000-0000-000000000023',true);
  raise exception 'missing identity accepted';
 exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
end $$;
reset role;
rollback;
