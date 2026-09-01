-- Give real educators an accountable, durable diagnostic-item workload.
-- The review UI and submission RPC already existed, but there was no guarded
-- operation that populated the reviewer queues.

begin;

create or replace function public.assign_diagnostic_item_reviews(
  p_reviewer_ids uuid[]
) returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  v_admin uuid:=public.current_profile_id();
  v_reviewer_count integer;
  v_assigned integer:=0;
begin
  if not public.is_platform_admin() then
    raise exception 'admin_required';
  end if;

  select count(*) into v_reviewer_count
  from (
    select distinct reviewer_id
    from unnest(coalesce(p_reviewer_ids,'{}'::uuid[])) reviewer_id
  ) requested
  join public.profiles profile on profile.id=requested.reviewer_id
  join public.content_reviewer_profiles access on access.profile_id=profile.id
  where profile.role in('platform_admin','content_reviewer')
    and access.active;

  if v_reviewer_count<1
    or v_reviewer_count<>cardinality(array(select distinct unnest(coalesce(p_reviewer_ids,'{}'::uuid[]))))
  then
    raise exception 'active_reviewers_required';
  end if;

  -- Prevent two admins from allocating the same queue at the same time.
  perform pg_advisory_xact_lock(hashtext('assign_diagnostic_item_reviews'));

  with reviewer_pool as (
    select
      requested.reviewer_id,
      row_number() over(
        order by count(existing.id),requested.reviewer_id
      )::integer as reviewer_position,
      coalesce(max(existing.queue_position),0)::integer as last_queue_position
    from (
      select distinct unnest(p_reviewer_ids) as reviewer_id
    ) requested
    left join public.competency_item_review_assignments existing
      on existing.reviewer_profile_id=requested.reviewer_id
    group by requested.reviewer_id
  ),
  candidate_source as (
    select
      item.id as item_id,
      min(membership.section_key) as section_key,
      min(coalesce(item.difficulty,membership.difficulty,101)) as difficulty,
      min(case membership.section_key
        when 'reading_comprehension' then 1
        when 'grammar' then 2
        when 'spelling' then 3
        when 'conjugation' then 4
        else 5
      end) as section_position
    from public.competency_items item
    join public.diagnostic_item_bank_memberships membership
      on membership.item_id=item.id
    where item.prompt_version='diagnostic-bank-v2'
      and item.review_status='needs_human_review'
      and not exists(
        select 1
        from public.competency_item_review_assignments existing
        where existing.item_id=item.id
      )
    group by item.id
  ),
  candidates as (
    select
      candidate_source.*,
      row_number() over(
        partition by section_key
        order by difficulty,item_id
      )::integer as section_item_position
    from candidate_source
  ),
  allocated as (
    select
      candidate.*,
      reviewer.reviewer_id,
      reviewer.last_queue_position
    from candidates candidate
    join reviewer_pool reviewer
      on reviewer.reviewer_position=(
        (candidate.section_item_position+candidate.section_position-2)%v_reviewer_count
      )+1
  ),
  reviewer_section_ranked as (
    select
      allocated.*,
      row_number() over(
        partition by allocated.reviewer_id,allocated.section_key
        order by allocated.difficulty,allocated.item_id
      )::integer as reviewer_section_position
    from allocated
  ),
  queued as (
    select
      reviewer_section_ranked.*,
      reviewer_section_ranked.last_queue_position+row_number() over(
        partition by reviewer_section_ranked.reviewer_id
        order by
          reviewer_section_ranked.reviewer_section_position,
          reviewer_section_ranked.section_position,
          reviewer_section_ranked.item_id
      )::integer as queue_position
    from reviewer_section_ranked
  ),
  inserted as (
    insert into public.competency_item_review_assignments(
      item_id,reviewer_profile_id,assigned_by,queue_position
    )
    select item_id,reviewer_id,v_admin,queue_position
    from queued
    order by reviewer_id,queue_position
    on conflict(item_id) do nothing
    returning reviewer_profile_id
  ),
  notified as (
    insert into public.review_notifications(
      recipient_profile_id,notification_type,title,body
    )
    select
      reviewer_profile_id,
      'assignments_created',
      'Nouveaux exercices à évaluer',
      format('%s exercices de français ont été ajoutés à votre file.',count(*))
    from inserted
    group by reviewer_profile_id
    returning id
  )
  select count(*) into v_assigned from inserted;

  if v_assigned>0 then
    insert into public.audit_logs(
      actor_profile_id,action,target_type,target_id,metadata
    ) values(
      v_admin,
      'competency_item.assignments_created',
      'diagnostic_item_bank',
      null,
      jsonb_build_object(
        'assignedCount',v_assigned,
        'reviewerIds',to_jsonb(array(select distinct unnest(p_reviewer_ids) order by 1))
      )
    );
  end if;

  return v_assigned;
end
$$;

revoke all on function public.assign_diagnostic_item_reviews(uuid[]) from public,anon;
grant execute on function public.assign_diagnostic_item_reviews(uuid[]) to authenticated;

comment on function public.assign_diagnostic_item_reviews(uuid[]) is
  'Assigns every unowned pending diagnostic-v2 item across selected active reviewers with durable, section-interleaved queues.';

commit;
