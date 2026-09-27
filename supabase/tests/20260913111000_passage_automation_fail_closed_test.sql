begin;
set local search_path=public,extensions;
select plan(9);

select is((select pipeline_version from passage_automation_policy where id),'selective-passage-3','V3 is the current QA policy');
select is((select enabled from passage_automation_policy where id),false,'V3 starts fail closed');

insert into auth.users(id,email) values
 ('b3900000-0000-4000-8000-000000000001','v3-reviewer-a@test.invalid'),
 ('b3900000-0000-4000-8000-000000000002','v3-reviewer-b@test.invalid'),
 ('b3900000-0000-4000-8000-000000000003','v3-reviewer-c@test.invalid');
update profiles set role='content_reviewer' where auth_user_id::text like 'b3900000-%';
insert into content_reviewer_profiles(profile_id,active,invite_status)
select id,auth_user_id<>'b3900000-0000-4000-8000-000000000003','active'
from profiles where auth_user_id::text like 'b3900000-%';
insert into passage_automation_calibrations(id,pipeline_version,evaluator_model,report,passed)
values('b3910000-0000-4000-8000-000000000001','selective-passage-3','test-independent','{"reviewedCases":6,"negativeCases":2,"falseAccepts":0,"acceptedCases":1}',true);
update passage_automation_policy set evaluator_model='test-independent',calibration_id='b3910000-0000-4000-8000-000000000001',
 reviewer_ids=(select array_agg(id order by auth_user_id) from profiles where auth_user_id::text like 'b3900000-%'),sample_percent=5,cohort_percent=10,exposure_cap=100 where id;

select lives_ok('update passage_automation_policy set enabled=true where id','A calibrated bounded V3 policy can enable with three configured reviewers and two eligible reviewers');
select throws_ok('update passage_automation_policy set sample_percent=4 where id',null,'automation_calibration_required','Sampling cannot be reduced below the pilot floor');
select throws_ok('update passage_automation_policy set cohort_percent=11 where id',null,'automation_calibration_required','The learner cohort cannot silently broaden');
select throws_ok('update passage_automation_policy set exposure_cap=101 where id',null,'automation_calibration_required','The per-text exposure cap cannot silently broaden');

insert into ai_generated_candidates(id,candidate_type,payload,review_status)
values('b3920000-0000-4000-8000-000000000001','reading_text','{"generated":{"title":"V3","body":"Passage V3","questions":[]}}','needs_human_review');
insert into passage_qa_runs(id,candidate_id,pipeline_version,payload_snapshot,evaluator_model,decision,report)
select 'b3930000-0000-4000-8000-000000000001',id,'selective-passage-3',payload,'test-independent','pass','{}'
from ai_generated_candidates where id='b3920000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='';
set local request.jwt.claims='{"role":"service_role"}';

update content_reviewer_profiles set active=false where profile_id in (select unnest(reviewer_ids) from passage_automation_policy where id);
select throws_ok($q$select authorize_automated_passage('b3930000-0000-4000-8000-000000000001','b3920000-0000-4000-8000-000000000001')$q$,null,'automated_publication_not_authorized','Reviewer deactivation blocks publication after policy activation');
update content_reviewer_profiles set active=true,invite_status='pending' where profile_id in (select unnest(reviewer_ids) from passage_automation_policy where id);
select throws_ok($q$select authorize_automated_passage('b3930000-0000-4000-8000-000000000001','b3920000-0000-4000-8000-000000000001')$q$,null,'automated_publication_not_authorized','A non-active invitation blocks publication');
update content_reviewer_profiles set invite_status='active' where profile_id in (select unnest(reviewer_ids) from passage_automation_policy where id);
select lives_ok($q$select authorize_automated_passage('b3930000-0000-4000-8000-000000000001','b3920000-0000-4000-8000-000000000001')$q$,'Publication authorization recovers only when every invariant is valid');

select * from finish();
rollback;
