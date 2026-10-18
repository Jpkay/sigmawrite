begin;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(23);

select has_table('public', 'editorial_passage_publications', 'Editorial passage publications are recorded');
select table_privs_are('public', 'editorial_passage_publications', 'authenticated', array['SELECT'], 'Clients cannot write editorial publications');

insert into auth.users(id, email, raw_user_meta_data) values
  ('26101818-0000-4000-8000-000000000001', 'ep-student-a@example.invalid', '{"role":"parent"}'),
  ('26101818-0000-4000-8000-000000000002', 'ep-student-b@example.invalid', '{"role":"parent"}');
update public.profiles set role = 'student'
where auth_user_id in ('26101818-0000-4000-8000-000000000001', '26101818-0000-4000-8000-000000000002');
insert into public.students(id, profile_id)
  select '26101818-0000-4000-8000-0000000000a1', id from public.profiles where auth_user_id = '26101818-0000-4000-8000-000000000001'
  on conflict (profile_id) do update set id = excluded.id;
insert into public.students(id, profile_id)
  select '26101818-0000-4000-8000-0000000000a2', id from public.profiles where auth_user_id = '26101818-0000-4000-8000-000000000002'
  on conflict (profile_id) do update set id = excluded.id;

insert into public.vocabulary_items(id, lemma, display_word, definition_fr)
values ('26101818-0000-4000-8000-0000000000e1', 'crampon', 'crampon', 'pointe sous la chaussure de football');

-- A passing candidate (body ≥ 200 characters, 3-choice questions, every hard/required gate passed, rubric ≥ 4.3).
insert into public.ai_generated_candidates(id, candidate_type, review_status, payload) values
('26101818-0000-4000-8000-0000000000c1', 'editorial_reading_text', 'auto_approved', jsonb_build_object(
  'pipelineVersion', 'editorial-1.0.0', 'interest', 'football', 'grade', 6, 'gradeBand', '6e-5e', 'styleKey', 'pergaud',
  'title', 'Le crampon perdu',
  'body', repeat('Sous la pluie fine, Malik cherchait son crampon dans la boue du terrain, et le gardien riait en silence. ', 4),
  'questions', jsonb_build_array(
    jsonb_build_object('questionText', 'Que cherche Malik ?', 'questionType', 'literal', 'choices', jsonb_build_array('Son crampon', 'Son ballon', 'Son maillot'), 'correctAnswer', 'Son crampon'),
    jsonb_build_object('questionText', 'Pourquoi le gardien rit-il ?', 'questionType', 'inference', 'choices', jsonb_build_array('Il se moque gentiment', 'Il a gagné', 'Il a froid'), 'correctAnswer', 'Il se moque gentiment')
  ),
  'targetLemmas', jsonb_build_array(jsonb_build_object('lemma', 'Crampon', 'kind', 'new'), jsonb_build_object('lemma', 'motinconnu', 'kind', 'due')),
  'targetTenses', jsonb_build_array('imparfait'), 'rubricMean', 4.5,
  'gates', jsonb_build_array(jsonb_build_object('gate', 'moderation', 'level', 'hard', 'passed', true), jsonb_build_object('gate', 'target_lemmas', 'level', 'required', 'passed', true), jsonb_build_object('gate', 'ai_tells', 'level', 'signal', 'passed', false))
)),
('26101818-0000-4000-8000-0000000000c2', 'editorial_reading_text', 'auto_approved', jsonb_build_object(
  'pipelineVersion', 'editorial-1.0.0', 'interest', 'football', 'grade', 6, 'gradeBand', '6e-5e', 'title', 'Trop faible',
  'body', repeat('Un texte assez long pour passer la longueur minimale mais pas la barre de qualité du pipeline. ', 4),
  'questions', '[]'::jsonb, 'rubricMean', 4.1, 'gates', '[]'::jsonb
));

select set_config('request.jwt.claim.role', 'authenticated', true);
select throws_ok($$select public.publish_editorial_passage('26101818-0000-4000-8000-0000000000c1', '{}'::jsonb)$$, '42501', null, 'Only the service role publishes editorial passages');

