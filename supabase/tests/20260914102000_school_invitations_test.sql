-- Synthetic identities only; every change is rolled back. Run after migration
-- 20260914101000 so teacher_belongs_to_school() is the active boundary.
begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(19);

select ok(
  to_regprocedure('public.can_manage_class_invitations(uuid)') is not null,
  'Class invitation management has one database-owned predicate'
);
select ok(
  to_regprocedure('public.rotate_class_join_code(uuid,integer,integer)') is not null,
  'Class invitation rotation is one database operation'
);
select ok(
  not has_function_privilege('anon','public.rotate_class_join_code(uuid,integer,integer)','EXECUTE'),
  'Anonymous callers cannot rotate invitations'
);
select ok(
  has_function_privilege('authenticated','public.rotate_class_join_code(uuid,integer,integer)','EXECUTE'),
  'Authenticated scoped adults may invoke the boundary'
);
select ok(
  upper(pg_get_functiondef('public.rotate_class_join_code(uuid,integer,integer)'::regprocedure)) like '%FOR UPDATE%',
  'Rotation locks the class row before replacing its code'
);
select ok(
  exists (
    select 1
    from pg_trigger trigger
    join pg_class relation on relation.oid = trigger.tgrelid
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'auth'
      and relation.relname = 'users'
      and trigger.tgname = 'validate_teacher_signup_code_before_insert'
      and not trigger.tgisinternal
  ),
  'Teacher-code validation runs before profile provisioning'
);

insert into public.schools(id,name,teacher_code) values
  ('14200000-0000-0000-0000-000000000001','Invitation school A','TEACH-ACTIVE'),
  ('14200000-0000-0000-0000-000000000002','Invitation school B',null);
insert into public.classes(id,school_id,name) values
  ('14200000-0000-0000-0000-000000000011','14200000-0000-0000-0000-000000000001','Shared class'),
  ('14200000-0000-0000-0000-000000000012','14200000-0000-0000-0000-000000000002','Foreign class');
insert into auth.users(id,email,raw_user_meta_data) values
  ('14200000-0000-4000-8000-000000000001','invite-admin-a@example.invalid','{"role":"parent"}'),
  ('14200000-0000-4000-8000-000000000002','invite-admin-b@example.invalid','{"role":"parent"}'),
  ('14200000-0000-4000-8000-000000000003','invite-teacher-one@example.invalid','{"role":"parent"}'),
  ('14200000-0000-4000-8000-000000000004','invite-teacher-two@example.invalid','{"role":"parent"}'),
  ('14200000-0000-4000-8000-000000000005','invite-unassigned@example.invalid','{"role":"parent"}'),
  ('14200000-0000-4000-8000-000000000006','invite-foreign@example.invalid','{"role":"parent"}');
update public.profiles
set role = case when auth_user_id in (
      '14200000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000002'
    ) then 'school_admin' else 'teacher' end,
  school_id = case when auth_user_id in (
      '14200000-0000-4000-8000-000000000002',
      '14200000-0000-4000-8000-000000000006'
    ) then '14200000-0000-0000-0000-000000000002'::uuid
    else '14200000-0000-0000-0000-000000000001'::uuid end
where auth_user_id::text like '14200000-0000-4000-8000-%';

select set_config('test.invite_teacher_one',(select id::text from public.profiles where auth_user_id='14200000-0000-4000-8000-000000000003'),true);
select set_config('test.invite_teacher_two',(select id::text from public.profiles where auth_user_id='14200000-0000-4000-8000-000000000004'),true);
insert into public.teacher_classes(teacher_profile_id,class_id) values
  (current_setting('test.invite_teacher_one')::uuid,'14200000-0000-0000-0000-000000000011'),
  (current_setting('test.invite_teacher_two')::uuid,'14200000-0000-0000-0000-000000000011'),
  ((select id from public.profiles where auth_user_id='14200000-0000-4000-8000-000000000006'),'14200000-0000-0000-0000-000000000012');
insert into public.class_join_codes(code,class_id,expires_at,max_uses)
values('SW-FOREIGN-OLD','14200000-0000-0000-0000-000000000012',now()+interval '1 day',5);

select throws_ok(
  $$insert into auth.users(id,email,raw_user_meta_data) values
    ('14200000-0000-4000-8000-000000000007','invite-invalid-teacher@example.invalid','{"role":"teacher","teacher_code":"REVOKED"}')$$,
  '22023','teacher_code_invalid','A missing or rotated teacher code creates no fallback parent account'
);
select lives_ok(
  $$insert into auth.users(id,email,raw_user_meta_data) values
    ('14200000-0000-4000-8000-000000000008','invite-valid-teacher@example.invalid','{"role":"teacher","teacher_code":"teach-active"}')$$,
  'The active teacher code supports another teacher signup'
);
select is(
  (select role from public.profiles where auth_user_id='14200000-0000-4000-8000-000000000008'),
  'teacher','A valid public teacher signup remains a teacher'
);
select is(
  (select count(*) from public.profiles where auth_user_id='14200000-0000-4000-8000-000000000007'),
  0::bigint,'The rejected teacher signup leaves no profile'
);

select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','14200000-0000-4000-8000-000000000003',true);
set local role authenticated;

do $$
begin
  assert public.can_manage_class_invitations('14200000-0000-0000-0000-000000000011'), 'active assigned teacher denied';
  assert not public.can_manage_class_invitations('14200000-0000-0000-0000-000000000012'), 'teacher crossed school boundary';
  perform public.rotate_class_join_code('14200000-0000-0000-0000-000000000011',14,40);
