begin;
set local search_path=public,extensions;
create extension if not exists pgtap with schema extensions;
select plan(7);
insert into auth.users(id,email) values ('b2900000-0000-4000-8000-000000000001','approval-admin@test.invalid');
update profiles set role='platform_admin' where auth_user_id='b2900000-0000-4000-8000-000000000001';
insert into competency_nodes(id,key,strand,label_fr,review_status) values ('b2910000-0000-4000-8000-000000000001','approval-permissions-test','grammaire_syntaxe','Relecture','human_approved');
insert into competency_items(id,primary_node_id,strand,modality,response_type,prompt_fr,prompt_version,review_status) values
('b2920000-0000-4000-8000-000000000001','b2910000-0000-4000-8000-000000000001','grammaire_syntaxe','reading','mcq','Choisis une phrase.','diagnostic-bank-v2','needs_human_review'),
('b2920000-0000-4000-8000-000000000002','b2910000-0000-4000-8000-000000000001','grammaire_syntaxe','reading','mcq','Choisis une autre phrase.','diagnostic-bank-v2','needs_human_review');
insert into competency_item_choices(item_id,choice_text,is_correct,position) values
('b2920000-0000-4000-8000-000000000001','Il joue.',true,0),
('b2920000-0000-4000-8000-000000000001','Il jouent.',false,1),
('b2920000-0000-4000-8000-000000000002','Il joue.',true,0),
('b2920000-0000-4000-8000-000000000002','Il jouent.',false,1);
select set_config('request.jwt.claim.sub','b2900000-0000-4000-8000-000000000001',true);
set local role authenticated;
select lives_ok($$update competency_items set review_status='human_approved' where id='b2920000-0000-4000-8000-000000000001'$$,'Authenticated admin can approve alongside other same-node exercises');
select is((select review_status from competency_items where id='b2920000-0000-4000-8000-000000000001'),'human_approved','Approval persists');
select throws_ok($$update competency_items set prompt_fr='Choisis une phrase.',review_status='human_approved' where id='b2920000-0000-4000-8000-000000000002'$$,null,'duplicate_diagnostic_prompt','Real duplicate protection still applies to authenticated approval');
select is((select review_status from competency_items where id='b2920000-0000-4000-8000-000000000002'),'needs_human_review','Failed approval leaves the exercise pending');
select lives_ok($$update competency_items set review_status='rejected' where id='b2920000-0000-4000-8000-000000000002'$$,'Authenticated admin can reject an exercise');
reset role;
select function_privs_are('public','normalized_diagnostic_item_surface',array['uuid','text','text'],'authenticated',array[]::text[],'Private normalizer remains inaccessible directly');
select function_privs_are('public','guard_reviewed_diagnostic_prompt_uniqueness',array[]::text[],'authenticated',array[]::text[],'Trigger is not exposed as a callable function');
select * from finish();
rollback;
