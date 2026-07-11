-- French mastery platform — security hardening (Roadmap Phase 7).
-- Pin search_path on the graph functions (matches the convention of the existing
-- RLS helpers in 0002). Addresses the function_search_path_mutable advisor.
-- Definitions are otherwise identical to 0008/0010; create-or-replace is a no-op
-- on a fresh install that already ran the hardened 0008/0010.

create or replace function public.cefr_rank(level text)
returns int language sql immutable set search_path = public as $$
  select case level
    when 'A1' then 1 when 'A2' then 2
    when 'B1' then 3 when 'B2' then 4
    when 'C1' then 5 when 'C2' then 6
    else null end
$$;

create or replace function public.competency_prerequisites(p_node_id uuid)
returns table(node_id uuid, depth int)
language sql stable set search_path = public as $$
  with recursive walk as (
    select e.source_node_id as node_id, 1 as depth
    from competency_edges e
    where e.target_node_id = p_node_id and e.edge_type = 'prerequisite'
    union
    select e.source_node_id, w.depth + 1
    from competency_edges e
    join walk w on e.target_node_id = w.node_id
    where e.edge_type = 'prerequisite' and w.depth < 50
  )
  select node_id, min(depth) as depth from walk group by node_id
$$;

create or replace function public.competency_dependents(p_node_id uuid)
returns table(node_id uuid, depth int)
language sql stable set search_path = public as $$
  with recursive walk as (
    select e.target_node_id as node_id, 1 as depth
    from competency_edges e
    where e.source_node_id = p_node_id and e.edge_type = 'prerequisite'
    union
    select e.target_node_id, w.depth + 1
    from competency_edges e
    join walk w on e.source_node_id = w.node_id
    where e.edge_type = 'prerequisite' and w.depth < 50
  )
  select node_id, min(depth) as depth from walk group by node_id
$$;

create or replace function public.student_ready_to_learn(
  p_student_id uuid,
  p_threshold numeric default 0.85,
  p_strands text[] default null
)
returns table(node_id uuid, strand text, mastery numeric)
language sql stable set search_path = public as $$
  select n.id, n.strand, coalesce(e.mastery_probability, 0)
  from competency_nodes n
  left join student_competency_estimates e
    on e.node_id = n.id and e.student_id = p_student_id
  where n.review_status in ('auto_approved','human_approved')
    and (p_strands is null or n.strand = any(p_strands))
    and coalesce(e.mastery_probability, 0) < p_threshold
    and not exists (
      select 1
      from competency_edges pe
      left join student_competency_estimates pe_est
        on pe_est.node_id = pe.source_node_id and pe_est.student_id = p_student_id
      where pe.target_node_id = n.id
        and pe.edge_type = 'prerequisite'
        and coalesce(pe_est.mastery_probability, 0) < p_threshold
    )
$$;

create or replace function public.student_catch_up_path(
  p_student_id uuid,
  p_target_node_id uuid,
  p_threshold numeric default 0.85
)
returns table(node_id uuid, depth int, mastery numeric)
language sql stable set search_path = public as $$
  with prereqs as (
    select * from public.competency_prerequisites(p_target_node_id)
  ),
  scored as (
    select pr.node_id, pr.depth, coalesce(e.mastery_probability, 0) as mastery
    from prereqs pr
    left join student_competency_estimates e
      on e.node_id = pr.node_id and e.student_id = p_student_id
    where coalesce(e.mastery_probability, 0) < p_threshold
    union all
    select p_target_node_id, 0,
           coalesce((
             select mastery_probability from student_competency_estimates
             where node_id = p_target_node_id and student_id = p_student_id
           ), 0)
  )
  select node_id, depth, mastery from scored
  order by depth desc, node_id
$$;