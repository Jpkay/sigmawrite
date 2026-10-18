begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(33);

select has_table('public','word_review_log','Word reviews keep a full log');
select has_table('public','student_memory_settings','Students have calendar and cap settings');
select has_table('public','fsrs_parameter_sets','FSRS parameters are versioned');
select has_table('public','fsrs_calibration_reports','Calibration reports are stored');
select has_table('public','word_memory_reports','Weekly memory reports are stored');
select has_column('public','learning_retrieval_schedules','facet','Word cards have a facet');
select has_column('public','vocabulary_learning_evidence','occurrence_key','Evidence is idempotent');
select function_privs_are('public','record_word_evidence',array['uuid','jsonb'],'authenticated',array[]::text[],'Students cannot forge word evidence');
select function_privs_are('public','record_word_review',array['jsonb'],'authenticated',array[]::text[],'Students cannot forge word reviews');
select function_privs_are('public','record_word_review',array['jsonb'],'service_role',array['EXECUTE'],'The server records word reviews');
select function_privs_are('public','introduce_word_cards',array['uuid','uuid','timestamp with time zone','timestamp with time zone','numeric'],'authenticated',array[]::text[],'Students cannot create cards directly');

-- A student on the granular (new) learning path, as in 0142.
insert into auth.users(id,email,raw_user_meta_data) values
 ('a1000000-0000-4000-8000-000000000002','word-memory-student@example.invalid','{"role":"parent"}');
insert into ontology_versions(id,version,document_path) values
 ('a2000000-0000-4000-8000-000000000099','word-memory-test','tests/word-memory');
insert into students(id) values ('a1000000-0000-4000-8000-000000000001');
update students set profile_id=(select id from profiles where auth_user_id='a1000000-0000-4000-8000-000000000002')
where id='a1000000-0000-4000-8000-000000000001';
insert into consent_records(student_id,consent_type,consent_version,privacy_policy_version)
values ('a1000000-0000-4000-8000-000000000001','student_over_15','test-v1','test-v1');
insert into taxonomy_releases(id,release_key,version,ontology_version_id,status,manifest,manifest_checksum,validation_report,published_by,published_at)
values ('a2000000-0000-4000-8000-000000000001','french-taxonomy-v3','3.0.0','a2000000-0000-4000-8000-000000000099','published','{"fixture":true}','word-memory-test','{"valid":true}',
 (select id from profiles where auth_user_id='a1000000-0000-4000-8000-000000000002'),now())
on conflict do nothing;
alter table diagnostic_item_bank_releases disable trigger diagnostic_bank_publication_guard;
insert into diagnostic_item_bank_releases(id,bank_key,version,status,taxonomy_release_id,manifest,manifest_checksum,validation_report,published_by,published_at)
values ('a3000000-0000-4000-8000-000000000001','word-memory-test-bank','word-memory-test','published',
 (select id from taxonomy_releases where release_key='french-taxonomy-v3' and status='published' limit 1),
 '{"checksum":"word-memory-test"}','word-memory-test','{"valid":true}',(select id from profiles where auth_user_id='a1000000-0000-4000-8000-000000000002'),now());
alter table diagnostic_item_bank_releases enable trigger diagnostic_bank_publication_guard;
insert into granular_assessment_releases(id,release_key,taxonomy_release_id,bank_release_id,status,content_checksum,bundle)
values ('a4000000-0000-4000-8000-000000000001','word-memory-granular',
 (select id from taxonomy_releases where release_key='french-taxonomy-v3' and status='published' limit 1),
 'a3000000-0000-4000-8000-000000000001','published','test','{"assessment":{"taxonomyChecksum":"word-memory-test","bankChecksum":"word-memory-test"}}');
insert into granular_assessment_sessions(student_id,release_id,state) values
('a1000000-0000-4000-8000-000000000001','a4000000-0000-4000-8000-000000000001','{"revision":0,"phase":"learning","completionReason":"time_budget"}');

-- A teachable word added after 0037: anchors are created lazily.
insert into vocabulary_items(id,lemma,display_word,definition_fr)
values ('a5000000-0000-4000-8000-000000000001','intrépide','intrépide','Qui n’a peur de rien.');

select set_config('request.jwt.claim.role','service_role',true);
select ok(public.ensure_vocabulary_lexical_anchors(array['a5000000-0000-4000-8000-000000000001'::uuid]) >= 2, 'Anchors create a lemma and a sense');
select is((select count(*)::int from public.resolve_word_senses(array['a5000000-0000-4000-8000-000000000001'::uuid], array['intrépide']) where sense_id is not null), 2, 'Items and forms resolve to the teachable sense');

-- A.1: exposure counts, mastery stays at 0. Replays are ignored.
select is(public.record_word_evidence('a1000000-0000-4000-8000-000000000001',
 '[{"vocabulary_item_id":"a5000000-0000-4000-8000-000000000001","evidence_kind":"exposure","successful":true,"source":"reading","activity_format":"reading_exposure","occurrence_key":"reading:1","to_introduce":true,"first_seen_sentence":"Le capitaine intrépide avance."}]'::jsonb), 1, 'Exposure evidence is written');
select is(public.record_word_evidence('a1000000-0000-4000-8000-000000000001',
 '[{"vocabulary_item_id":"a5000000-0000-4000-8000-000000000001","evidence_kind":"exposure","successful":true,"source":"reading","occurrence_key":"reading:1"}]'::jsonb), 0, 'A replayed occurrence is ignored');
