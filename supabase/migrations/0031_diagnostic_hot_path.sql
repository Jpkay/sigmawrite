-- Sprint 8 hardening: choose the next adaptive probe in one database call.
--
-- The original implementation loaded the complete graph, estimates, attempts,
-- items and choices through several HTTP round trips after every answer. Keeping
-- the exact ranking beside the data makes the learner interaction predictable
-- even when the application server is far from the database.

create or replace function public.next_diagnostic_item(
  p_student_id uuid,
  p_run_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  result jsonb;
begin
  if not exists (
    select 1
    from public.diagnostic_runs run
    where run.id = p_run_id
      and run.student_id = p_student_id
      and run.status = 'running'
  ) then
    return null;
  end if;

  if auth.role() <> 'service_role' and not public.owns_student(p_student_id) then
    raise exception 'not authorized';
  end if;

  with recursive
  run_scope as (
    select coalesce(goal.scope, '{}'::jsonb) as scope
    from public.diagnostic_runs run
    left join public.learning_goals goal on goal.id = run.learning_goal_id
    where run.id = p_run_id
  ),
  attempt_stats as (
    select attempt.node_id, count(*)::int as asked
    from public.competency_attempts attempt
    where attempt.diagnostic_run_id = p_run_id
    group by attempt.node_id
  ),
  last_failed as (
    select attempt.node_id
    from public.competency_attempts attempt
    where attempt.diagnostic_run_id = p_run_id
      and attempt.is_correct = false
    order by attempt.attempted_at desc, attempt.id desc
    limit 1
  ),
  prerequisite_paths(root_id, node_id) as (
    select edge.target_node_id, edge.source_node_id
    from public.competency_edges edge
    where edge.edge_type = 'prerequisite'
    union
    select path.root_id, edge.source_node_id
    from prerequisite_paths path
    join public.competency_edges edge
      on edge.target_node_id = path.node_id
     and edge.edge_type = 'prerequisite'
  ),
  prerequisite_counts as (
    select root_id, count(distinct node_id)::int as prerequisite_count
    from prerequisite_paths
    group by root_id
  ),
  eligible_items as (
    select distinct on (item.primary_node_id)
      item.id,
      item.primary_node_id,
      item.prompt_fr,
      item.instructions_fr,
      item.response_type,
      item.created_at,
      node.key as node_key,
      node.label_fr as node_label,
      node.strand,
      coalesce(estimate.uncertainty, 1) as uncertainty,
      coalesce(stats.asked, 0) as asked,
      coalesce(counts.prerequisite_count, 0) as prerequisite_count,
      exists (
        select 1
        from last_failed failed
        join public.competency_edges edge
          on edge.target_node_id = failed.node_id
         and edge.source_node_id = item.primary_node_id
         and edge.edge_type = 'prerequisite'
      ) as descends_from_failure
    from public.competency_items item
    join public.competency_nodes node on node.id = item.primary_node_id
    cross join run_scope
    left join public.student_competency_estimates estimate
      on estimate.student_id = p_student_id
     and estimate.node_id = item.primary_node_id
    left join attempt_stats stats on stats.node_id = item.primary_node_id
    left join prerequisite_counts counts on counts.root_id = item.primary_node_id
    where item.review_status in ('auto_approved', 'human_approved')
      and node.review_status in ('auto_approved', 'human_approved')
      and coalesce(estimate.uncertainty, 1) > 0.4
      and coalesce(stats.asked, 0) < 3
      and (
        not (run_scope.scope ? 'strands')
        or run_scope.scope->'strands' ? node.strand
      )
      and not exists (
        select 1
        from public.competency_attempts used
        where used.diagnostic_run_id = p_run_id
          and used.item_id = item.id
      )
    order by item.primary_node_id, item.created_at, item.id
  ),
  selected as (
    select eligible.*
    from eligible_items eligible
    order by
      eligible.descends_from_failure desc,
      eligible.uncertainty * (1 + ln(1 + eligible.prerequisite_count)) desc,
      eligible.node_key,
      eligible.created_at,
      eligible.id
    limit 1
  )
  select jsonb_build_object(
    'id', selected.id,
    'nodeId', selected.primary_node_id,
    'nodeKey', selected.node_key,
    'nodeLabel', selected.node_label,
    'promptFr', selected.prompt_fr,
    'instructionsFr', selected.instructions_fr,
    'responseType', selected.response_type,
    'choices', coalesce((
      select jsonb_agg(
        jsonb_build_object('id', choice.id, 'text', choice.choice_text)
        order by choice.position nulls last, choice.id
      )
      from public.competency_item_choices choice
      where choice.item_id = selected.id
    ), '[]'::jsonb)
  )
  into result
  from selected;

  return result;
end;
$function$;

revoke all on function public.next_diagnostic_item(uuid, uuid) from public;
grant execute on function public.next_diagnostic_item(uuid, uuid) to authenticated, service_role;
