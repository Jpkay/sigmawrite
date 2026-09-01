begin;
set local role postgres;
set local search_path=public,extensions;
create extension if not exists pgtap with schema extensions;
select plan(11);

select has_function('public','assign_diagnostic_item_reviews',array['uuid[]'],'Diagnostic review workloads have a guarded allocator');
select function_returns('public','assign_diagnostic_item_reviews',array['uuid[]'],'integer','Allocator reports the number of new assignments');
select is_definer('public','assign_diagnostic_item_reviews',array['uuid[]'],'Allocator crosses RLS only through a guarded function');
select function_privs_are('public','assign_diagnostic_item_reviews',array['uuid[]'],'authenticated',array['EXECUTE'],'Authenticated admins may call the guarded allocator');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('a4000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','item-admin@test.local','',now(),'{}','{}',now(),now()),
('a4000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','item-reviewer-a@test.local','',now(),'{}','{}',now(),now()),
('a4000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','item-reviewer-b@test.local','',now(),'{}','{}',now(),now());

update public.profiles
set role=case auth_user_id
  when 'a4000000-0000-4000-8000-000000000001' then 'platform_admin'
  else 'content_reviewer'
end
where auth_user_id::text like 'a4000000-0000-4000-8000-%';

insert into public.content_reviewer_profiles(profile_id,active,invite_status,activated_at)
select id,true,'active',now()
from public.profiles
where auth_user_id in(
  'a4000000-0000-4000-8000-000000000002',
  'a4000000-0000-4000-8000-000000000003'
);

insert into public.ontology_versions(id,version,document_path,status)
values('a4100000-0000-4000-8000-000000000001','item-assignment-test','test','active');
insert into public.taxonomy_releases(id,release_key,version,ontology_version_id,status)
values('a4200000-0000-4000-8000-000000000001','item-assignment-test','item-assignment-test','a4100000-0000-4000-8000-000000000001','draft');

insert into public.competency_nodes(id,key,strand,label_fr,review_status)
values
('a4300000-0000-4000-8000-000000000001','assignment-reading','comprehension_ecrite','Compréhension','human_approved'),
('a4300000-0000-4000-8000-000000000002','assignment-grammar','grammaire_syntaxe','Grammaire','human_approved'),
('a4300000-0000-4000-8000-000000000003','assignment-spelling','orthographe_lexicale','Orthographe','human_approved'),
('a4300000-0000-4000-8000-000000000004','assignment-conjugation','conjugaison','Conjugaison','human_approved');

insert into public.competency_mastery_evidence(id,node_id,evidence_key,observable_action_fr,modality,expectation,success_criteria,review_status)
select
  format('a4400000-0000-4000-8000-%s',lpad(g::text,12,'0'))::uuid,
  format('a4300000-0000-4000-8000-%s',lpad(g::text,12,'0'))::uuid,
  format('assignment-evidence-%s',g),
  'Choisir la réponse attendue.',
  'reading','receptive','{"accuracy":1}'::jsonb,'human_approved'
from generate_series(1,4) g;

insert into public.taxonomy_release_memberships(release_id,record_type,record_id,stable_key,record_version,record_snapshot,record_checksum)
select
  'a4200000-0000-4000-8000-000000000001','competency_node',id,key,1,
  jsonb_build_object('id',id,'key',key),'test'
from public.competency_nodes
where id::text like 'a4300000-0000-4000-8000-%';

insert into public.diagnostic_item_bank_releases(id,bank_key,version,taxonomy_release_id,status)
values('a4500000-0000-4000-8000-000000000001','item-assignment-test','item-assignment-bank-test','a4200000-0000-4000-8000-000000000001','draft');

insert into public.competency_items(id,primary_node_id,strand,modality,response_type,prompt_fr,correct_answer,validator_type,difficulty,prompt_version,review_status)
select
  format('a4600000-0000-4000-8000-%s',lpad(g::text,12,'0'))::uuid,
  format('a4300000-0000-4000-8000-%s',lpad(g::text,12,'0'))::uuid,
  case g when 1 then 'comprehension_ecrite' when 2 then 'grammaire_syntaxe' when 3 then 'orthographe_lexicale' else 'conjugaison' end,
  'reading','short_answer',format('Question de validation numéro %s ?',g),'Réponse','exact',g*10,'diagnostic-bank-v2','needs_human_review'
from generate_series(1,4) g;

insert into public.diagnostic_item_bank_memberships(bank_release_id,item_id,node_id,mastery_evidence_id,section_key,evidence_expectation,modality,prompt_family,difficulty_tier,difficulty)
select
  'a4500000-0000-4000-8000-000000000001',
  format('a4600000-0000-4000-8000-%s',lpad(g::text,12,'0'))::uuid,
  format('a4300000-0000-4000-8000-%s',lpad(g::text,12,'0'))::uuid,
  format('a4400000-0000-4000-8000-%s',lpad(g::text,12,'0'))::uuid,
  case g when 1 then 'reading_comprehension' when 2 then 'grammar' when 3 then 'spelling' else 'conjugation' end,
  'receptive','reading','short-answer','foundation',g*10
from generate_series(1,4) g;

set local role authenticated;
set local request.jwt.claims='{"sub":"a4000000-0000-4000-8000-000000000002","role":"authenticated"}';
select throws_ok(
  $$select public.assign_diagnostic_item_reviews(array[public.current_profile_id()])$$,
  null,'admin_required','Reviewers cannot allocate work'
);

set local request.jwt.claims='{"sub":"a4000000-0000-4000-8000-000000000001","role":"authenticated"}';
select is(
  public.assign_diagnostic_item_reviews(array[
    (select id from public.profiles where auth_user_id='a4000000-0000-4000-8000-000000000002'),
    (select id from public.profiles where auth_user_id='a4000000-0000-4000-8000-000000000003')
  ]),
  4,
  'Admin allocates every unowned pending diagnostic item'
);
select is(
  (select count(*) from public.competency_item_review_assignments where item_id::text like 'a4600000-0000-4000-8000-%'),
  4::bigint,
  'Every candidate has exactly one durable assignment'
);
select ok(
  (select max(total)-min(total)<=1 from (
    select reviewer_profile_id,count(*) total
    from public.competency_item_review_assignments
    where item_id::text like 'a4600000-0000-4000-8000-%'
    group by reviewer_profile_id
  ) workloads),
  'The allocator balances work across selected reviewers'
);
select is(
  public.assign_diagnostic_item_reviews(array[
    (select id from public.profiles where auth_user_id='a4000000-0000-4000-8000-000000000002'),
    (select id from public.profiles where auth_user_id='a4000000-0000-4000-8000-000000000003')
  ]),
  0,
  'Allocation is idempotent'
);
select is(
  (select count(*) from public.review_notifications where notification_type='assignments_created' and recipient_profile_id in(
    select id from public.profiles where auth_user_id in('a4000000-0000-4000-8000-000000000002','a4000000-0000-4000-8000-000000000003')
  )),
  2::bigint,
  'Each reviewer receives one aggregate assignment notification'
);
select is(
  (select count(*) from public.audit_logs where action='competency_item.assignments_created' and metadata->>'assignedCount'='4'),
  1::bigint,
  'Bulk allocation is attributable in the audit log'
);

select * from finish();
rollback;
