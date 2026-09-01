-- Section-aware graph diagnostic: independent adaptive domains, frozen item
-- assignments, direct/inferred node results, and an immediate learning path.

alter table public.diagnostic_runs
  add column if not exists protocol_version text not null default 'legacy-v1',
  add column if not exists current_section text,
  add column if not exists total_min_probes integer,
  add column if not exists total_max_probes integer;

alter table public.diagnostic_runs
  add constraint diagnostic_runs_current_section_check check (
    current_section is null or current_section in (
      'reading_comprehension','grammar','spelling','conjugation'
    )
  ),
  add constraint diagnostic_runs_probe_envelope_check check (
    (total_min_probes is null and total_max_probes is null)
    or (
      total_min_probes is not null and total_min_probes > 0
      and total_max_probes is not null and total_max_probes >= total_min_probes
    )
  );

create table public.diagnostic_run_sections (
  run_id uuid not null references public.diagnostic_runs(id) on delete cascade,
  section_key text not null check (section_key in (
    'reading_comprehension','grammar','spelling','conjugation'
  )),
  position integer not null check (position between 1 and 4),
  status text not null default 'pending' check (status in (
    'pending','active','completed','insufficient_items'
  )),
  min_probes integer not null check (min_probes > 0),
  max_probes integer not null check (max_probes >= min_probes),
  min_distinct_nodes integer not null check (min_distinct_nodes > 0),
  probe_count integer not null default 0 check (probe_count >= 0),
  distinct_nodes_tested integer not null default 0 check (distinct_nodes_tested >= 0),
  confirmed_node_count integer not null default 0 check (confirmed_node_count >= 0),
  target_node_count integer not null default 0 check (target_node_count >= 0),
  resolved_node_count integer not null default 0 check (resolved_node_count >= 0),
  mean_uncertainty numeric not null default 1 check (mean_uncertainty between 0 and 1),
  coverage_ratio numeric not null default 0 check (coverage_ratio between 0 and 1),
  confidence text not null default 'low' check (confidence in ('low','medium','high')),
  stopping_reason text check (stopping_reason in (
    'resolved','max_probes','low_information_gain','insufficient_items'
  )),
  started_at timestamptz,
  completed_at timestamptz,
  primary key (run_id, section_key),
  unique (run_id, position)
);

create table public.diagnostic_run_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.diagnostic_runs(id) on delete cascade,
  item_id uuid not null references public.competency_items(id) on delete restrict,
  node_id uuid not null references public.competency_nodes(id) on delete restrict,
  section_key text not null check (section_key in (
    'reading_comprehension','grammar','spelling','conjugation'
  )),
  position integer not null check (position > 0),
  item_snapshot jsonb not null,
  information_gain numeric not null default 0 check (information_gain >= 0),
  assigned_at timestamptz not null default now(),
  answered_at timestamptz,
  unique (run_id, item_id),
  unique (run_id, position)
);

