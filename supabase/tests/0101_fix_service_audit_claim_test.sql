begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(3);

insert into auth.users(
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  'a3000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'audit-actor@test.local', '', now(),
  '{}', '{"role":"teacher","display_name":"Audit Actor"}', now(), now()
);

set local request.jwt.claims = '{"sub":"a3000000-0000-4000-8000-000000000001","role":"service_role"}';
select lives_ok(
  $$select public.write_audit_log('a3000000-0000-4000-8000-000000000001','test.audit_write','profile',null,'{"source":"pgtap"}'::jsonb)$$,
  'Service-role JWT claims can write audit records'
);
select is(
  (select count(*) from public.audit_logs where action = 'test.audit_write'),
  1::bigint,
  'The audit row is persisted'
);

set local request.jwt.claims = '{"sub":"a3000000-0000-4000-8000-000000000001","role":"authenticated"}';
select throws_ok(
  $$select public.write_audit_log('a3000000-0000-4000-8000-000000000001','test.forged_write')$$,
  '42501',
  'service role required',
  'Authenticated JWT claims cannot forge audit records'
);

select * from finish();
rollback;