select set_config('request.jwt.claim.role', 'service_role', true);
select throws_ok($$select public.publish_editorial_passage('26101818-0000-4000-8000-0000000000c2', '{}'::jsonb)$$, null, 'editorial_rubric_below_bar', 'A candidate below the 4.3 bar is never published');
select is((public.publish_editorial_passage('26101818-0000-4000-8000-0000000000c1', '{"slug":"le-crampon-perdu","wordCount":72,"difficultyBand":"Foundation 6A","overall":40}'::jsonb)->>'created')::boolean, true, 'A passing candidate is published');
select is((public.publish_editorial_passage('26101818-0000-4000-8000-0000000000c1', '{}'::jsonb)->>'created')::boolean, false, 'Publication is idempotent');

select is((select tv.review_status from public.text_versions tv join public.editorial_passage_publications e on e.text_version_id = tv.id), 'auto_approved', 'The version is auto_approved, never human_approved');
select is((select tv.generation_type from public.text_versions tv join public.editorial_passage_publications e on e.text_version_id = tv.id), 'ai_automated', 'The version is marked as automated');
select is((select t.status || ':' || t.primary_interest from public.texts t join public.text_versions tv on tv.text_id = t.id join public.editorial_passage_publications e on e.text_version_id = tv.id), 'active:football', 'The text is active and tagged with its interest');
select is((select count(*)::int from public.questions q join public.editorial_passage_publications e on e.text_version_id = q.text_version_id), 2, 'Comprehension questions are materialised');
select is((select count(*)::int from public.question_choices c join public.questions q on q.id = c.question_id join public.editorial_passage_publications e on e.text_version_id = q.text_version_id where c.is_correct), 2, 'Exactly one correct choice per question');
select is((select count(*)::int from public.text_vocabulary v join public.editorial_passage_publications e on e.text_version_id = v.text_version_id where v.is_target_word), 1, 'Target words link to existing vocabulary items');
select is((select count(*)::int from public.vocabulary_items where lemma = 'motinconnu'), 0, 'No vocabulary item is invented');
select is((select approved_text_version_id is not null from public.ai_generated_candidates where id = '26101818-0000-4000-8000-0000000000c1'), true, 'The candidate points to its text version');
select is((select count(*)::int from public.pending_editorial_passages(10) id where id = '26101818-0000-4000-8000-0000000000c1'), 0, 'Published candidates leave the pending list');

select throws_ok($$update public.questions set correct_answer = 'Son ballon' where text_version_id = (select text_version_id from public.editorial_passage_publications)$$, null, 'automated_questions_are_immutable', 'Published answer keys are immutable');
select throws_ok($$update public.text_versions set body = 'changé' where id = (select text_version_id from public.editorial_passage_publications)$$, null, 'automated_passage_is_immutable', 'Published text is immutable');

insert into public.reading_sessions(student_id, text_version_id)
select '26101818-0000-4000-8000-0000000000a1', text_version_id from public.editorial_passage_publications;

select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select set_config('request.jwt.claim.sub', '26101818-0000-4000-8000-000000000002', true);
select is((select count(*)::int from public.text_versions tv join public.texts t on t.id = tv.text_id where t.slug like 'le-crampon-perdu-%'), 1, 'Every student can read the passage (no cohort limit)');
select throws_ok($$select public.withdraw_editorial_passage('26101818-0000-4000-8000-0000000000ff', 'test')$$, '42501', null, 'A student cannot withdraw a passage');
reset role;

select set_config('request.jwt.claim.role', 'service_role', true);
select is(public.withdraw_editorial_passage((select text_version_id from public.editorial_passage_publications), 'audit flag'), true, 'The audit withdraws a passage');
select throws_ok($$insert into public.reading_sessions(student_id, text_version_id) select '26101818-0000-4000-8000-0000000000a2', text_version_id from public.editorial_passage_publications$$, null, 'editorial_passage_withdrawn', 'A withdrawn passage accepts no new session');

select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select set_config('request.jwt.claim.sub', '26101818-0000-4000-8000-000000000002', true);
select is((select count(*)::int from public.text_versions tv join public.texts t on t.id = tv.text_id where t.slug like 'le-crampon-perdu-%'), 0, 'A withdrawn passage disappears for new readers');
select set_config('request.jwt.claim.sub', '26101818-0000-4000-8000-000000000001', true);
select is((select count(*)::int from public.text_versions tv join public.texts t on t.id = tv.text_id where t.slug like 'le-crampon-perdu-%'), 1, 'A student who started it can still finish it');

select * from finish();
rollback;
