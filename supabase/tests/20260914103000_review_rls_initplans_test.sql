begin;
set local role postgres;
set local search_path=public,extensions;
create extension if not exists pgtap with schema extensions;
grant usage on schema extensions to anon, authenticated;
grant execute on all functions in schema extensions to anon, authenticated;
select plan(17);

select is(
  (select count(*) from pg_policies
   where schemaname='public'
     and policyname=any(array[
       'competency_items_staff_write','competency_item_choices_staff_write',
       'diagnostic_bank_staff_write','diagnostic_bank_membership_staff_write',
       'taxonomy_releases_staff_write','taxonomy_release_memberships_staff_write'
     ])
     and cmd='ALL' and roles='{public}'
     and qual='( SELECT is_staff() AS is_staff)'
     and with_check='( SELECT is_staff() AS is_staff)'),
  6::bigint,
  'Review staff policies retain ALL/public semantics and cache USING and WITH CHECK'
);
select is(
  (select count(*) from pg_policies
   where schemaname='public'
     and policyname=any(array['competency_items_read','competency_nodes_read'])
     and cmd='SELECT' and roles='{public}'
     and qual like '%auto_approved%human_approved%SELECT is_staff()%'),
  2::bigint,
  'Item and node reads retain approved-content access and cache the staff check'
);

insert into auth.users(id,email)
values
 ('14103000-0000-4000-8000-000000000001','review-rls-admin@test.local'),
 ('14103000-0000-4000-8000-000000000002','review-rls-student@test.local'),
 ('14103000-0000-4000-8000-000000000003','review-rls-reviewer@test.local');
update public.profiles set role=case auth_user_id
 when '14103000-0000-4000-8000-000000000001' then 'platform_admin'
 when '14103000-0000-4000-8000-000000000003' then 'content_reviewer'
 else 'student' end
where auth_user_id::text like '14103000-0000-4000-8000-%';

insert into public.ontology_versions(id,version,document_path,status)
values('14103000-0000-4000-8000-000000000010','review-rls-test','test','active');
insert into public.taxonomy_releases(id,release_key,version,ontology_version_id,status)
values('14103000-0000-4000-8000-000000000011','review-rls-test','review-rls-test','14103000-0000-4000-8000-000000000010','draft');
insert into public.competency_nodes(id,key,strand,label_fr,review_status)
values('14103000-0000-4000-8000-000000000012','review-rls-node','grammaire_syntaxe','Nœud synthétique','human_approved');
insert into public.competency_mastery_evidence(id,node_id,evidence_key,observable_action_fr,modality,expectation,success_criteria,review_status)
values('14103000-0000-4000-8000-000000000013','14103000-0000-4000-8000-000000000012','review-rls-evidence','Répondre.','reading','receptive','{"accuracy":1}','human_approved');
insert into public.taxonomy_release_memberships(release_id,record_type,record_id,stable_key,record_version,record_snapshot,record_checksum)
values
 ('14103000-0000-4000-8000-000000000011','competency_node','14103000-0000-4000-8000-000000000012','review-rls-node',1,'{"key":"review-rls-node"}','test-node'),
 ('14103000-0000-4000-8000-000000000011','mastery_evidence','14103000-0000-4000-8000-000000000013','review-rls-node:review-rls-evidence',1,'{"key":"review-rls-evidence"}','test-evidence');
insert into public.diagnostic_item_bank_releases(id,bank_key,version,taxonomy_release_id,status)
values('14103000-0000-4000-8000-000000000014','review-rls-bank','review-rls-bank','14103000-0000-4000-8000-000000000011','draft');

insert into public.competency_items(id,primary_node_id,strand,modality,response_type,prompt_fr,correct_answer,validator_type,difficulty,prompt_version,review_status)
select md5('review-rls-item-'||g)::uuid,'14103000-0000-4000-8000-000000000012','grammaire_syntaxe','reading','short_answer',
       'Question synthétique '||g||' ?','Réponse','exact',50,'review-rls-perf','needs_human_review'
