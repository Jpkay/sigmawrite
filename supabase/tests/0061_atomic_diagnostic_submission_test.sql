begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(10);
select has_function('public','diagnostic_bkt_update',array['numeric','boolean','numeric','numeric','numeric'],'Database BKT matches the trusted scoring contract');
select has_function('public','diagnostic_mastery_uncertainty',array['numeric','integer'],'Database uncertainty is deterministic');
select has_function('public','submit_section_diagnostic_response',array['uuid','uuid','uuid','uuid','uuid','uuid','text','boolean','integer','text[]','uuid'],'Submission is one database transaction');
select is(round(public.diagnostic_bkt_update(.5,true,.25),6),.815217::numeric,'Correct MCQ raises mastery from a neutral prior');
select cmp_ok(public.diagnostic_bkt_update(.5,false,.25),'<',.5::numeric,'Wrong response lowers mastery');
select is(public.diagnostic_mastery_uncertainty(.5,0),1::numeric,'An unobserved neutral estimate has maximum uncertainty');

insert into public.students(id,display_name) values
  ('61000000-0000-0000-0000-000000000001','Atomic replay test');
insert into public.competency_nodes(id,key,strand,label_fr,review_status) values
  ('61000000-0000-0000-0000-000000000100','pgtap_atomic_replay_node','grammaire_syntaxe','Atomic replay node','human_approved');
insert into public.competency_items(
  id,primary_node_id,strand,modality,response_type,prompt_fr,validator_type,review_status
) values
  ('61000000-0000-0000-0000-000000000101','61000000-0000-0000-0000-000000000100','grammaire_syntaxe','grammar_analysis','mcq','Question A','exact','human_approved'),
  ('61000000-0000-0000-0000-000000000102','61000000-0000-0000-0000-000000000100','grammaire_syntaxe','grammar_analysis','mcq','Question B','exact','human_approved');
insert into public.diagnostic_runs(id,student_id,status,protocol_version) values
  ('61000000-0000-0000-0000-000000000201','61000000-0000-0000-0000-000000000001','running','pgtap-atomic-v1'),
  ('61000000-0000-0000-0000-000000000202','61000000-0000-0000-0000-000000000001','running','pgtap-atomic-v2');
insert into public.diagnostic_run_targets(run_id,node_id,target_reason) values
  ('61000000-0000-0000-0000-000000000201','61000000-0000-0000-0000-000000000100','initial_scope'),
  ('61000000-0000-0000-0000-000000000202','61000000-0000-0000-0000-000000000100','initial_scope');
insert into public.diagnostic_run_items(
  id,run_id,item_id,node_id,section_key,position,item_snapshot
) values
  ('61000000-0000-0000-0000-000000000301','61000000-0000-0000-0000-000000000201','61000000-0000-0000-0000-000000000101','61000000-0000-0000-0000-000000000100','grammar',1,'{}'),
  ('61000000-0000-0000-0000-000000000302','61000000-0000-0000-0000-000000000201','61000000-0000-0000-0000-000000000102','61000000-0000-0000-0000-000000000100','grammar',2,'{}'),
  ('61000000-0000-0000-0000-000000000303','61000000-0000-0000-0000-000000000202','61000000-0000-0000-0000-000000000102','61000000-0000-0000-0000-000000000100','grammar',1,'{}');
insert into public.diagnostic_responses(
  id,run_item_id,run_id,student_id,idempotency_key,score,is_correct,latency_ms
) values (
  '61000000-0000-0000-0000-000000000401',
  '61000000-0000-0000-0000-000000000301',
  '61000000-0000-0000-0000-000000000201',
  '61000000-0000-0000-0000-000000000001',
  '61000000-0000-0000-0000-000000000501',
  1,true,0
);
update public.diagnostic_run_items set answered_at=now()
where id='61000000-0000-0000-0000-000000000301';
select set_config('request.jwt.claim.role','service_role',true);

select is(
  (public.submit_section_diagnostic_response(
    '61000000-0000-0000-0000-000000000001',
    '61000000-0000-0000-0000-000000000201',
    '61000000-0000-0000-0000-000000000301',
    '61000000-0000-0000-0000-000000000101',
    '61000000-0000-0000-0000-000000000501',
    null,null,true,0,'{}',null
  )->>'replayed')::boolean,
  true,
  'An exact retry replays the original response'
);
select throws_ok(
  $$select public.submit_section_diagnostic_response(
    '61000000-0000-0000-0000-000000000001',
    '61000000-0000-0000-0000-000000000201',
    '61000000-0000-0000-0000-000000000302',
    '61000000-0000-0000-0000-000000000102',
    '61000000-0000-0000-0000-000000000501',
    null,null,true,0,'{}',null
  )$$,
  'diagnostic_idempotency_key_reused',
  'A retry key cannot be reused for another issued occurrence'
);
select throws_ok(
  $$select public.submit_section_diagnostic_response(
    '61000000-0000-0000-0000-000000000001',
    '61000000-0000-0000-0000-000000000202',
    '61000000-0000-0000-0000-000000000303',
    '61000000-0000-0000-0000-000000000102',
    '61000000-0000-0000-0000-000000000501',
    null,null,true,0,'{}',null
  )$$,
  'diagnostic_idempotency_key_reused',
  'A retry key cannot be reused across runs'
);
select throws_ok(
  $$select public.submit_section_diagnostic_response(
    '61000000-0000-0000-0000-000000000001',
    '61000000-0000-0000-0000-000000000201',
    '61000000-0000-0000-0000-000000000301',
    '61000000-0000-0000-0000-000000000102',
    '61000000-0000-0000-0000-000000000501',
    null,null,true,0,'{}',null
  )$$,
  'diagnostic_assignment_mismatch',
  'A replay must name the item frozen in the issued occurrence'
);
select * from finish();
rollback;
