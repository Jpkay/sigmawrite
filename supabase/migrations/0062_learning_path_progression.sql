-- Keep the graph-derived path live: mastering a step completes it and unlocks
-- every pending step whose diagnostic prerequisites are now satisfied.

create or replace function public.advance_student_learning_path(
  p_student_id uuid,p_node_id uuid,p_mastery numeric,p_completed_at timestamptz default now()
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_path_id uuid; v_completed integer:=0; v_unlocked integer:=0;
begin
  if auth.role()<>'service_role' then raise exception 'service_role_required'; end if;
  select id into v_path_id from public.student_learning_paths
  where student_id=p_student_id and status='active' order by created_at desc limit 1 for update;
  if v_path_id is null then return jsonb_build_object('pathId',null,'completed',0,'unlocked',0); end if;
  if p_mastery>=.85 then
    update public.student_learning_path_steps set status='completed',completed_at=p_completed_at
    where path_id=v_path_id and node_id=p_node_id and status<>'completed';
    get diagnostics v_completed=row_count;
  end if;
  update public.student_learning_path_steps step set status='available'
  where step.path_id=v_path_id and step.status='pending'
    and not exists(
      select 1 from unnest(step.prerequisite_node_ids) prerequisite(node_id)
      left join public.student_learning_path_steps prerequisite_step
        on prerequisite_step.path_id=v_path_id and prerequisite_step.node_id=prerequisite.node_id
      left join public.student_competency_estimates estimate
        on estimate.student_id=p_student_id and estimate.node_id=prerequisite.node_id
      where coalesce(prerequisite_step.status,'')<>'completed'
        and coalesce(estimate.mastery_probability,0)<.85
    );
  get diagnostics v_unlocked=row_count;
  if not exists(select 1 from public.student_learning_path_steps where path_id=v_path_id and status not in('completed','skipped')) then
    update public.student_learning_paths set status='completed',completed_at=p_completed_at where id=v_path_id;
  end if;
  return jsonb_build_object('pathId',v_path_id,'completed',v_completed,'unlocked',v_unlocked);
end
$$;

revoke all on function public.advance_student_learning_path(uuid,uuid,numeric,timestamptz)
  from public,authenticated;
grant execute on function public.advance_student_learning_path(uuid,uuid,numeric,timestamptz)
  to service_role;
