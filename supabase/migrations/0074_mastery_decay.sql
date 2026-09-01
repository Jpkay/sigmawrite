-- Mastery decay (gap-analysis Phase 2).
--
-- effective mastery = P(known) × FSRS retrievability, where retrievability
-- follows the power-law forgetting curve R(t, S) = (1 + (19/81)·t/S)^(-0.5)
-- (R = 0.9 when t = S). Rows without memory state keep their raw mastery —
-- the 60-day re-entry staleness trigger still covers legacy estimates.
-- Mirrors src/lib/scoring/decay.ts; the two must stay in sync.

create or replace function public.decayed_mastery(
  p_mastery numeric,
  p_stability numeric,
  p_last_evidence_at timestamptz,
  p_at timestamptz default now()
)
returns numeric
language sql immutable set search_path = public as $$
  select case
    when p_stability is null or p_stability <= 0 or p_last_evidence_at is null
      then coalesce(p_mastery, 0)
    else coalesce(p_mastery, 0) * power(
      1 + (19.0 / 81.0)
        * greatest(0, extract(epoch from (p_at - p_last_evidence_at)) / 86400.0)
        / p_stability,
      -0.5)
  end
$$;

-- Frontier and catch-up sequencing now gate on decayed mastery: a node
-- mastered long ago without reinforcement re-enters the review path.

create or replace function public.student_ready_to_learn(
  p_student_id uuid,
  p_threshold numeric default 0.85,
  p_strands text[] default null
)
returns table(node_id uuid, strand text, mastery numeric)
language sql stable set search_path = public as $$
  select n.id, n.strand,
         public.decayed_mastery(e.mastery_probability, e.memory_stability, e.last_evidence_at)
  from competency_nodes n
  left join student_competency_estimates e
    on e.node_id = n.id and e.student_id = p_student_id
  where n.review_status in ('auto_approved','human_approved')
    and (p_strands is null or n.strand = any(p_strands))
    and public.decayed_mastery(e.mastery_probability, e.memory_stability, e.last_evidence_at) < p_threshold
    and not exists (
      select 1
      from competency_edges pe
      left join student_competency_estimates pe_est
        on pe_est.node_id = pe.source_node_id and pe_est.student_id = p_student_id
      where pe.target_node_id = n.id
        and pe.edge_type = 'prerequisite'
        and public.decayed_mastery(pe_est.mastery_probability, pe_est.memory_stability, pe_est.last_evidence_at) < p_threshold
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
    select pr.node_id, pr.depth,
           public.decayed_mastery(e.mastery_probability, e.memory_stability, e.last_evidence_at) as mastery
    from prereqs pr
    left join student_competency_estimates e
      on e.node_id = pr.node_id and e.student_id = p_student_id
    where public.decayed_mastery(e.mastery_probability, e.memory_stability, e.last_evidence_at) < p_threshold
    union all
    select p_target_node_id, 0,
           coalesce((
             select public.decayed_mastery(mastery_probability, memory_stability, last_evidence_at)
             from student_competency_estimates
             where node_id = p_target_node_id and student_id = p_student_id
           ), 0)
  )
  select node_id, depth, mastery from scored
  order by depth desc, node_id
$$;
