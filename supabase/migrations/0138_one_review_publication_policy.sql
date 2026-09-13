-- One favorable human review is sufficient for normal editorial approval and calibration.
-- Additional independent reviews remain available; no review or publication is fabricated.
alter table public.content_review_settings drop constraint content_review_settings_required_reviewers_check;
alter table public.content_review_settings add constraint content_review_settings_required_reviewers_check check(required_reviewers between 1 and 5);
alter table public.content_review_settings alter column required_reviewers set default 1;
alter table public.content_review_versions drop constraint content_review_versions_required_reviewers_check;
alter table public.content_review_versions add constraint content_review_versions_required_reviewers_check check(required_reviewers between 1 and 5);
alter table public.content_review_versions alter column required_reviewers set default 1;
update public.content_review_settings set required_reviewers=1,updated_at=now() where id;
create or replace function public.refresh_content_review_status(p_review_version_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_required integer;
  v_previous_status text;
  v_submitted integer;
  v_min integer;
  v_max integer;
  v_distinct_decisions integer;
  v_has_approve boolean;
  v_has_reject boolean;
  v_only_approval boolean;
  v_classification text;
begin
  select required_reviewers, workflow_status into v_required, v_previous_status from public.content_review_versions where id = p_review_version_id for update;
  select count(*), min(least(naturalness_score,pedagogical_quality_score,engagement_score,difficulty_match_score,vocabulary_score,grammar_score,question_quality_score,cultural_age_score)),
    max(greatest(naturalness_score,pedagogical_quality_score,engagement_score,difficulty_match_score,vocabulary_score,grammar_score,question_quality_score,cultural_age_score)),
    count(distinct overall_decision), bool_or(overall_decision in ('approve','approve_minor')), bool_or(overall_decision = 'reject'), bool_and(overall_decision in ('approve','approve_minor'))
  into v_submitted, v_min, v_max, v_distinct_decisions, v_has_approve, v_has_reject, v_only_approval
  from public.passage_reviews pr
  join public.review_assignments ra on ra.id = pr.assignment_id
  where ra.review_version_id = p_review_version_id and pr.status = 'submitted';

  if v_previous_status in ('retired','rejected','needs_revision') then return; end if;

  if v_submitted < v_required then
    update public.content_review_versions set workflow_status = case when v_previous_status in ('approved','published') then v_previous_status else 'in_review' end, updated_at = now() where id = p_review_version_id;
    return;
  end if;

  if v_submitted = 1 then v_classification := null;
  elsif v_distinct_decisions = 1 then v_classification := 'unanimous';
  elsif v_has_approve and v_has_reject or (v_max - v_min) >= 3 then v_classification := 'high_disagreement';
  elsif v_only_approval then v_classification := 'strong_agreement';
  else v_classification := 'mixed';
  end if;

  update public.content_review_versions rv set
    workflow_status = case when v_previous_status in ('approved','published') then v_previous_status else 'review_complete' end,
    agreement_classification = v_classification,
    average_score = (select round(avg(public.review_score_average(pr)),2) from public.passage_reviews pr join public.review_assignments ra on ra.id=pr.assignment_id where ra.review_version_id=p_review_version_id and pr.status='submitted'),
    rating_spread = v_max - v_min,
    updated_at = now()
  where rv.id = p_review_version_id;

  insert into public.review_notifications (recipient_profile_id,notification_type,title,body,review_version_id)
  select p.id, 'review_complete',
    case when v_previous_status in ('approved','published') then 'Avis complémentaire reçu' else 'Évaluation terminée' end,
    case when v_previous_status in ('approved','published') then 'Un avis indépendant supplémentaire est disponible. Examinez ses remarques et les éventuels défauts signalés.' else 'Le nombre d’avis requis pour la décision éditoriale est atteint.' end, p_review_version_id
  from public.profiles p where p.role='platform_admin';
  if v_classification = 'high_disagreement' or (v_previous_status in ('approved','published') and not v_only_approval) then
    insert into public.review_notifications (recipient_profile_id,notification_type,title,body,review_version_id)
    select p.id, 'high_disagreement', 'Désaccord important', 'Une décision éditoriale est requise.', p_review_version_id
    from public.profiles p where p.role='platform_admin';
  end if;
end;
$$;

create or replace function public.assign_content_reviews(p_review_version_ids uuid[], p_reviewer_ids uuid[])
returns integer language plpgsql security definer set search_path = public as $$
declare v_admin uuid := public.current_profile_id(); v_version uuid; v_reviewer uuid; v_count integer:=0;
begin
  if not public.is_platform_admin() then raise exception 'admin_required'; end if;
  if (select count(distinct id) from unnest(p_reviewer_ids) id) is distinct from coalesce(array_length(p_reviewer_ids,1),0) then raise exception 'distinct_reviewers_required'; end if;
  if coalesce(array_length(p_reviewer_ids,1),0) < 1 or array_length(p_reviewer_ids,1) > 3 then raise exception 'select_one_to_three_reviewers'; end if;
  foreach v_reviewer in array p_reviewer_ids loop
    if not exists(select 1 from public.content_reviewer_profiles where profile_id=v_reviewer and active) then raise exception 'inactive_reviewer'; end if;
  end loop;
  foreach v_version in array p_review_version_ids loop
    if not exists(select 1 from public.content_review_versions where id=v_version and workflow_status in ('ready_for_review','in_review','review_complete','approved','published')) then raise exception 'review_version_not_assignable'; end if;
    foreach v_reviewer in array p_reviewer_ids loop
      insert into public.review_assignments(review_version_id,reviewer_profile_id,assigned_by) values(v_version,v_reviewer,v_admin) on conflict do nothing;
      if found then v_count:=v_count+1; end if;
    end loop;
    -- Assignment count never raises the release threshold. Explicit editorial
    -- requests for more reviews retain their per-version requirement.
    perform public.refresh_content_review_status(v_version);
  end loop;
  insert into public.review_notifications(recipient_profile_id,notification_type,title,body)
  select reviewer,'assignments_created','Nouveaux textes à évaluer',format('%s nouvelle(s) évaluation(s) vous ont été attribuée(s).',cardinality(p_review_version_ids)) from unnest(p_reviewer_ids) reviewer;
  insert into public.review_notifications(recipient_profile_id,notification_type,title,body)
  select reviewer,'assignments_incomplete','Évaluations en attente','Votre file contient des passages qui ne sont pas encore validés.' from unnest(p_reviewer_ids) reviewer;
  insert into public.audit_logs(actor_profile_id,action,target_type,metadata) values(v_admin,'review.assignments_created','content_review_version',jsonb_build_object('versions',p_review_version_ids,'reviewers',p_reviewer_ids,'created',v_count));
  return v_count;
end;
$$;

create or replace function public.guard_passage_automation_policy() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.enabled then
  if (select count(distinct profile_id) from content_reviewer_profiles where profile_id=any(new.reviewer_ids) and active)<1 or not exists(
   select 1 from passage_automation_calibrations c where c.id=new.calibration_id and c.passed
    and c.pipeline_version=new.pipeline_version and c.evaluator_model=new.evaluator_model
    and (c.report->>'reviewedCases')::int>=6 and (c.report->>'negativeCases')::int>=2
    and (c.report->>'falseAccepts')::int=0 and (c.report->>'acceptedCases')::int>=1
  ) then raise exception 'automation_calibration_required'; end if;
 end if;
 return new;
end $$;

-- Keep explicit editorial escalations and historical approvals intact.
update public.content_review_versions v set required_reviewers=1,updated_at=now()
where workflow_status in ('ready_for_review','in_review','review_complete')
and not exists(select 1 from public.editorial_resolutions r where r.review_version_id=v.id and r.action='request_another_review');
-- Recompute existing queues without emitting a notification for every migrated passage.
update public.content_review_versions v set workflow_status='review_complete',updated_at=now(),
 average_score=(select round(avg(public.review_score_average(pr)),2) from public.passage_reviews pr join public.review_assignments a on a.id=pr.assignment_id where a.review_version_id=v.id and pr.status='submitted'),
 agreement_classification=case when (select count(*) from public.passage_reviews pr join public.review_assignments a on a.id=pr.assignment_id where a.review_version_id=v.id and pr.status='submitted')=1 then null else v.agreement_classification end
where required_reviewers=1 and workflow_status in ('ready_for_review','in_review','review_complete')
and exists(select 1 from public.passage_reviews pr join public.review_assignments a on a.id=pr.assignment_id where a.review_version_id=v.id and pr.status='submitted');
insert into public.audit_logs(action,target_type,metadata) values
('review.publication_policy_changed','content_review_settings','{"requiredHumanApprovals":1,"additionalReviewsContinue":true,"decisionDate":"2026-09-10"}'::jsonb);
