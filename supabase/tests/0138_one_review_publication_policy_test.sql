begin;
set local search_path=public,extensions;
create extension if not exists pgtap with schema extensions;
select plan(17);

insert into auth.users(id,email) values
('b3400000-0000-4000-8000-000000000001','policy-admin@test.invalid'),
('b3400000-0000-4000-8000-000000000002','policy-a@test.invalid'),
('b3400000-0000-4000-8000-000000000003','policy-b@test.invalid'),
('b3400000-0000-4000-8000-000000000004','policy-c@test.invalid');
update profiles set role=case when auth_user_id='b3400000-0000-4000-8000-000000000001' then 'platform_admin' else 'content_reviewer' end
where auth_user_id::text like 'b3400000-%';
insert into content_reviewer_profiles(profile_id,active,invite_status)
select id,true,'active' from profiles where auth_user_id::text like 'b3400000-%';
insert into ai_generated_candidates(id,candidate_type,payload,review_status)
values('b3410000-0000-4000-8000-000000000001','reading_text','{"generated":{"title":"Policy test","body":"Les élèves lisent un court passage puis répondent à une question. Les adultes vérifient séparément le texte, les réponses attendues et les explications avant la publication.","questions":[{"questionText":"Que font les élèves ?"}]}}','needs_human_review');
insert into content_review_versions(id,candidate_id,version_number,payload)
select 'b3420000-0000-4000-8000-000000000001',id,1,payload from ai_generated_candidates where id='b3410000-0000-4000-8000-000000000001';
select is((select required_reviewers::int from content_review_settings where id),1,'New policy defaults to one reviewer');
select is((select required_reviewers::int from content_review_versions where id='b3420000-0000-4000-8000-000000000001'),1,'New versions require one review');
select set_config('request.jwt.claim.sub','b3400000-0000-4000-8000-000000000001',true);
select lives_ok($q$select assign_content_reviews(array['b3420000-0000-4000-8000-000000000001'::uuid],(select array_agg(id) from profiles where auth_user_id in ('b3400000-0000-4000-8000-000000000002','b3400000-0000-4000-8000-000000000003','b3400000-0000-4000-8000-000000000004')))$q$,'Three reviewers may work independently');
select is((select required_reviewers::int from content_review_versions where id='b3420000-0000-4000-8000-000000000001'),1,'Third assignment does not raise publication threshold');

create function pg_temp.submit_policy_review(p_user uuid,p_decision text) returns uuid language plpgsql as $$
declare result uuid;
begin
  perform set_config('request.jwt.claim.sub',p_user::text,true);
  select save_content_review(a.id,'{"naturalness":3,"pedagogical_quality":3,"engagement":3,"difficulty_match":3,"vocabulary":3,"grammar":3,"question_quality":3,"cultural_age":3}'::jsonb,
    p_decision,'Policy test feedback','{}'::text[],'[{"questionIndex":0,"outcome":"correct_clear"}]'::jsonb,true) into result
  from review_assignments a join profiles p on p.id=a.reviewer_profile_id
  where a.review_version_id='b3420000-0000-4000-8000-000000000001' and p.auth_user_id=p_user;
  return result;
end;
$$;
select throws_ok($q$select resolve_content_review('b3420000-0000-4000-8000-000000000001','approve','Too early')$q$,null,'independent_approvals_required','Zero reviews cannot approve');
select pg_temp.submit_policy_review('b3400000-0000-4000-8000-000000000002','approve');
select is((select workflow_status from content_review_versions where id='b3420000-0000-4000-8000-000000000001'),'review_complete','One review completes the gate');
select is((select count(*)::int from review_assignments where review_version_id='b3420000-0000-4000-8000-000000000001' and status='assigned'),2,'Both optional reviews remain assigned');
select set_config('request.jwt.claim.sub','b3400000-0000-4000-8000-000000000001',true);
select lives_ok($q$select assign_content_reviews(array['b3420000-0000-4000-8000-000000000001'::uuid],(select array[id] from profiles where auth_user_id='b3400000-0000-4000-8000-000000000002'))$q$,'Single reviewer assignment is allowed');
select throws_ok($q$select assign_content_reviews(array['b3420000-0000-4000-8000-000000000001'::uuid],array[]::uuid[])$q$,null,'select_one_to_three_reviewers','Zero reviewer assignment is rejected');
select lives_ok($q$select resolve_content_review('b3420000-0000-4000-8000-000000000001','approve','One favorable review')$q$,'Editor can approve with one favorable review');
-- Simulate the final publication state, without creating learner content.
update content_review_versions set workflow_status='published' where id='b3420000-0000-4000-8000-000000000001';
select lives_ok($q$select pg_temp.submit_policy_review('b3400000-0000-4000-8000-000000000004','reject')$q$,'Outstanding reviewer can submit after publication');
select is((select workflow_status from content_review_versions where id='b3420000-0000-4000-8000-000000000001'),'published','Later review does not reset publication');
select ok(exists(select 1 from review_notifications where review_version_id='b3420000-0000-4000-8000-000000000001' and notification_type='high_disagreement'),'Adverse follow-up alerts the editor');
select is((select jsonb_array_length(reviewer_results_snapshot) from editorial_resolutions where review_version_id='b3420000-0000-4000-8000-000000000001' and action='approve'),1,'Original editorial approval snapshot remains intact');
select set_config('request.jwt.claim.sub','b3400000-0000-4000-8000-000000000001',true);
select throws_ok($q$select assign_content_reviews(array['b3420000-0000-4000-8000-000000000001'::uuid],(select array[id,id] from profiles where auth_user_id='b3400000-0000-4000-8000-000000000002'))$q$,null,'distinct_reviewers_required','Duplicate identities cannot satisfy independent review');
-- An explicit escalation must still require more positive evidence.
update content_review_versions set workflow_status='review_complete',required_reviewers=3 where id='b3420000-0000-4000-8000-000000000001';
select throws_ok($q$select resolve_content_review('b3420000-0000-4000-8000-000000000001','approve','Not enough positive evidence')$q$,null,'independent_approvals_required','Negative review does not count as a favorable review');
select set_config('request.jwt.claim.sub','b3400000-0000-4000-8000-000000000002',true);
select throws_ok($q$select resolve_content_review('b3420000-0000-4000-8000-000000000001','approve','Not an editor')$q$,null,'admin_required','Reviewer cannot perform editorial approval');
select * from finish();
rollback;