end
$$;
reset role;
select ok(
  (select code ~ '^SW-[0-9A-F]{32}$' from public.class_join_codes where class_id='14200000-0000-0000-0000-000000000011' and revoked_at is null),
  'New codes retain 128 random bits and a stable prefix'
);
select is(
  (select char_length(code) from public.class_join_codes where class_id='14200000-0000-0000-0000-000000000011' and revoked_at is null),
  35, 'New 128-bit codes stay within the accepted no-email length'
);
select is(
  (select max_uses from public.class_join_codes where class_id='14200000-0000-0000-0000-000000000011' and revoked_at is null),
  40, 'The bounded use count is stored'
);

select set_config('request.jwt.claim.sub','14200000-0000-4000-8000-000000000004',true);
set local role authenticated;
select public.rotate_class_join_code('14200000-0000-0000-0000-000000000011',30,80);
reset role;
select is(
  (select count(*) from public.class_join_codes where class_id='14200000-0000-0000-0000-000000000011' and revoked_at is null),
  1::bigint, 'Shared-teacher rotation leaves exactly one unrevoked code'
);
select is(
  (select count(*) from public.class_join_codes where class_id='14200000-0000-0000-0000-000000000011' and revoked_at is not null),
  1::bigint, 'Shared-teacher rotation revokes the previous code'
);

select set_config('request.jwt.claim.sub','14200000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$
begin
  perform public.rotate_class_join_code('14200000-0000-0000-0000-000000000011',7,25);
  assert (select count(*) from public.class_join_codes where revoked_at is null) = 1,
    'school administrator SELECT policy exposed a foreign school code';
end
$$;

select set_config('request.jwt.claim.sub','14200000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claim.sub','14200000-0000-4000-8000-000000000005',true);
do $$
begin
  perform set_config('request.jwt.claim.sub','14200000-0000-4000-8000-000000000002',true);
  begin
    perform public.rotate_class_join_code('14200000-0000-0000-0000-000000000011',14,40);
    raise exception 'foreign school administrator rotated code';
  exception when insufficient_privilege then assert sqlerrm = 'forbidden'; end;
  perform set_config('request.jwt.claim.sub','14200000-0000-4000-8000-000000000005',true);
  begin
    perform public.rotate_class_join_code('14200000-0000-0000-0000-000000000011',14,40);
    raise exception 'unassigned teacher rotated code';
  exception when insufficient_privilege then assert sqlerrm = 'forbidden'; end;
  perform set_config('request.jwt.claim.sub','14200000-0000-4000-8000-000000000006',true);
  begin
    perform public.rotate_class_join_code('14200000-0000-0000-0000-000000000011',14,40);
    raise exception 'foreign teacher rotated code';
  exception when insufficient_privilege then assert sqlerrm = 'forbidden'; end;
end
$$;

reset role;
update public.profiles set deactivated_at=now() where id=current_setting('test.invite_teacher_two')::uuid;
select set_config('request.jwt.claim.sub','14200000-0000-4000-8000-000000000004',true);
set local role authenticated;
do $$
begin
  assert not public.can_manage_class_invitations('14200000-0000-0000-0000-000000000011'), 'deactivated teacher retained invitation access';
  begin
    perform public.rotate_class_join_code('14200000-0000-0000-0000-000000000011',14,40);
    raise exception 'deactivated teacher rotated code';
  exception when insufficient_privilege then assert sqlerrm = 'forbidden'; end;
end
$$;

select set_config('request.jwt.claim.sub','14200000-0000-4000-8000-000000000001',true);
do $$
begin
  begin
    perform public.rotate_class_join_code('14200000-0000-0000-0000-000000000011',0,40);
    raise exception 'invalid lifetime accepted';
  exception when invalid_parameter_value then assert sqlerrm = 'invalid_invite_limits'; end;
  begin
    perform public.rotate_class_join_code('14200000-0000-0000-0000-000000000011',14,501);
    raise exception 'invalid use count accepted';
  exception when invalid_parameter_value then assert sqlerrm = 'invalid_invite_limits'; end;
end
$$;
reset role;
select is(
  (select count(*) from public.class_join_codes where class_id='14200000-0000-0000-0000-000000000011' and revoked_at is null),
  1::bigint, 'Rejected settings do not revoke the current code'
);

select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claim.role','',true);
set local role authenticated;
do $$
begin
  assert not public.can_manage_class_invitations('14200000-0000-0000-0000-000000000011'), 'missing identity was not denied';
end
$$;
reset role;
select throws_ok(
  $$insert into public.class_join_codes(code,class_id,expires_at,max_uses)
    values('SW-SECOND-ACTIVE','14200000-0000-0000-0000-000000000011',now()+interval '1 day',5)$$,
  '23505',null,'The partial unique index rejects a second unrevoked class code'
);
select is(
  (select count(*) from public.class_join_codes where class_id='14200000-0000-0000-0000-000000000011' and revoked_at is null),
  1::bigint,'The failed duplicate insert preserves the current invitation'
);
select ok(
  has_table_privilege('authenticated','public.class_join_codes','SELECT')
    and not has_table_privilege('authenticated','public.class_join_codes','INSERT')
    and not has_table_privilege('authenticated','public.class_join_codes','UPDATE')
    and not has_table_privilege('authenticated','public.class_join_codes','DELETE'),
  'Authenticated clients can read scoped codes but cannot mutate invitation rows directly'
);

select * from finish();
rollback;
