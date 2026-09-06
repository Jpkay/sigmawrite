begin;
set local search_path=public,extensions;
create extension if not exists pgtap with schema extensions;
select plan(12);
insert into auth.users(id,email) values
('b2800000-0000-4000-8000-000000000001','editor-admin@test.invalid'),
('b2800000-0000-4000-8000-000000000002','editor-reviewer@test.invalid');
update profiles set role='platform_admin' where auth_user_id='b2800000-0000-4000-8000-000000000001';
update profiles set role='content_reviewer' where auth_user_id='b2800000-0000-4000-8000-000000000002';
insert into content_reviewer_profiles(profile_id,active,invite_status) select id,true,'active' from profiles where auth_user_id='b2800000-0000-4000-8000-000000000002';
insert into competency_nodes(id,key,strand,label_fr,review_status) values
('b2810000-0000-4000-8000-000000000001','review-editor-test','grammaire_syntaxe','Relecture','human_approved');
insert into competency_items(id,primary_node_id,strand,modality,response_type,prompt_fr,prompt_version,review_status) values
('b2820000-0000-4000-8000-000000000001','b2810000-0000-4000-8000-000000000001','grammaire_syntaxe','reading','mcq','Choisis une phrase.','diagnostic-bank-v2','needs_human_review');
insert into competency_item_choices(id,item_id,choice_text,is_correct,position) values
('b2830000-0000-4000-8000-000000000001','b2820000-0000-4000-8000-000000000001','Il joue.',true,0),
('b2830000-0000-4000-8000-000000000002','b2820000-0000-4000-8000-000000000001','Il jouent.',false,1);
create temporary table editor_payload as select jsonb_agg(jsonb_build_object('id',id,'text',choice_text,'correct',is_correct,'feedbackFr','Explication.')) as choices from competency_item_choices where item_id='b2820000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub','b2800000-0000-4000-8000-000000000001',true);
select lives_ok($$select save_review_exercise_content('b2820000-0000-4000-8000-000000000001','Choisis la bonne phrase.',null,(select choices from editor_payload))$$,'Administrator can save the complete pending exercise');
select is((select prompt_fr from competency_items where id='b2820000-0000-4000-8000-000000000001'),'Choisis la bonne phrase.','Prompt saved');
select is((select review_status from competency_items where id='b2820000-0000-4000-8000-000000000001'),'needs_human_review','Editing does not approve');
select is((select feedback_fr from competency_item_choices where id='b2830000-0000-4000-8000-000000000001'),'Explication.','Feedback saved without replacing choice identity');
select throws_ok($$select save_review_exercise_content('b2820000-0000-4000-8000-000000000001','Should not be saved.',null,'[]')$$,null,'invalid_review_choices','Cannot silently remove choices');
select throws_ok($$select save_review_exercise_content('b2820000-0000-4000-8000-000000000001','Should not be saved.',null,(select jsonb_agg(value || '{"correct":false}'::jsonb) from editor_payload,jsonb_array_elements(choices)))$$,null,'invalid_answer_key','Requires exactly one correct choice');
select is((select prompt_fr from competency_items where id='b2820000-0000-4000-8000-000000000001'),'Choisis la bonne phrase.','Invalid edits roll back atomically');
select set_config('request.jwt.claim.sub','b2800000-0000-4000-8000-000000000002',true);
select throws_ok($$select save_review_exercise_content('b2820000-0000-4000-8000-000000000001','Choisis une phrase.',null,(select choices from editor_payload))$$,null,'item_assignment_not_found','Reviewer cannot edit unassigned content');
insert into competency_item_review_assignments(item_id,reviewer_profile_id,queue_position) select 'b2820000-0000-4000-8000-000000000001',id,1 from profiles where auth_user_id='b2800000-0000-4000-8000-000000000002';
select lives_ok($$select save_review_exercise_content('b2820000-0000-4000-8000-000000000001','Choisis une phrase correcte.',null,(select choices from editor_payload))$$,'Assigned active reviewer can edit');
update competency_items set review_status='human_approved' where id='b2820000-0000-4000-8000-000000000001';
select throws_ok($$select save_review_exercise_content('b2820000-0000-4000-8000-000000000001','Should not be saved.',null,(select choices from editor_payload))$$,null,'item_not_reviewable','Finalized content cannot be edited through the pending editor');
select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select save_review_exercise_content('b2820000-0000-4000-8000-000000000001','Should not be saved.',null,(select choices from editor_payload))$$,null,'reviewer_access_denied','Unauthenticated caller cannot edit');
select function_privs_are('public','save_review_exercise_content',array['uuid','text','text','jsonb'],'anon',array[]::text[],'Anonymous role has no editor permission');
select * from finish();
rollback;
