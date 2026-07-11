begin;
create extension if not exists pgtap with schema extensions;
select plan(34);

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('10000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin@test.local','',now(),'{}','{"role":"platform_admin","display_name":"Admin"}',now(),now()),
('10000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','a@test.local','',now(),'{}','{"role":"content_reviewer","display_name":"Évaluatrice A"}',now(),now()),
('10000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','b@test.local','',now(),'{}','{"role":"content_reviewer","display_name":"Évaluateur B"}',now(),now());

insert into public.content_reviewer_profiles(profile_id,active,invite_status,activated_at)
select id,true,'active',now() from public.profiles where auth_user_id in ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003');

insert into public.ai_generated_candidates(id,candidate_type,payload,review_status)
values('20000000-0000-4000-8000-000000000001','reading_text','{
  "id":"20000000-0000-4000-8000-000000000001","createdAt":"2026-07-10T00:00:00Z","reviewStatus":"needs_human_review",
  "input":{"language":"fr","studentGrade":7,"targetReadingBand":"Secondary 7A","topic":"Les volcans du Rwanda","primaryInterest":"science","knowledgeDomains":["science"],"targetConcepts":[],"textType":"expository","wordCountTarget":200,"maxAverageSentenceLength":18,"maxNewAcademicWords":8,"targetVocabulary":[],"targetSkills":["inference"],"avoid":[],"tone":"curious_explainer"},
  "generated":{"title":"Les volcans du Rwanda","body":"Un texte réaliste en français pour vérifier le portail de révision humaine.","estimatedReadingBand":"Secondary 7A","targetVocabulary":[],"knowledgeConcepts":[],"skillsPracticed":["inference"],"questions":[{"questionText":"Quelle est l’idée principale ?","questionType":"main_idea","answerFormat":"multiple_choice","choices":["Les volcans","La mer"],"correctAnswer":"Les volcans","rubric":"Réponse explicite","skillIds":["inference"],"difficulty":40}],"safetyNotes":[],"factualClaims":[]},
  "difficulty":{"lexical":30,"syntax":30,"knowledge":30,"inference":30,"stamina":20,"overall":30,"band":"Secondary 7A","features":{"wordCount":12,"avgSentenceLength":12,"connectorCount":0}},
  "moderation":{"passed":true,"flaggedCategories":[],"needsHumanReview":false},"questionDifficulties":[40],"flags":{"moderationPassed":true,"factualNeedsReview":false,"sensitive":false,"difficultyMismatch":false}
}'::jsonb,'needs_human_review');

insert into public.content_review_versions(id,candidate_id,version_number,payload,required_reviewers)
select '30000000-0000-4000-8000-000000000001',id,1,payload,2 from public.ai_generated_candidates where id='20000000-0000-4000-8000-000000000001';
insert into public.review_assignments(id,review_version_id,reviewer_profile_id,assigned_by)
select '40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',r.id,a.id from public.profiles r cross join public.profiles a where r.auth_user_id='10000000-0000-4000-8000-000000000002' and a.auth_user_id='10000000-0000-4000-8000-000000000001';
insert into public.review_assignments(id,review_version_id,reviewer_profile_id,assigned_by)
select '40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001',r.id,a.id from public.profiles r cross join public.profiles a where r.auth_user_id='10000000-0000-4000-8000-000000000003' and a.auth_user_id='10000000-0000-4000-8000-000000000001';

set local role authenticated;
set local request.jwt.claims='{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}';
select is((select count(*) from public.review_assignments),1::bigint,'Reviewer A sees only their assignment');
select is((select count(*) from public.content_review_versions),1::bigint,'Reviewer A sees the assigned snapshot');
select is((select count(*) from public.ai_generated_candidates),0::bigint,'Reviewer cannot access the AI workflow table');
select throws_ok($$insert into public.review_assignments(review_version_id,reviewer_profile_id) values('30000000-0000-4000-8000-000000000001',public.current_profile_id())$$,'42501',null,'Reviewer cannot assign passages');
select throws_ok($$select public.lock_content_benchmark('30000000-0000-4000-8000-000000000001','GOLD-01')$$,null,'admin_required','Reviewer cannot lock benchmarks');
select lives_ok($$select public.save_content_review('40000000-0000-4000-8000-000000000001','{"naturalness":4}'::jsonb,'','','{}','[]'::jsonb,false)$$,'Reviewer can save a partial draft');
select is((select count(*) from public.passage_reviews),1::bigint,'Reviewer sees their own draft');

set local request.jwt.claims='{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}';
select is((select count(*) from public.passage_reviews),0::bigint,'Reviewer B cannot see Reviewer A draft');

