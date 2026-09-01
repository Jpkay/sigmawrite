-- Reviewer continuity: editable submitted work, attributable revision events,
-- and warm in-app acknowledgements after each completed review.

begin;

alter table public.review_notifications
  drop constraint review_notifications_notification_type_check,
  add constraint review_notifications_notification_type_check
    check(notification_type in('assignments_created','assignments_incomplete','review_complete','high_disagreement','review_thanks'));

create or replace function public.notify_reviewer_thanks()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.status is distinct from 'submitted' and new.status='submitted' then
    insert into public.review_notifications(recipient_profile_id,notification_type,title,body,review_version_id)
    values(
      new.reviewer_profile_id,
      'review_thanks',
      'Merci pour votre revue',
      'Votre regard aide Plume à protéger la qualité du français appris par les enfants. Chaque avis compte réellement.',
      case when tg_table_name='review_assignments' then new.review_version_id else null end
    );
  end if;
  return new;
end
$$;

drop trigger if exists review_assignment_thanks on public.review_assignments;
create trigger review_assignment_thanks
after update of status on public.review_assignments
for each row execute function public.notify_reviewer_thanks();

drop trigger if exists competency_review_assignment_thanks on public.competency_item_review_assignments;
create trigger competency_review_assignment_thanks
after update of status on public.competency_item_review_assignments
for each row execute function public.notify_reviewer_thanks();

create or replace function public.revise_content_review(
  p_assignment_id uuid,
  p_scores jsonb,
  p_decision text,
  p_general_comment text,
  p_issue_tags text[],
  p_question_reviews jsonb
) returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_profile uuid:=public.current_profile_id();
  v_assignment public.review_assignments;
  v_review_id uuid;
begin
  if not public.is_active_content_reviewer(v_profile) then raise exception 'reviewer_access_denied'; end if;
  select assignment.* into v_assignment
  from public.review_assignments assignment
  join public.content_review_versions version on version.id=assignment.review_version_id
  where assignment.id=p_assignment_id
    and assignment.reviewer_profile_id=v_profile
    and assignment.status='submitted'
    and version.final_resolution_id is null
    and version.workflow_status in('in_review','review_complete')
  for update of assignment;
  if not found then raise exception 'submitted_review_cannot_be_revised'; end if;

  update public.review_assignments set status='draft',submitted_at=null,updated_at=now() where id=p_assignment_id;
  update public.passage_reviews set status='draft',submitted_at=null,updated_at=now() where assignment_id=p_assignment_id;

  v_review_id:=public.save_content_review(
    p_assignment_id,p_scores,p_decision,p_general_comment,p_issue_tags,p_question_reviews,true
  );

  insert into public.audit_logs(actor_profile_id,action,target_type,target_id,metadata)
  values(v_profile,'review.revised','review_assignment',p_assignment_id,jsonb_build_object('reviewId',v_review_id));
  return v_review_id;
end
$$;

revoke all on function public.revise_content_review(uuid,jsonb,text,text,text[],jsonb) from public,anon;
grant execute on function public.revise_content_review(uuid,jsonb,text,text,text[],jsonb) to authenticated;

create or replace function public.revise_competency_item_review(
  p_item_id uuid,
  p_decision text,
  p_prompt_fr text,
  p_correct_answer text,
  p_note text default null
) returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_reviewer uuid:=public.current_profile_id();
  v_assignment public.competency_item_review_assignments;
  v_updated uuid;
begin
  if not public.is_active_content_reviewer(v_reviewer) then raise exception 'reviewer_access_denied'; end if;
  if p_decision not in('human_approved','rejected') then raise exception 'invalid_review_decision'; end if;
  if char_length(btrim(coalesce(p_prompt_fr,'')))<5 then raise exception 'invalid_review_prompt'; end if;
  if char_length(coalesce(p_correct_answer,''))>1000 or char_length(coalesce(p_note,''))>1000 then raise exception 'review_text_too_long'; end if;

  select * into v_assignment
  from public.competency_item_review_assignments
  where item_id=p_item_id and reviewer_profile_id=v_reviewer and status='submitted'
  for update;
  if not found then raise exception 'submitted_item_review_not_found'; end if;

  update public.competency_items
  set review_status=p_decision,
      reviewer_profile_id=v_reviewer,
      review_note=nullif(btrim(coalesce(p_note,'')),''),
      reviewed_at=now(),
      updated_at=now(),
      generation_type=case when p_decision='human_approved' then 'ai_human_reviewed' else 'ai' end,
      prompt_fr=btrim(p_prompt_fr),
      correct_answer=nullif(btrim(coalesce(p_correct_answer,'')),'')
  where id=p_item_id
    and prompt_version='diagnostic-bank-v2'
    and reviewer_profile_id=v_reviewer
    and review_status in('human_approved','rejected')
  returning id into v_updated;
  if v_updated is null then raise exception 'item_review_cannot_be_revised'; end if;

  update public.competency_item_review_assignments
  set decision=p_decision,submitted_at=now(),updated_at=now()
  where id=v_assignment.id;

  insert into public.audit_logs(actor_profile_id,action,target_type,target_id,metadata)
  values(v_reviewer,'competency_item.revised','competency_item',p_item_id,
    jsonb_build_object('assignmentId',v_assignment.id,'decision',p_decision)
      || case when nullif(btrim(coalesce(p_note,'')),'') is null then '{}'::jsonb else jsonb_build_object('note',btrim(p_note)) end);
  return v_updated;
end
$$;

revoke all on function public.revise_competency_item_review(uuid,text,text,text,text) from public,anon;
grant execute on function public.revise_competency_item_review(uuid,text,text,text,text) to authenticated;

comment on function public.revise_content_review(uuid,jsonb,text,text,text[],jsonb) is
  'Lets the accountable reviewer correct a submitted passage review until editorial resolution.';
comment on function public.revise_competency_item_review(uuid,text,text,text,text) is
  'Lets the accountable reviewer correct their submitted diagnostic item review.';

insert into public.review_notifications(recipient_profile_id,notification_type,title,body)
select reviewer_profile_id,'review_thanks','Merci pour vos premières revues',
  'Votre regard aide Plume à protéger la qualité du français appris par les enfants. Merci de poursuivre cette mission avec nous.'
from (
  select reviewer_profile_id from public.review_assignments where status='submitted'
  union
  select reviewer_profile_id from public.competency_item_review_assignments where status='submitted'
) reviewers
where not exists(
  select 1 from public.review_notifications notification
  where notification.recipient_profile_id=reviewers.reviewer_profile_id
    and notification.notification_type='review_thanks'
);

commit;