select results_eq(
 $$select exposures, mastery::numeric, to_introduce, word_status from student_word_mastery where student_id='a1000000-0000-4000-8000-000000000001'$$,
 $$values (1, 0::numeric, true, 'decouvert'::text)$$,
 'Reading adds one exposure and never raises mastery');

-- A.4: a misspelling in a dictée is correct_spelling = false evidence.
select is(public.record_word_evidence('a1000000-0000-4000-8000-000000000001',
 '[{"vocabulary_item_id":"a5000000-0000-4000-8000-000000000001","evidence_kind":"correct_spelling","successful":false,"facet":"spelling","source":"dictation","activity_format":"dictation","occurrence_key":"dictation:1:0:spelling"}]'::jsonb), 1, 'Dictée evidence is written');
select is((select successful from vocabulary_learning_evidence where occurrence_key='dictation:1:0:spelling'), false, 'The misspelled word is recorded as correct_spelling: false');

-- B.1 / C.2: introduction creates exactly two cards, first review later.
select is((select count(*)::int from public.introduce_word_cards('a1000000-0000-4000-8000-000000000001',
 (select sense_id from public.resolve_word_senses(array['a5000000-0000-4000-8000-000000000001'::uuid], '{}') limit 1), now(), now() + interval '1 day', 1)), 2, 'Introducing a word creates a spelling and a meaning card');
select is((select to_introduce from student_word_mastery where student_id='a1000000-0000-4000-8000-000000000001'), false, 'The word leaves the to-introduce list');

-- A counted review updates FSRS, logs, and is idempotent.
select ok((public.record_word_review(jsonb_build_object(
 'student_id','a1000000-0000-4000-8000-000000000001',
 'schedule_id',(select id from learning_retrieval_schedules where student_id='a1000000-0000-4000-8000-000000000001' and facet='spelling'),
 'occurrence_key','review:1','reviewed_at',now()+interval '1 day','counts_for_fsrs',true,'expected_last_reviewed_at',null,
 'rating',3,'correct',true,'activity_format','hear_and_type','source','review',
 'fsrs',jsonb_build_object('stability',2.3,'difficulty',2.1,'reps',1,'lapses',0,'interval_days',3,'due_at',now()+interval '4 days'),
 'evidence',jsonb_build_object('vocabulary_item_id','a5000000-0000-4000-8000-000000000001','evidence_kind','correct_spelling','successful',true,'source','review','activity_format','hear_and_type')
))->>'duplicate')::boolean = false, 'A counted review is recorded');
select is((select (fsrs_state->>'stability')::numeric from learning_retrieval_schedules where student_id='a1000000-0000-4000-8000-000000000001' and facet='spelling'), 2.3, 'The card keeps its FSRS state');
select is((select count(*)::int from word_review_log where occurrence_key='review:1' and counts_for_fsrs and rating=3), 1, 'The review log has the rating');
select is((select count(*)::int from vocabulary_learning_evidence where occurrence_key='review:1' and review_log_id is not null), 1, 'The review is also evidence');
select ok((public.record_word_review(jsonb_build_object('student_id','a1000000-0000-4000-8000-000000000001',
 'schedule_id',(select id from learning_retrieval_schedules where student_id='a1000000-0000-4000-8000-000000000001' and facet='spelling'),
 'occurrence_key','review:1','reviewed_at',now()))->>'duplicate')::boolean, 'Replaying a review is a no-op');
select throws_ok($$select public.record_word_review(jsonb_build_object('student_id','a1000000-0000-4000-8000-000000000001',
 'schedule_id',(select id from learning_retrieval_schedules where student_id='a1000000-0000-4000-8000-000000000001' and facet='spelling'),
 'occurrence_key','review:stale','reviewed_at',now()+interval '2 days','counts_for_fsrs',true,'expected_last_reviewed_at',null,'rating',3,'activity_format','hear_and_type','source','review',
 'fsrs',jsonb_build_object('stability',3,'difficulty',2,'interval_days',3,'due_at',now()+interval '5 days')))$$,
 '40001', null, 'A concurrent double update is rejected');

-- A.5: the student on the granular path reads their memory; writes stay on the server path.
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000002"}',true);
set local role authenticated;
select ok(public.student_learning_is_unlocked('a1000000-0000-4000-8000-000000000001'), 'The granular path unlocks learning');
select is((select count(*)::int from vocabulary_learning_evidence), 3, 'The student reads their own word evidence');
select is((select count(*)::int from student_word_mastery), 1, 'The student reads their own word memory');
select is((select count(*)::int from learning_retrieval_schedules where target_type='lexical_sense'), 2, 'The student reads their word cards');
select throws_ok($$insert into vocabulary_learning_evidence(student_id,vocabulary_item_id,evidence_kind,successful) values ('a1000000-0000-4000-8000-000000000001','a5000000-0000-4000-8000-000000000001','meaning_recall',true)$$,
 '42501', null, 'Students cannot insert evidence directly');
select throws_ok($$update student_word_mastery set mastery=1$$, '42501', null, 'Students cannot raise their own mastery');
select throws_ok($$insert into learning_retrieval_schedules(student_id,target_type,target_id,retrieval_mode,facet,due_at) values ('a1000000-0000-4000-8000-000000000001','lexical_sense',gen_random_uuid(),'production','meaning',now())$$,
 '42501', null, 'Students cannot create word cards directly');
reset role;

select * from finish();
rollback;