set local role postgres;
update public.content_reviewer_profiles set active=false where profile_id=(select id from public.profiles where auth_user_id='10000000-0000-4000-8000-000000000002');
set local role authenticated;
set local request.jwt.claims='{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}';
select is((select count(*) from public.review_assignments),0::bigint,'Deactivated reviewer loses queue access');

set local role postgres;
update public.content_reviewer_profiles set active=true where profile_id=(select id from public.profiles where auth_user_id='10000000-0000-4000-8000-000000000002');
set local role authenticated;
set local request.jwt.claims='{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}';
select lives_ok($$select public.save_content_review('40000000-0000-4000-8000-000000000001','{"naturalness":4,"pedagogical_quality":4,"engagement":4,"difficulty_match":4,"vocabulary":4,"grammar":4,"question_quality":4,"cultural_age":4}'::jsonb,'approve','','{}','[{"questionIndex":0,"outcome":"correct_clear","comment":""}]'::jsonb,true)$$,'Reviewer can submit a complete review');
select throws_ok($$select public.save_content_review('40000000-0000-4000-8000-000000000001','{}'::jsonb,'','','{}','[]'::jsonb,false)$$,null,'submitted_review_is_immutable','Submitted review cannot be changed through RPC');
select throws_ok($$update public.passage_reviews set general_comment='mutation' where assignment_id='40000000-0000-4000-8000-000000000001'$$,'42501',null,'Reviewer has no direct update privilege');

set local role postgres;
select throws_ok($$update public.passage_reviews set general_comment='mutation' where assignment_id='40000000-0000-4000-8000-000000000001'$$,null,'submitted_review_is_immutable','Submitted review trigger also blocks privileged mutation');

set local role authenticated;
set local request.jwt.claims='{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
select is(
  public.assign_content_reviews(
    array['30000000-0000-4000-8000-000000000001'::uuid],
    array[
      (select id from public.profiles where auth_user_id='10000000-0000-4000-8000-000000000002'),
      (select id from public.profiles where auth_user_id='10000000-0000-4000-8000-000000000003')
    ]
  ),
  0,
  'Auto-assignment is idempotent and prevents duplicate reviewer/passage pairs'
);

set local request.jwt.claims='{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}';
select lives_ok($$select public.save_content_review('40000000-0000-4000-8000-000000000002','{"naturalness":1,"pedagogical_quality":1,"engagement":1,"difficulty_match":1,"vocabulary":1,"grammar":1,"question_quality":1,"cultural_age":1}'::jsonb,'reject','Le niveau et la question doivent être entièrement repris.','{difficulty_mismatch,ambiguous_question}','[{"questionIndex":0,"outcome":"correct_clear","comment":""}]'::jsonb,true)$$,'Reviewer B can submit a materially different independent review');
select is((select workflow_status from public.content_review_versions where id='30000000-0000-4000-8000-000000000001'),'review_complete','All required submissions complete the passage review');
select is((select agreement_classification from public.content_review_versions where id='30000000-0000-4000-8000-000000000001'),'high_disagreement','Opposing decisions and a three-point spread produce high disagreement');

