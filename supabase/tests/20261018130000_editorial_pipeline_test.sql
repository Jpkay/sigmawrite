begin;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(15);

select has_table('public', 'editorial_runs', 'Editorial runs are logged');
select has_table('public', 'story_sagas', 'Sagas are persisted');
select has_table('public', 'story_chapters', 'Chapters are persisted');
select has_table('public', 'editorial_library_items', 'Library pool exists');
select is((select count(*)::int from public.editorial_settings), 1, 'Editorial settings is a singleton');
select table_privs_are('public', 'story_chapters', 'authenticated', array['SELECT'], 'Clients cannot write chapters directly');

insert into auth.users(id, email, raw_user_meta_data) values
  ('26101813-0000-4000-8000-000000000001', 'ed-teacher@example.invalid', '{"role":"parent"}'),
  ('26101813-0000-4000-8000-000000000002', 'ed-student@example.invalid', '{"role":"parent"}'),
  ('26101813-0000-4000-8000-000000000003', 'ed-other@example.invalid', '{"role":"parent"}'),
  ('26101813-0000-4000-8000-000000000004', 'ed-admin@example.invalid', '{"role":"parent"}');
update public.profiles set role = case auth_user_id
  when '26101813-0000-4000-8000-000000000001' then 'teacher'
  when '26101813-0000-4000-8000-000000000004' then 'platform_admin'
  else 'student' end
where auth_user_id in ('26101813-0000-4000-8000-000000000001','26101813-0000-4000-8000-000000000002','26101813-0000-4000-8000-000000000003','26101813-0000-4000-8000-000000000004');

insert into public.classes(id, name) values ('26101813-0000-4000-8000-0000000000c1', 'Classe éditoriale');
insert into public.teacher_classes(teacher_profile_id, class_id)
  select id, '26101813-0000-4000-8000-0000000000c1' from public.profiles where auth_user_id = '26101813-0000-4000-8000-000000000001';
insert into public.students(id, profile_id)
  select '26101813-0000-4000-8000-0000000000a1', id from public.profiles where auth_user_id = '26101813-0000-4000-8000-000000000002';
insert into public.students(id, profile_id)
  select '26101813-0000-4000-8000-0000000000a2', id from public.profiles where auth_user_id = '26101813-0000-4000-8000-000000000003';
insert into public.story_sagas(id, student_id, interest, style_key, grade_band, chapter_count, pipeline_version)
values ('26101813-0000-4000-8000-0000000000b1', '26101813-0000-4000-8000-0000000000a1', 'football', 'verne', '6e-5e', 8, 'editorial-1.0.0');
insert into public.story_chapters(id, saga_id, chapter_index, body_template, status, source, pipeline_version)
values ('26101813-0000-4000-8000-0000000000d1', '26101813-0000-4000-8000-0000000000b1', 1, 'Tu ouvris la porte du vestiaire.', 'ready', 'live', 'editorial-1.0.0');
insert into public.story_choices(chapter_id, choice_index, label) values
  ('26101813-0000-4000-8000-0000000000d1', 0, 'Suivre le gardien'),
  ('26101813-0000-4000-8000-0000000000d1', 1, 'Rester sur le banc');

select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select set_config('request.jwt.claim.sub', '26101813-0000-4000-8000-000000000002', true);
select is((select count(*)::int from public.story_sagas), 1, 'A student reads their own saga');
select is((select count(*)::int from public.story_choices), 2, 'A student reads the choices of their chapters');
select throws_ok($$select public.set_editorial_live_generation(false, 'live')$$, '42501', null, 'A student cannot use the global switch');
select throws_ok($$select public.set_class_live_generation('26101813-0000-4000-8000-0000000000c1', false)$$, '42501', null, 'A student cannot use the class switch');

select set_config('request.jwt.claim.sub', '26101813-0000-4000-8000-000000000003', true);
select is((select count(*)::int from public.story_chapters), 0, 'Another student cannot read someone else''s chapters');

select set_config('request.jwt.claim.sub', '26101813-0000-4000-8000-000000000001', true);
select is(public.set_class_live_generation('26101813-0000-4000-8000-0000000000c1', false), false, 'The class teacher turns live generation off');
select is((select live_enabled from public.editorial_class_controls where class_id = '26101813-0000-4000-8000-0000000000c1'), false, 'The class switch is stored');

select set_config('request.jwt.claim.sub', '26101813-0000-4000-8000-000000000004', true);
select lives_ok($$select public.set_editorial_live_generation(false, 'library_only')$$, 'A platform admin uses the global switch');
select is((select live_mode from public.editorial_settings), 'library_only', 'The global mode is stored');

select * from finish();
rollback;
