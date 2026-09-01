-- Durable, reviewer-scoped workloads for diagnostic and practice-item review.
-- Each item has one accountable human reviewer; completion updates both the
-- assignment and the canonical item in one transaction.

begin;

create table public.competency_item_review_assignments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null unique references public.competency_items(id) on delete restrict,
  reviewer_profile_id uuid not null references public.profiles(id) on delete restrict,
  assigned_by uuid references public.profiles(id) on delete set null,
  status text not null default 'assigned' check (status in ('assigned','submitted')),
  decision text check (decision is null or decision in ('human_approved','rejected')),
  assigned_at timestamptz not null default now(),
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  check (
    (status='assigned' and decision is null and submitted_at is null)
    or (status='submitted' and decision is not null and submitted_at is not null)
  )
);

create index competency_item_review_assignments_queue_idx
  on public.competency_item_review_assignments(reviewer_profile_id,status,assigned_at,item_id);

alter table public.competency_item_review_assignments enable row level security;

create policy competency_item_review_assignments_read
  on public.competency_item_review_assignments for select
  using (
    public.is_platform_admin()
    or (
      public.is_active_content_reviewer()
      and reviewer_profile_id=public.current_profile_id()
    )
  );

create policy competency_item_review_assignments_admin
  on public.competency_item_review_assignments for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

grant select on public.competency_item_review_assignments to authenticated;
revoke insert,update,delete on public.competency_item_review_assignments from anon,authenticated;

create or replace function public.submit_competency_item_review(
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
  if not public.is_active_content_reviewer(v_reviewer) then
    raise exception 'reviewer_access_denied';
  end if;
  if p_decision not in ('human_approved','rejected') then
    raise exception 'invalid_review_decision';
  end if;
  if char_length(btrim(coalesce(p_prompt_fr,'')))<5 then
    raise exception 'invalid_review_prompt';
  end if;
  if char_length(coalesce(p_correct_answer,''))>1000
    or char_length(coalesce(p_note,''))>1000 then
    raise exception 'review_text_too_long';
  end if;

  select * into v_assignment
  from public.competency_item_review_assignments
  where item_id=p_item_id
    and reviewer_profile_id=v_reviewer
    and status='assigned'
  for update;
  if not found then raise exception 'item_assignment_not_found'; end if;

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
    and prompt_version in ('diagnostic-bank-v2','taxonomy-v3-practice-v1')
    and review_status='needs_human_review'
  returning id into v_updated;
  if v_updated is null then raise exception 'item_not_reviewable'; end if;

  update public.competency_item_review_assignments
  set status='submitted',decision=p_decision,submitted_at=now(),updated_at=now()
  where id=v_assignment.id;

  insert into public.audit_logs(actor_profile_id,action,target_type,target_id,metadata)
  values(
    v_reviewer,
    case when p_decision='human_approved' then 'competency_item.approved' else 'competency_item.rejected' end,
    'competency_item',
    p_item_id,
    jsonb_build_object('assignmentId',v_assignment.id,'assignedReview',true)
      || case when nullif(btrim(coalesce(p_note,'')),'') is null then '{}'::jsonb else jsonb_build_object('note',btrim(p_note)) end
  );

  return v_updated;
end
$$;

revoke all on function public.submit_competency_item_review(uuid,text,text,text,text) from public,anon;
grant execute on function public.submit_competency_item_review(uuid,text,text,text,text) to authenticated;

comment on table public.competency_item_review_assignments is
  'One accountable real-reviewer workload row per reviewable competency item.';
comment on function public.submit_competency_item_review(uuid,text,text,text,text) is
  'Atomically submits only the current active reviewer''s assigned item and records attributable review evidence.';

commit;
