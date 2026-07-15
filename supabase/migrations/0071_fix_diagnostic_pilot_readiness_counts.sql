-- Report real item capacity without multiplying each evidence row by every
-- other required evidence row in the same section.

begin;

create or replace function public.diagnostic_pilot_bank_readiness(
  p_taxonomy_release_id uuid,p_bank_release_id uuid
) returns jsonb language sql stable security definer set search_path=public as $$
with required as (
  select node.record_id node_id,evidence.record_id evidence_id,
    public.diagnostic_section_for_strand(node.record_snapshot->>'strand') section_key,
    greatest(2,coalesce(
      nullif(evidence.record_snapshot->'successCriteria'->>'minimumDistinctItems','')::int,
      nullif(evidence.record_snapshot->'successCriteria'->>'minimumDistinctTexts','')::int,
      2
    )) required_items
  from public.taxonomy_release_memberships node
  join public.taxonomy_release_memberships evidence
    on evidence.release_id=node.release_id
    and evidence.record_type='mastery_evidence'
    and split_part(evidence.stable_key,':',1)=node.stable_key
  where node.release_id=p_taxonomy_release_id
    and node.record_type='competency_node'
    and evidence.record_snapshot->>'expectation' in ('receptive','controlled_production')
    and public.diagnostic_section_for_strand(node.record_snapshot->>'strand') is not null
), capacity as (
  select required.*,
    count(distinct membership.item_id) filter (
      where public.diagnostic_pilot_item_is_eligible(membership.item_id)
    )::int item_count
  from required
  left join public.diagnostic_item_bank_memberships membership
    on membership.bank_release_id=p_bank_release_id
    and membership.node_id=required.node_id
    and membership.mastery_evidence_id=required.evidence_id
  group by required.node_id,required.evidence_id,required.section_key,required.required_items
), node_capacity as (
  select section_key,node_id,sum(item_count)::int item_count,
    bool_and(item_count>=required_items) confirmable
  from capacity group by section_key,node_id
), section_rows as (
  select section.key,
    count(node.node_id)::int target_node_count,
    count(node.node_id) filter (where node.item_count>0)::int nodes_with_items,
    coalesce(sum(node.item_count),0)::int approved_item_count,
    count(node.node_id) filter (where node.confirmable)::int confirmable_node_count
  from (values
    ('reading_comprehension'),('grammar'),('spelling'),('conjugation')
  ) section(key)
  left join node_capacity node on node.section_key=section.key
  group by section.key
), release_ok as (
  select exists (
    select 1 from public.diagnostic_item_bank_releases bank
    join public.taxonomy_releases taxonomy on taxonomy.id=bank.taxonomy_release_id
    where bank.id=p_bank_release_id and taxonomy.id=p_taxonomy_release_id
      and bank.status in ('draft','validating')
      and taxonomy.status in ('validating','published')
  ) ok
), sections as (
  select row.*,
    (row.target_node_count>=6 and row.nodes_with_items=row.target_node_count
      and row.confirmable_node_count=row.target_node_count) ready
  from section_rows row
)
select jsonb_build_object(
  'ready',(select ok from release_ok) and coalesce(bool_and(ready),false),
  'sections',coalesce(jsonb_agg(jsonb_build_object(
    'key',key,'targetNodeCount',target_node_count,'nodesWithItems',nodes_with_items,
    'approvedItemCount',approved_item_count,'confirmableNodeCount',confirmable_node_count,
    'ready',ready
  ) order by case key when 'reading_comprehension' then 1 when 'grammar' then 2
    when 'spelling' then 3 else 4 end),'[]'::jsonb)
) from sections
$$;

commit;
