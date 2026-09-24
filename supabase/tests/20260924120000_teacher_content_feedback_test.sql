begin;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(11);

select has_table('public', 'teacher_content_feedback', 'Teacher comments have a separate table');
select table_privs_are('public', 'teacher_content_feedback', 'authenticated', array['SELECT', 'INSERT'], 'Authenticated users cannot edit or delete feedback');
select table_privs_are('public', 'teacher_content_feedback', 'anon', array[]::text[], 'Anonymous users have no feedback table privileges');

insert into auth.users(id, email, raw_user_meta_data) values
  ('24120000-0000-4000-8000-000000000001', 'feedback-teacher@example.invalid', '{"role":"parent"}'),
  ('24120000-0000-4000-8000-000000000002', 'feedback-student@example.invalid', '{"role":"parent"}'),
  ('24120000-0000-4000-8000-000000000003', 'feedback-admin@example.invalid', '{"role":"parent"}');
update public.profiles set role = case auth_user_id
  when '24120000-0000-4000-8000-000000000001' then 'teacher'
  when '24120000-0000-4000-8000-000000000002' then 'student'
  else 'platform_admin' end
where auth_user_id in (
  '24120000-0000-4000-8000-000000000001',
  '24120000-0000-4000-8000-000000000002',
  '24120000-0000-4000-8000-000000000003'
);
insert into public.competency_nodes(id, key, strand, label_fr, review_status) values
  ('24120000-0000-4000-8000-000000000011', 'teacher_feedback_approved_fixture', 'grammaire_syntaxe', 'Accord approuvé', 'draft'),
  ('24120000-0000-4000-8000-000000000012', 'teacher_feedback_draft_fixture', 'grammaire_syntaxe', 'Accord brouillon', 'draft');
insert into public.competency_lessons(id, node_id, explanation_fr, pattern_fr, review_status) values
  ('24120000-0000-4000-8000-000000000021', '24120000-0000-4000-8000-000000000011', 'Explication', 'Modèle', 'human_approved'),
  ('24120000-0000-4000-8000-000000000022', '24120000-0000-4000-8000-000000000012', 'Brouillon', 'Modèle', 'draft');
update public.competency_nodes set review_status = 'human_approved' where id = '24120000-0000-4000-8000-000000000011';
select set_config('test.lesson_id', '24120000-0000-4000-8000-000000000021', true);
select set_config('test.pending_lesson_id', '24120000-0000-4000-8000-000000000022', true);
select set_config('test.teacher_id', (select id::text from public.profiles where auth_user_id = '24120000-0000-4000-8000-000000000001'), true);
select set_config('test.student_id', (select id::text from public.profiles where auth_user_id = '24120000-0000-4000-8000-000000000002'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '24120000-0000-4000-8000-000000000001', true);
set local role authenticated;

insert into public.teacher_content_feedback(teacher_profile_id, content_kind, content_id, comment)
values (current_setting('test.teacher_id')::uuid, 'lesson', current_setting('test.lesson_id')::uuid, '  Exemple à clarifier.  ');
select is((select comment from public.teacher_content_feedback limit 1), 'Exemple à clarifier.', 'Teacher comment is stored and trimmed');
select is((select count(*)::int from public.teacher_content_feedback), 1, 'Teacher can read own feedback');
select throws_ok(
  format('insert into public.teacher_content_feedback(teacher_profile_id,content_kind,content_id,comment) values (%L,''lesson'',%L,''Spoofed author'')', current_setting('test.student_id'), current_setting('test.lesson_id')),
  '42501', null, 'Teacher cannot impersonate another author'
);
select throws_ok(
  format('insert into public.teacher_content_feedback(teacher_profile_id,content_kind,content_id,comment) values (%L,''lesson'',%L,''Pending lesson'')', current_setting('test.teacher_id'), current_setting('test.pending_lesson_id')),
  '23503', 'teacher_feedback_target_unavailable', 'Teacher cannot comment on an unapproved lesson'
);

select set_config('request.jwt.claim.sub', '24120000-0000-4000-8000-000000000002', true);
select is((select count(*)::int from public.teacher_content_feedback), 0, 'Student cannot read teacher feedback');
select throws_ok(
  format('insert into public.teacher_content_feedback(teacher_profile_id,content_kind,content_id,comment) values (%L,''lesson'',%L,''Student comment'')', current_setting('test.student_id'), current_setting('test.lesson_id')),
  '42501', null, 'Student cannot submit teacher feedback'
);

select set_config('request.jwt.claim.sub', '24120000-0000-4000-8000-000000000003', true);
select is((select count(*)::int from public.teacher_content_feedback), 1, 'Platform admin can read teacher feedback');

reset role;
update public.profiles set role = 'parent' where id = current_setting('test.teacher_id')::uuid;
select set_config('request.jwt.claim.sub', '24120000-0000-4000-8000-000000000001', true);
set local role authenticated;
select is((select count(*)::int from public.teacher_content_feedback), 0, 'Former teacher cannot read old feedback after a role change');

select * from finish();
rollback;