set local request.jwt.claims='{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
select is((select count(*) from public.review_assignments),2::bigint,'Admin sees every assignment');
select lives_ok($$select public.resolve_content_review('30000000-0000-4000-8000-000000000001','send_for_revision','Les avis divergent fortement ; une version révisée est requise.')$$,'Admin can resolve a disagreement with an audited note');
select is((select workflow_status from public.content_review_versions where id='30000000-0000-4000-8000-000000000001'),'needs_revision','Resolution moves the reviewed snapshot to needs revision');
select lives_ok($$select public.create_content_review_revision('30000000-0000-4000-8000-000000000001',(select payload from public.content_review_versions where id='30000000-0000-4000-8000-000000000001'),'Version de contrôle après désaccord.')$$,'Admin can create a linked revision without overwriting the reviewed snapshot');
select is((select count(*) from public.content_review_versions where candidate_id='20000000-0000-4000-8000-000000000001'),2::bigint,'Version-preserving revision creates a second snapshot');
select is((select payload#>>'{generated,title}' from public.content_review_versions where id='30000000-0000-4000-8000-000000000001'),'Les volcans du Rwanda','The reviewed payload remains unchanged');

set local role postgres;
insert into public.texts(id,canonical_title,status)
select format('60000000-0000-4000-8000-%s',lpad(g::text,12,'0'))::uuid,format('Référence QA %s',g),'active'
from generate_series(1,6) g;
insert into public.text_versions(id,text_id,version_number,title,body,review_status,generation_type,source_policy,difficulty_band,text_type)
select format('61000000-0000-4000-8000-%s',lpad(g::text,12,'0'))::uuid,
  format('60000000-0000-4000-8000-%s',lpad(g::text,12,'0'))::uuid,1,format('Référence QA %s',g),
  'Passage français immuable utilisé uniquement dans une transaction de test.','human_approved','ai_human_reviewed','generated',
  case when g<=2 then 'Foundation 6A' when g<=4 then 'Secondary 7A' else 'Secondary 9A' end,
  case when g%2=0 then 'narrative_nonfiction' else 'expository' end
from generate_series(1,6) g;
insert into public.questions(id,text_version_id,question_text,question_type,answer_format,correct_answer)
select format('62000000-0000-4000-8000-%s',lpad(g::text,12,'0'))::uuid,
  format('61000000-0000-4000-8000-%s',lpad(g::text,12,'0'))::uuid,'Quelle idée est correcte ?','main_idea','short_answer','La réponse attendue.'
from generate_series(1,6) g;
insert into public.ai_generated_candidates(id,candidate_type,payload,review_status)
select format('63000000-0000-4000-8000-%s',lpad(g::text,12,'0'))::uuid,'benchmark_test',
  jsonb_build_object('generated',jsonb_build_object('title',format('Référence QA %s',g),'questions',jsonb_build_array()),'input',jsonb_build_object('topic',format('Sujet %s',g),'targetReadingBand','Secondary 7A','textType','expository','targetSkills',jsonb_build_array('main_idea'))),
  'human_approved'
from generate_series(1,6) g;
insert into public.content_review_versions(id,candidate_id,version_number,payload,workflow_status,required_reviewers,published_text_version_id)
select format('64000000-0000-4000-8000-%s',lpad(g::text,12,'0'))::uuid,
  format('63000000-0000-4000-8000-%s',lpad(g::text,12,'0'))::uuid,1,c.payload,'published',3,
  format('61000000-0000-4000-8000-%s',lpad(g::text,12,'0'))::uuid
from generate_series(1,6) g join public.ai_generated_candidates c on c.id=format('63000000-0000-4000-8000-%s',lpad(g::text,12,'0'))::uuid;
insert into public.editorial_resolutions(id,review_version_id,action,admin_note,reviewer_results_snapshot,resolved_by)
select format('65000000-0000-4000-8000-%s',lpad(g::text,12,'0'))::uuid,
  format('64000000-0000-4000-8000-%s',lpad(g::text,12,'0'))::uuid,'approve','Résolution de test transactionnelle.','[]'::jsonb,
  (select id from public.profiles where auth_user_id='10000000-0000-4000-8000-000000000001')
from generate_series(1,6) g;
update public.content_review_versions rv set final_resolution_id=format('65000000-0000-4000-8000-%s',right(rv.id::text,12))::uuid
where rv.id::text like '64000000-0000-4000-8000-%';

set local role authenticated;
set local request.jwt.claims='{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
select throws_ok($$select public.lock_initial_benchmark_set(array(select id from public.content_review_versions where id::text like '64000000-0000-4000-8000-%' order by id limit 5))$$,null,'exactly_six_unique_benchmarks_required','Initial gold set rejects fewer than six passages');
select lives_ok($$select public.lock_initial_benchmark_set(array(select id from public.content_review_versions where id::text like '64000000-0000-4000-8000-%' order by id))$$,'Admin can atomically lock exactly six eligible passages');
select is((select count(*) from public.content_benchmarks where locked),6::bigint,'Exactly six benchmark records are locked');
select is((select status from public.benchmark_sets where code='INITIAL-GOLD'),'locked','The initial benchmark set locks only at six');
select is((select count(*) from public.text_versions where id::text like '61000000-0000-4000-8000-%' and review_status='benchmark_locked'),6::bigint,'Benchmark locking freezes all six immutable text versions');
select throws_ok($$select public.lock_content_benchmark('64000000-0000-4000-8000-000000000001','GOLD-01')$$,null,'six_benchmarks_already_locked','A seventh or duplicate benchmark lock is rejected');
select lives_ok($$select public.unlock_content_benchmark((select id from public.content_benchmarks where benchmark_code='GOLD-01' and locked),'Contrôle du déverrouillage audité.')$$,'Dedicated unlock action accepts a required reason');
select is((select count(*) from public.content_benchmarks where locked),5::bigint,'Unlock preserves history and leaves five active locks');
select is((select review_status from public.text_versions where id='61000000-0000-4000-8000-000000000001'),'human_approved','Unlock restores the exact text version to human approved');
select is((select status from public.benchmark_sets where code='INITIAL-GOLD'),'draft','Unlock reopens the benchmark set');

set local role anon;
set local request.jwt.claims='{}';
select is((select count(*) from public.review_assignments),0::bigint,'Anonymous user sees no review data');

select * from finish();
rollback;
