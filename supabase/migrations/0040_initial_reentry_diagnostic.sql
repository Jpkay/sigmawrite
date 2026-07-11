-- G13: initial/re-entry assessment lifecycle, targeted recalibration, and auditable recommendations.
alter table public.diagnostic_runs
  add column run_type text not null default 'initial' check(run_type in ('initial','reentry','calibration')),
  add column trigger_reason text not null default 'no_prior_assessment' check(trigger_reason in ('no_prior_assessment','inactivity','high_uncertainty','manual_calibration')),
  add column taxonomy_release_id uuid references public.taxonomy_releases(id) on delete restrict,
  add column config_snapshot jsonb not null default '{}'::jsonb,
  add column prior_state_snapshot jsonb,
  add column coverage_report jsonb,
  add column stopping_reason text check(stopping_reason in ('resolved','max_probes','low_information_gain','item_exhaustion')),
  add column summary_payload jsonb;

create table public.diagnostic_run_targets(
  run_id uuid not null references public.diagnostic_runs(id) on delete cascade,
  node_id uuid not null references public.competency_nodes(id) on delete cascade,
  target_reason text not null check(target_reason in ('initial_scope','stale','uncertain','prerequisite','calibration')),
  required_modalities text[] not null default '{}',
  created_at timestamptz not null default now(),
  primary key(run_id,node_id)
);
create table public.diagnostic_recommendations(
  id uuid primary key default gen_random_uuid(),run_id uuid not null references public.diagnostic_runs(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  recommendation_type text not null check(recommendation_type in ('remediation','starting_pathway','reassessment')),
  target_node_id uuid references public.competency_nodes(id) on delete set null,
  priority integer not null check(priority>0),rationale text not null,payload jsonb not null default '{}'::jsonb,created_at timestamptz not null default now(),
  unique(run_id,recommendation_type,target_node_id)
);
alter table public.diagnostic_run_targets enable row level security;alter table public.diagnostic_recommendations enable row level security;
create policy diagnostic_targets_select on public.diagnostic_run_targets for select using(exists(select 1 from public.diagnostic_runs r where r.id=run_id and public.can_view_student(r.student_id)));
create policy diagnostic_recommendations_select on public.diagnostic_recommendations for select using(public.can_view_student(student_id));
create policy diagnostic_targets_student_write on public.diagnostic_run_targets for all using(exists(select 1 from public.diagnostic_runs r where r.id=run_id and public.owns_student(r.student_id))) with check(exists(select 1 from public.diagnostic_runs r where r.id=run_id and public.owns_student(r.student_id)));

create or replace function public.student_diagnostic_requirement(p_student_id uuid,p_inactivity_days integer default 60,p_uncertainty_threshold numeric default .65)
returns jsonb language sql stable security definer set search_path=public as $$
with authorized as(select auth.role()='service_role' or public.can_view_student(p_student_id) as allowed),last_run as(select completed_at from public.diagnostic_runs where student_id=p_student_id and status='completed' and (select allowed from authorized) order by completed_at desc limit 1),
cutoff as(select now()-make_interval(days=>greatest(1,p_inactivity_days)) as at),
targets as(select e.node_id,case when e.last_evidence_at is null or e.last_evidence_at<(select at from cutoff) then 'stale' when e.uncertainty>=p_uncertainty_threshold then 'uncertain' end reason from public.student_competency_estimates e where e.student_id=p_student_id),
decision as(select case when not exists(select 1 from last_run) then 'initial' when (select completed_at from last_run)<(select at from cutoff) then 'reentry' when exists(select 1 from targets where reason='uncertain') then 'reentry' else 'calibration' end kind)
select jsonb_build_object('required',(select kind from decision)<>'calibration','kind',(select kind from decision),'reason',case when not exists(select 1 from last_run) then 'no_prior_assessment' when (select completed_at from last_run)<(select at from cutoff) then 'inactivity' when exists(select 1 from targets where reason='uncertain') then 'high_uncertainty' else 'manual_calibration' end,'targetNodeIds',coalesce((select jsonb_agg(node_id order by node_id) from targets where reason is not null),'[]'::jsonb)) from authorized where allowed
$$;
revoke all on function public.student_diagnostic_requirement(uuid,integer,numeric) from public;grant execute on function public.student_diagnostic_requirement(uuid,integer,numeric) to authenticated,service_role;

create or replace function public.next_reentry_diagnostic_item(p_student_id uuid,p_run_id uuid)
returns jsonb language sql stable security definer set search_path=public as $$
select case when run.run_type<>'reentry' then null else(
select jsonb_build_object('id',item.id,'nodeId',item.primary_node_id,'nodeKey',node.key,'nodeLabel',node.label_fr,'promptFr',item.prompt_fr,'instructionsFr',item.instructions_fr,'responseType',item.response_type,'choices',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'text',c.choice_text) order by c.position nulls last,c.id) from public.competency_item_choices c where c.item_id=item.id),'[]'::jsonb))
from public.diagnostic_run_targets target join public.competency_nodes node on node.id=target.node_id join public.competency_items item on item.primary_node_id=target.node_id
left join public.student_competency_estimates estimate on estimate.student_id=p_student_id and estimate.node_id=target.node_id
where target.run_id=p_run_id and item.review_status in('auto_approved','human_approved') and not exists(select 1 from public.competency_attempts a where a.diagnostic_run_id=p_run_id and a.item_id=item.id)
order by coalesce(estimate.uncertainty,1) desc,node.key,item.id limit 1) end
from public.diagnostic_runs run where run.id=p_run_id and run.student_id=p_student_id and run.status='running' and (auth.role()='service_role' or public.owns_student(p_student_id))
$$;
revoke all on function public.next_reentry_diagnostic_item(uuid,uuid) from public;grant execute on function public.next_reentry_diagnostic_item(uuid,uuid) to authenticated,service_role;