from generate_series(1,2000) g;
insert into public.competency_items(id,primary_node_id,strand,modality,response_type,prompt_fr,correct_answer,validator_type,difficulty,prompt_version,review_status)
values(md5('review-rls-approved-item')::uuid,'14103000-0000-4000-8000-000000000012','grammaire_syntaxe','reading','short_answer',
       'Question publique ?','Réponse','exact',50,'review-rls-approved','human_approved');
insert into public.diagnostic_item_bank_memberships(bank_release_id,item_id,node_id,mastery_evidence_id,section_key,evidence_expectation,modality,prompt_family,difficulty_tier,difficulty)
select '14103000-0000-4000-8000-000000000014',md5('review-rls-item-'||g)::uuid,
       '14103000-0000-4000-8000-000000000012','14103000-0000-4000-8000-000000000013',
       'grammar','receptive','reading','short-answer','core',50
from generate_series(1,2000) g;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"14103000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local statement_timeout='2s';
select is((select count(*) from public.competency_items item
 where item.prompt_version='review-rls-perf' and item.review_status='needs_human_review'
   and exists(select 1 from public.diagnostic_item_bank_memberships membership where membership.item_id=item.id)),
 2000::bigint,'Authenticated admin pending-membership count stays bounded');
select is((select count(*) from public.diagnostic_item_bank_memberships where bank_release_id='14103000-0000-4000-8000-000000000014'),2000::bigint,'Platform admins read draft bank memberships');
select is((select count(*) from public.taxonomy_release_memberships where release_id='14103000-0000-4000-8000-000000000011'),2::bigint,'Platform admins read draft taxonomy memberships');
with changed as (
  update public.competency_items set review_note='admin-check'
  where id=md5('review-rls-item-1')::uuid returning 1
)
select is((select count(*) from changed),1::bigint,'Platform admins retain item write access');

set local role postgres;
update public.profiles set deactivated_at=now()
where auth_user_id='14103000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"14103000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select is((select count(*) from public.competency_items where prompt_version='review-rls-perf'),0::bigint,'Deactivated platform admins cannot read pending items');

select set_config('request.jwt.claims','{"sub":"14103000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select is((select count(*) from public.competency_items where prompt_version='review-rls-perf'),0::bigint,'Students cannot read pending items');
select is((select count(*) from public.competency_items where prompt_version='review-rls-approved'),1::bigint,'Authenticated students retain approved-content read access');
select is((select count(*) from public.diagnostic_item_bank_memberships where bank_release_id='14103000-0000-4000-8000-000000000014'),0::bigint,'Students cannot read draft bank memberships');
select is((select count(*) from public.taxonomy_release_memberships where release_id='14103000-0000-4000-8000-000000000011'),0::bigint,'Students cannot read draft taxonomy memberships');
with changed as (
  update public.competency_items set review_note='student-check'
  where id=md5('review-rls-item-1')::uuid returning 1
)
select is((select count(*) from changed),0::bigint,'Students cannot update pending items');

select set_config('request.jwt.claims','{"sub":"14103000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select is((select count(*) from public.competency_items where prompt_version='review-rls-perf'),0::bigint,'Content reviewers do not regain direct pending-item access');
select is((select count(*) from public.diagnostic_item_bank_memberships where bank_release_id='14103000-0000-4000-8000-000000000014'),0::bigint,'Content reviewers do not regain direct draft-bank access');

set local role anon;
select set_config('request.jwt.claims','{}',true);
select is((select count(*) from public.competency_items where prompt_version='review-rls-perf'),0::bigint,'Anonymous users cannot read pending items');
select is((select count(*) from public.diagnostic_item_bank_memberships where bank_release_id='14103000-0000-4000-8000-000000000014'),0::bigint,'Anonymous users cannot read draft bank memberships');
select is((select count(*) from public.competency_items where prompt_version='review-rls-approved'),0::bigint,'Anonymous users do not gain approved-content read access');

select * from finish();
rollback;
