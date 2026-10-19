begin;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(12);

select has_table('public', 'story_chapter_extras', 'Chapter extras (comprehension + bonus scene) exist');
select has_column('public', 'editorial_library_items', 'bonus_scene', 'Fallback chapters can carry a bonus scene');
select has_column('public', 'story_chapter_tasks', 'bonus_unlocked', 'Tasks record an unlocked bonus');
select table_privs_are('public', 'story_chapter_extras', 'authenticated', array['SELECT'], 'Clients cannot write chapter extras directly');

insert into auth.users(id, email, raw_user_meta_data) values
  ('26101819-0000-4000-8000-000000000001', 'extras-admin@example.invalid', '{"role":"parent"}'),
  ('26101819-0000-4000-8000-000000000002', 'extras-student@example.invalid', '{"role":"parent"}');
update public.profiles set role = case auth_user_id
  when '26101819-0000-4000-8000-000000000001' then 'platform_admin'
  else 'student' end
where auth_user_id in ('26101819-0000-4000-8000-000000000001','26101819-0000-4000-8000-000000000002');

insert into public.students(id, profile_id)
  select '26101819-0000-4000-8000-0000000000a1', id from public.profiles where auth_user_id = '26101819-0000-4000-8000-000000000002';
insert into public.story_sagas(id, student_id, interest, style_key, grade_band, chapter_count, pipeline_version)
values ('26101819-0000-4000-8000-0000000000b1', '26101819-0000-4000-8000-0000000000a1', 'football', 'verne', '6e-5e', 8, 'editorial-1.0.0');
insert into public.story_chapters(id, saga_id, chapter_index, body_template, status, source, pipeline_version)
values ('26101819-0000-4000-8000-0000000000d1', '26101819-0000-4000-8000-0000000000b1', 2, 'Le gardien siffla entre ses dents.', 'ready', 'live', 'editorial-1.0.0');

insert into public.story_chapter_extras(chapter_id, comprehension, bonus_scene)
values ('26101819-0000-4000-8000-0000000000d1',
  '{"question":"Que fait le gardien ?","options":["Il siffle","Il court","Il dort"],"correctIndex":0,"explanation":"Le texte dit qu''il siffle.","type":"literal"}',
  'Dans les tribunes, un parapluie jaune s''ouvrit tout seul.');

select throws_ok($$insert into public.story_chapter_extras(chapter_id, bonus_scene) values ('26101819-0000-4000-8000-0000000000d1', 'Encore.')$$, '23505', null, 'One extras row per chapter');
select throws_ok($$update public.story_chapter_extras set comprehension = '{"question":"Que fait le gardien ?","options":["a","b"],"correctIndex":0}' where chapter_id = '26101819-0000-4000-8000-0000000000d1'$$, '23514', null, 'A comprehension question has exactly three options');

-- A comprehension task carries no word; a vocabulary task still needs one.
select lives_ok($$insert into public.story_chapter_tasks(chapter_id, student_id, kind, word, task, correct_index) values ('26101819-0000-4000-8000-0000000000d1', '26101819-0000-4000-8000-0000000000a1', 'comprehension', null, '{"options":["a","b","c"]}', 0)$$, 'Comprehension tasks are stored without a word');
select throws_ok($$update public.story_chapter_tasks set kind = 'vocabulary' where chapter_id = '26101819-0000-4000-8000-0000000000d1'$$, '23514', null, 'A vocabulary task needs its word');
select throws_ok($$update public.story_chapter_tasks set kind = 'riddle' where chapter_id = '26101819-0000-4000-8000-0000000000d1'$$, '23514', null, 'Only known task kinds are stored');

select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select set_config('request.jwt.claim.sub', '26101819-0000-4000-8000-000000000002', true);
select is((select count(*)::int from public.story_chapter_extras), 0, 'A student never reads the stored answer or the locked bonus scene');
select throws_ok($$insert into public.story_chapter_extras(chapter_id, bonus_scene) values ('26101819-0000-4000-8000-0000000000d1', 'x')$$, '42501', null, 'A student cannot write chapter extras');

select set_config('request.jwt.claim.sub', '26101819-0000-4000-8000-000000000001', true);
select is((select count(*)::int from public.story_chapter_extras), 1, 'Staff can audit chapter extras');

select * from finish();
rollback;