create table public.diagnostic_responses (
  id uuid primary key default gen_random_uuid(),
  run_item_id uuid not null unique references public.diagnostic_run_items(id) on delete restrict,
  run_id uuid not null references public.diagnostic_runs(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  idempotency_key uuid not null,
  selected_choice_id uuid references public.competency_item_choices(id) on delete set null,
  answer_text text,
  score numeric not null check (score between 0 and 1),
  is_correct boolean not null,
  latency_ms integer not null check (latency_ms >= 0),
  answered_at timestamptz not null default now(),
  unique (student_id, idempotency_key),
  unique (run_id, idempotency_key)
);

alter table public.competency_attempts
  add column if not exists diagnostic_response_id uuid unique
    references public.diagnostic_responses(id) on delete set null;

alter table public.diagnostic_results
  add column if not exists diagnostic_run_id uuid unique
    references public.diagnostic_runs(id) on delete set null;

create table public.diagnostic_node_results (
  run_id uuid not null references public.diagnostic_runs(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  node_id uuid not null references public.competency_nodes(id) on delete restrict,
  section_key text not null check (section_key in (
    'reading_comprehension','grammar','spelling','conjugation'
  )),
  mastery_probability numeric not null check (mastery_probability between 0 and 1),
  uncertainty numeric not null check (uncertainty between 0 and 1),
  direct_evidence_count integer not null default 0 check (direct_evidence_count >= 0),
  evidence_kind text not null check (evidence_kind in (
    'direct','inferred_prerequisite','historical'
  )),
  inferred_from_node_id uuid references public.competency_nodes(id) on delete set null,
  inference_depth integer check (inference_depth is null or inference_depth > 0),
  classification text not null check (classification in (
    'mastered','fragile','missing','unknown'
  )),
  updated_at timestamptz not null default now(),
  primary key (run_id, node_id)
);

create or replace function public.validate_diagnostic_run_item()
returns trigger language plpgsql set search_path = public as $$
declare item_node uuid; node_strand text;
begin
  select primary_node_id into item_node from public.competency_items where id=new.item_id;
  select strand into node_strand from public.competency_nodes where id=new.node_id;
  if item_node is distinct from new.node_id then raise exception 'diagnostic assignment item/node mismatch'; end if;
  if (case
    when node_strand='comprehension_ecrite' then 'reading_comprehension'
    when node_strand='grammaire_syntaxe' then 'grammar'
    when node_strand in ('orthographe_lexicale','orthographe_grammaticale') then 'spelling'
    when node_strand='conjugaison' then 'conjugation' else null end) is distinct from new.section_key then
    raise exception 'diagnostic assignment node/section mismatch';
  end if;
  if not exists(select 1 from public.diagnostic_run_targets target where target.run_id=new.run_id and target.node_id=new.node_id) then
    raise exception 'diagnostic assignment node is outside run targets';
  end if;
  return new;
end
$$;

create trigger diagnostic_run_item_consistency
before insert or update on public.diagnostic_run_items
for each row execute function public.validate_diagnostic_run_item();

create or replace function public.validate_diagnostic_response()
returns trigger language plpgsql set search_path = public as $$
declare assigned_run uuid; assigned_item uuid; run_student uuid;
begin
  select run_id,item_id into assigned_run,assigned_item
  from public.diagnostic_run_items where id=new.run_item_id;
  select student_id into run_student from public.diagnostic_runs where id=new.run_id;
  if assigned_run is distinct from new.run_id then raise exception 'diagnostic response run mismatch'; end if;
  if run_student is distinct from new.student_id then raise exception 'diagnostic response student mismatch'; end if;
  if new.selected_choice_id is not null and not exists(
    select 1 from public.competency_item_choices choice
    where choice.id=new.selected_choice_id and choice.item_id=assigned_item
  ) then raise exception 'diagnostic response choice/item mismatch'; end if;
  return new;
end
$$;

create trigger diagnostic_response_consistency
before insert or update on public.diagnostic_responses
for each row execute function public.validate_diagnostic_response();

alter table public.student_competency_estimates
  add column if not exists estimate_source text not null default 'historical'
    check (estimate_source in ('historical','direct','diagnostic_inference')),
  add column if not exists inferred_from_node_id uuid references public.competency_nodes(id) on delete set null,
  add column if not exists last_diagnostic_run_id uuid references public.diagnostic_runs(id) on delete set null;

create table public.student_learning_paths (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  source_diagnostic_run_id uuid not null unique references public.diagnostic_runs(id) on delete restrict,
  learning_goal_id uuid references public.learning_goals(id) on delete set null,
  taxonomy_release_id uuid not null references public.taxonomy_releases(id) on delete restrict,
  status text not null default 'active' check (status in ('active','superseded','completed')),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index student_learning_paths_one_active
  on public.student_learning_paths(student_id) where status = 'active';

create table public.student_learning_path_steps (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.student_learning_paths(id) on delete cascade,
  node_id uuid not null references public.competency_nodes(id) on delete restrict,
  section_key text not null check (section_key in (
    'reading_comprehension','grammar','spelling','conjugation'
  )),
  position integer not null check (position > 0),
  stage text not null check (stage in ('remediation','consolidation','verification')),
  mastery_snapshot numeric not null check (mastery_snapshot between 0 and 1),
  uncertainty_snapshot numeric not null check (uncertainty_snapshot between 0 and 1),
  prerequisite_node_ids uuid[] not null default '{}',
  rationale_fr text not null,
  status text not null default 'pending' check (status in ('pending','available','in_progress','completed','skipped')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (path_id, node_id),
  unique (path_id, position)
);

alter table public.diagnostic_run_sections enable row level security;
alter table public.diagnostic_run_items enable row level security;
alter table public.diagnostic_responses enable row level security;
alter table public.diagnostic_node_results enable row level security;
alter table public.student_learning_paths enable row level security;
alter table public.student_learning_path_steps enable row level security;

create policy diagnostic_run_sections_select on public.diagnostic_run_sections
  for select using (exists (
    select 1 from public.diagnostic_runs run
    where run.id = run_id and public.can_view_student(run.student_id)
  ));
create policy diagnostic_run_items_select on public.diagnostic_run_items
  for select using (exists (
    select 1 from public.diagnostic_runs run
    where run.id = run_id and public.can_view_student(run.student_id)
  ));
create policy diagnostic_responses_select on public.diagnostic_responses
  for select using (public.can_view_student(student_id));
create policy diagnostic_node_results_select on public.diagnostic_node_results
  for select using (public.can_view_student(student_id));
create policy student_learning_paths_select on public.student_learning_paths
  for select using (public.can_view_student(student_id));
create policy student_learning_path_steps_select on public.student_learning_path_steps
  for select using (exists (
    select 1 from public.student_learning_paths path
    where path.id = path_id and public.can_view_student(path.student_id)
  ));

grant select on public.diagnostic_run_sections, public.diagnostic_run_items,
  public.diagnostic_responses, public.diagnostic_node_results,
  public.student_learning_paths, public.student_learning_path_steps
  to authenticated;

create index diagnostic_run_items_unanswered
  on public.diagnostic_run_items(run_id, position) where answered_at is null;
create index diagnostic_node_results_section
  on public.diagnostic_node_results(run_id, section_key, evidence_kind);
create index student_learning_path_steps_order
  on public.student_learning_path_steps(path_id, position);

create or replace function public.diagnostic_section_for_strand(p_strand text)
returns text language sql immutable parallel safe set search_path = public as $$
  select case
    when p_strand = 'comprehension_ecrite' then 'reading_comprehension'
    when p_strand = 'grammaire_syntaxe' then 'grammar'
    when p_strand in ('orthographe_lexicale','orthographe_grammaticale') then 'spelling'
    when p_strand = 'conjugaison' then 'conjugation'
    else null
  end
$$;

create or replace function public.diagnostic_bank_readiness(p_release_id uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
with configs(section_key,min_nodes,min_items) as (
  values
    ('reading_comprehension',6,8),
    ('grammar',6,8),
    ('spelling',6,8),
    ('conjugation',6,8)
), release_nodes as (
  select node.id, public.diagnostic_section_for_strand(node.strand) section_key
  from public.taxonomy_release_memberships membership
  join public.competency_nodes node on node.id = membership.record_id
  where membership.release_id = p_release_id
    and membership.record_type = 'competency_node'
    and node.review_status in ('auto_approved','human_approved')
), section_stats as (
  select config.section_key, config.min_nodes, config.min_items,
    count(distinct node.id)::int target_node_count,
    count(distinct node.id) filter (where item.id is not null)::int nodes_with_items,
    count(distinct item.id)::int approved_item_count
  from configs config
  left join release_nodes node on node.section_key = config.section_key
  left join public.competency_items item on item.primary_node_id = node.id
    and item.review_status in ('auto_approved','human_approved')
  group by config.section_key, config.min_nodes, config.min_items
)
select jsonb_build_object(
  'ready', bool_and(target_node_count >= min_nodes and nodes_with_items >= min_nodes and approved_item_count >= min_items),
  'sections', jsonb_agg(jsonb_build_object(
    'key',section_key,
    'targetNodeCount',target_node_count,
    'nodesWithItems',nodes_with_items,
    'approvedItemCount',approved_item_count,
    'ready',target_node_count >= min_nodes and nodes_with_items >= min_nodes and approved_item_count >= min_items
  ) order by case section_key
    when 'reading_comprehension' then 1 when 'grammar' then 2
    when 'spelling' then 3 else 4 end)
) from section_stats
$$;

revoke all on function public.diagnostic_bank_readiness(uuid) from public;
grant execute on function public.diagnostic_bank_readiness(uuid) to authenticated, service_role;

create or replace function public.next_section_diagnostic_item(
  p_student_id uuid,
  p_run_id uuid,
  p_section_key text
)
returns jsonb
language sql stable security definer set search_path = public as $$
with recursive run_record as (
  select run.id, run.run_type
  from public.diagnostic_runs run
  where run.id = p_run_id and run.student_id = p_student_id and run.status = 'running'
    and (auth.role() = 'service_role' or public.owns_student(p_student_id))
), attempt_stats as (
  select attempt.node_id, count(*)::int asked
  from public.competency_attempts attempt
  where attempt.diagnostic_run_id = p_run_id
  group by attempt.node_id
), last_failed as (
  select attempt.node_id
  from public.competency_attempts attempt
  join public.competency_nodes node on node.id = attempt.node_id
  where attempt.diagnostic_run_id = p_run_id and attempt.is_correct = false
    and public.diagnostic_section_for_strand(node.strand) = p_section_key
  order by attempt.attempted_at desc, attempt.id desc limit 1
), prerequisite_paths(root_id,node_id,depth) as (
  select edge.target_node_id, edge.source_node_id, 1
  from public.competency_edges edge
  join public.diagnostic_run_targets target on target.run_id = p_run_id
    and target.node_id = edge.target_node_id
  where edge.edge_type = 'prerequisite' and coalesce(edge.prerequisite_class,'hard') = 'hard'
  union all
  select path.root_id, edge.source_node_id, path.depth + 1
  from prerequisite_paths path
  join public.competency_edges edge on edge.target_node_id = path.node_id
    and edge.edge_type = 'prerequisite' and coalesce(edge.prerequisite_class,'hard') = 'hard'
  where path.depth < 30
), prerequisite_counts as (
  select root_id, count(distinct node_id)::int prerequisite_count
  from prerequisite_paths group by root_id
), candidates as (
  select item.id, item.primary_node_id, item.prompt_fr, item.instructions_fr,
    item.response_type, item.difficulty, node.key node_key, node.label_fr node_label,
    node.strand, coalesce(result.uncertainty,estimate.uncertainty,1)::numeric uncertainty,
    coalesce(result.mastery_probability,estimate.mastery_probability,.5)::numeric mastery,
    coalesce(stats.asked,0) asked,
    coalesce(counts.prerequisite_count,0) prerequisite_count,
    target.target_reason,
    exists (
      select 1 from last_failed failed
      join public.competency_edges edge on edge.target_node_id = failed.node_id
        and edge.source_node_id = item.primary_node_id
        and edge.edge_type = 'prerequisite'
        and coalesce(edge.prerequisite_class,'hard') = 'hard'
    ) descends_from_failure,
    row_number() over (
      partition by item.primary_node_id
      order by abs(coalesce(item.difficulty,50) - coalesce(result.mastery_probability,estimate.mastery_probability,.5) * 100), item.id
    ) item_rank
  from run_record run
  join public.diagnostic_run_targets target on target.run_id = run.id
  join public.competency_nodes node on node.id = target.node_id
  join public.competency_items item on item.primary_node_id = node.id
  left join public.diagnostic_node_results result on result.run_id = run.id and result.node_id = node.id
  left join public.student_competency_estimates estimate on estimate.student_id = p_student_id and estimate.node_id = node.id
  left join attempt_stats stats on stats.node_id = node.id
  left join prerequisite_counts counts on counts.root_id = node.id
  where public.diagnostic_section_for_strand(node.strand) = p_section_key
    and node.review_status in ('auto_approved','human_approved')
    and item.review_status in ('auto_approved','human_approved')
    and coalesce(stats.asked,0) < 3
    and not exists (
      select 1 from public.diagnostic_run_items assigned
      where assigned.run_id = p_run_id and assigned.item_id = item.id
    )
), selected as (
  select candidate.*,
    greatest(0, candidate.uncertainty * (1 + ln(1 + candidate.prerequisite_count))) information_gain
  from candidates candidate
  where candidate.item_rank = 1
  order by
    candidate.descends_from_failure desc,
    (candidate.asked = 0) desc,
    (candidate.target_reason in ('stale','uncertain')) desc,
    information_gain desc,
    candidate.node_key,
    candidate.id
  limit 1
)
select jsonb_build_object(
  'id',selected.id,
  'nodeId',selected.primary_node_id,
  'nodeKey',selected.node_key,
  'nodeLabel',selected.node_label,
  'strand',selected.strand,
  'sectionKey',p_section_key,
  'promptFr',selected.prompt_fr,
  'instructionsFr',selected.instructions_fr,
  'responseType',selected.response_type,
  'informationGain',selected.information_gain,
  'choices',coalesce((
    select jsonb_agg(jsonb_build_object('id',choice.id,'text',choice.choice_text)
      order by choice.position nulls last,choice.id)
    from public.competency_item_choices choice where choice.item_id = selected.id
  ),'[]'::jsonb)
) from selected
$$;

revoke all on function public.next_section_diagnostic_item(uuid,uuid,text) from public;
grant execute on function public.next_section_diagnostic_item(uuid,uuid,text) to authenticated, service_role;

create or replace function public.apply_diagnostic_graph_inference(
  p_student_id uuid,
  p_run_id uuid,
  p_node_id uuid,
  p_section_key text,
  p_mastery numeric,
  p_uncertainty numeric,
  p_correct boolean
)
returns void
language plpgsql security definer set search_path = public as $$
declare v_direct_count integer;
begin
  if not exists (
    select 1 from public.diagnostic_runs run
    where run.id = p_run_id and run.student_id = p_student_id and run.status = 'running'
      and (auth.role() = 'service_role' or public.owns_student(p_student_id))
  ) then raise exception 'diagnostic run not authorized'; end if;

  insert into public.diagnostic_node_results(
    run_id,student_id,node_id,section_key,mastery_probability,uncertainty,
    direct_evidence_count,evidence_kind,classification,updated_at
  ) values (
    p_run_id,p_student_id,p_node_id,p_section_key,p_mastery,p_uncertainty,
    1,'direct',case when p_mastery >= .5 then 'fragile' else 'missing' end,now()
  ) on conflict (run_id,node_id) do update set
    mastery_probability = excluded.mastery_probability,
    uncertainty = excluded.uncertainty,
    direct_evidence_count = public.diagnostic_node_results.direct_evidence_count + 1,
    evidence_kind = 'direct', inferred_from_node_id = null, inference_depth = null,
    classification = case
      when public.diagnostic_node_results.direct_evidence_count + 1 >= 2
        and excluded.mastery_probability >= .85 then 'mastered'
      when excluded.mastery_probability >= .5 then 'fragile'
      else 'missing' end,
    updated_at = now();

  select direct_evidence_count into v_direct_count
  from public.diagnostic_node_results where run_id=p_run_id and node_id=p_node_id;

  if p_correct then
    with recursive prerequisites(node_id,depth) as (
      select edge.source_node_id,1
      from public.competency_edges edge
      where edge.target_node_id = p_node_id and edge.edge_type = 'prerequisite'
        and coalesce(edge.prerequisite_class,'hard') = 'hard'
      union
      select edge.source_node_id,path.depth+1
      from prerequisites path
      join public.competency_edges edge on edge.target_node_id = path.node_id
      where edge.edge_type = 'prerequisite'
        and coalesce(edge.prerequisite_class,'hard') = 'hard' and path.depth < 30
    ), scoped as (
      select prerequisite.node_id,min(prerequisite.depth)::int depth
      from prerequisites prerequisite
      join public.diagnostic_run_targets target on target.run_id = p_run_id
        and target.node_id = prerequisite.node_id
      group by prerequisite.node_id
    )
    insert into public.diagnostic_node_results(
      run_id,student_id,node_id,section_key,mastery_probability,uncertainty,
      direct_evidence_count,evidence_kind,inferred_from_node_id,inference_depth,
      classification,updated_at
    ) select
      p_run_id,p_student_id,scoped.node_id,
      public.diagnostic_section_for_strand(node.strand),
      greatest(.55,least(case when v_direct_count >= 2 then .9 else .8 end,p_mastery - scoped.depth*.04)),
      least(.65,greatest(.35,p_uncertainty + scoped.depth*.04)),
      0,'inferred_prerequisite',p_node_id,scoped.depth,
      case when v_direct_count >= 2 and greatest(.55,least(.9,p_mastery - scoped.depth*.04)) >= .85
        then 'mastered' else 'fragile' end,now()
    from scoped join public.competency_nodes node on node.id = scoped.node_id
    on conflict (run_id,node_id) do update set
      mastery_probability = case
        when public.diagnostic_node_results.evidence_kind = 'direct'
          then public.diagnostic_node_results.mastery_probability
        else greatest(public.diagnostic_node_results.mastery_probability,excluded.mastery_probability) end,
      uncertainty = case
        when public.diagnostic_node_results.evidence_kind = 'direct'
          then public.diagnostic_node_results.uncertainty
        else least(public.diagnostic_node_results.uncertainty,excluded.uncertainty) end,
      inferred_from_node_id = case
        when public.diagnostic_node_results.evidence_kind = 'direct'
          then public.diagnostic_node_results.inferred_from_node_id
        else excluded.inferred_from_node_id end,
      inference_depth = case
        when public.diagnostic_node_results.evidence_kind = 'direct'
          then public.diagnostic_node_results.inference_depth
        else excluded.inference_depth end,
      classification = case
        when public.diagnostic_node_results.evidence_kind = 'direct'
          then public.diagnostic_node_results.classification
        else excluded.classification end,
      updated_at = now();

    insert into public.student_competency_estimates(
      student_id,node_id,mastery_probability,uncertainty,evidence_count,
      estimate_source,inferred_from_node_id,last_diagnostic_run_id,last_evidence_at,updated_at
    ) select
      result.student_id,result.node_id,result.mastery_probability,result.uncertainty,0,
      'diagnostic_inference',result.inferred_from_node_id,p_run_id,now(),now()
    from public.diagnostic_node_results result
    where result.run_id = p_run_id and result.evidence_kind = 'inferred_prerequisite'
    on conflict (student_id,node_id) do update set
      mastery_probability = excluded.mastery_probability,
      uncertainty = excluded.uncertainty,
      estimate_source = excluded.estimate_source,
      inferred_from_node_id = excluded.inferred_from_node_id,
      last_diagnostic_run_id = excluded.last_diagnostic_run_id,
      last_evidence_at = excluded.last_evidence_at,
      updated_at = excluded.updated_at
    where public.student_competency_estimates.evidence_count = 0
       or public.student_competency_estimates.estimate_source = 'diagnostic_inference';
  end if;
end
$$;

revoke all on function public.apply_diagnostic_graph_inference(uuid,uuid,uuid,text,numeric,numeric,boolean) from public;
grant execute on function public.apply_diagnostic_graph_inference(uuid,uuid,uuid,text,numeric,numeric,boolean) to service_role;

comment on table public.diagnostic_run_sections is
  'Independent adaptive stopping state for reading, grammar, spelling, and conjugation.';
comment on table public.diagnostic_node_results is
  'Immutable-per-run diagnostic interpretation; direct evidence is distinguishable from graph inference and unknown.';
comment on table public.student_learning_paths is
  'A prerequisite-safe personalized path generated immediately from a completed diagnostic run.';
