-- Revalidate bounded-pilot invariants at policy update and publication time.
-- This is forward-only because migrations 0134-0139 are already in the live ledger.
create or replace function public.passage_automation_policy_is_valid(p_policy public.passage_automation_policy)
returns boolean language sql stable security definer set search_path=public as $$
 select coalesce(
  p_policy.id
  and p_policy.enabled
  and p_policy.pipeline_version='selective-passage-3'
  and p_policy.evaluator_model is not null
  and p_policy.calibration_id is not null
  and p_policy.sample_percent between 5 and 100
  and p_policy.cohort_percent between 1 and 10
  and p_policy.exposure_cap between 1 and 100
  and cardinality(p_policy.reviewer_ids) between 1 and 3
  and (select count(distinct reviewer_id) from unnest(p_policy.reviewer_ids) reviewer_id)=cardinality(p_policy.reviewer_ids)
  and (select count(*) from public.content_reviewer_profiles reviewer
       where reviewer.profile_id=any(p_policy.reviewer_ids)
         and reviewer.active and reviewer.invite_status='active')>=1
  and exists(
   select 1 from public.passage_automation_calibrations calibration
   where calibration.id=p_policy.calibration_id and calibration.passed
     and calibration.pipeline_version=p_policy.pipeline_version
     and calibration.evaluator_model=p_policy.evaluator_model
     and (calibration.report->>'reviewedCases')::int>=6
     and (calibration.report->>'negativeCases')::int>=2
     and (calibration.report->>'falseAccepts')::int=0
     and (calibration.report->>'acceptedCases')::int>=1
  ),false)
$$;

create or replace function public.guard_passage_automation_policy()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.enabled and not public.passage_automation_policy_is_valid(new) then
  raise exception 'automation_calibration_required';
 end if;
 return new;
end
$$;

create or replace function public.authorize_automated_passage(p_run_id uuid,p_candidate_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare r public.passage_qa_runs; p public.passage_automation_policy; c public.ai_generated_candidates;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
 select * into p from public.passage_automation_policy where id for share;
 select * into r from public.passage_qa_runs where id=p_run_id;
 select * into c from public.ai_generated_candidates where id=p_candidate_id for update;
 if p.id is null or not public.passage_automation_policy_is_valid(p)
   or r.id is null or c.id is null or r.candidate_id<>c.id or r.decision<>'pass'
   or r.pipeline_version<>p.pipeline_version or r.evaluator_model is distinct from p.evaluator_model
   or r.payload_snapshot<>c.payload or r.created_at<now()-interval '24 hours'
   or c.review_status in ('rejected','retired') then raise exception 'automated_publication_not_authorized'; end if;
 if exists(select 1 from public.content_review_versions v join public.review_assignments a on a.review_version_id=v.id
    where v.candidate_id=c.id and a.status='submitted') then raise exception 'existing_human_review_requires_editor'; end if;
end
$$;

revoke all on function public.passage_automation_policy_is_valid(public.passage_automation_policy) from public,anon,authenticated;
revoke all on function public.authorize_automated_passage(uuid,uuid) from public,anon,authenticated;
grant execute on function public.authorize_automated_passage(uuid,uuid) to service_role;
