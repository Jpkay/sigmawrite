begin;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(12);

select has_table('public', 'story_hero_profiles', 'Hero profiles exist');
select has_table('public', 'story_chapter_tasks', 'Chapter micro-tasks exist');
select has_table('public', 'story_endings', 'Alternative endings exist');
select table_privs_are('public', 'story_endings', 'authenticated', array['SELECT'], 'Clients cannot write endings directly');
select table_privs_are('public', 'story_chapter_tasks', 'authenticated', array['SELECT'], 'Clients cannot write micro-tasks directly');

insert into auth.users(id, email, raw_user_meta_data) values
  ('26101817-0000-4000-8000-000000000001', 'story-teacher@example.invalid', '{"role":"parent"}'),
  ('26101817-0000-4000-8000-000000000002', 'story-student@example.invalid', '{"role":"parent"}'),
  ('26101817-0000-4000-8000-000000000003', 'story-other@example.invalid', '{"role":"parent"}');
update public.profiles set role = case auth_user_id
  when '26101817-0000-4000-8000-000000000001' then 'platform_admin'
  else 'student' end
where auth_user_id in ('26101817-0000-4000-8000-000000000001','26101817-0000-4000-8000-000000000002','26101817-0000-4000-8000-000000000003');

insert into public.students(id, profile_id)
  select '26101817-0000-4000-8000-0000000000a1', id from public.profiles where auth_user_id = '26101817-0000-4000-8000-000000000002';
insert into public.students(id, profile_id)
  select '26101817-0000-4000-8000-0000000000a2', id from public.profiles where auth_user_id = '26101817-0000-4000-8000-000000000003';
insert into public.story_sagas(id, student_id, interest, style_key, grade_band, chapter_count, pipeline_version, hero_name)
values ('26101817-0000-4000-8000-0000000000b1', '26101817-0000-4000-8000-0000000000a1', 'football', 'verne', '6e-5e', 8, 'editorial-1.0.0', 'Lina');
insert into public.story_chapters(id, saga_id, chapter_index, body_template, status, source, pipeline_version)
values ('26101817-0000-4000-8000-0000000000d1', '26101817-0000-4000-8000-0000000000b1', 1, 'Tu ouvris la porte du vestiaire.', 'ready', 'fallback', 'editorial-1.0.0');
insert into public.story_hero_profiles(student_id, nickname, avatar, gender) values ('26101817-0000-4000-8000-0000000000a1', 'Lina', 'renard', 'f');
insert into public.story_chapter_tasks(chapter_id, student_id, word, task, correct_index)
values ('26101817-0000-4000-8000-0000000000d1', '26101817-0000-4000-8000-0000000000a1', 'vestiaire', '{"options":["a","b","c"]}', 1);
insert into public.story_endings(saga_id, student_id, body, target_words, style_key, word_count)
values ('26101817-0000-4000-8000-0000000000b1', '26101817-0000-4000-8000-0000000000a1', 'Et le ballon roula jusqu''au vestiaire.', array['vestiaire'], 'verne', 7);

select throws_ok($$insert into public.story_hero_profiles(student_id, avatar) values ('26101817-0000-4000-8000-0000000000a2', 'licorne-inconnue')$$, '23514', null, 'Only known avatars are stored');

select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select set_config('request.jwt.claim.sub', '26101817-0000-4000-8000-000000000002', true);
select is((select count(*)::int from public.story_endings), 1, 'A student reads their own ending (recueil)');
select is((select count(*)::int from public.story_hero_profiles), 1, 'A student reads their own hero');
select is((select count(*)::int from public.story_chapter_tasks), 0, 'A student never reads the stored answer of a micro-task');
select throws_ok($$insert into public.story_endings(saga_id, student_id, body, style_key, word_count) values ('26101817-0000-4000-8000-0000000000b1', '26101817-0000-4000-8000-0000000000a1', 'x', 'verne', 1)$$, '42501', null, 'A student cannot write an ending directly');

select set_config('request.jwt.claim.sub', '26101817-0000-4000-8000-000000000003', true);
select is((select count(*)::int from public.story_endings), 0, 'Another student cannot read someone else''s ending');

select set_config('request.jwt.claim.sub', '26101817-0000-4000-8000-000000000001', true);
select is((select count(*)::int from public.story_chapter_tasks), 1, 'Staff can audit micro-tasks');

select * from finish();
rollback;
