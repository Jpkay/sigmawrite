-- French mastery platform — graph traversal (Roadmap Phase 7, Stream B).
-- Recursive-CTE functions over the prerequisite DAG. This is why the graph lives
-- in Postgres: these read the graph and join per-student estimates in one place,
-- under RLS. A depth guard (< 50) defends against accidental cycles (the DAG
-- invariant is enforced at authoring time by QC Gate 1, not by the DB).

-- ───────────────────── Structural traversal (graph only) ───────────────────

-- All transitive prerequisites of a node (everything that must be mastered
-- before it). depth = shortest hop distance along prerequisite edges.
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

-- All transitive dependents of a node (everything it unlocks downstream).
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

-- ─────────────────── Student-conditioned traversal (frontier) ───────────────

-- Ready-to-learn frontier: nodes the student has NOT yet mastered but whose
-- direct prerequisites are ALL mastered. This is the KST "fringe" — what to
-- teach next. Optionally scoped to a goal's strands.
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

-- Catch-up path to a target competency: every unmastered transitive prerequisite
-- plus the target, ordered deepest-foundation-first (a valid topological order
-- for the DAG). This is the sequenced "layers" the learner climbs.
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
