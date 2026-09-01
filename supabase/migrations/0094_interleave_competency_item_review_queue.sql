-- Stable round-robin presentation for assigned exercise reviews.
-- Ownership and review evidence remain unchanged; only queue order is added.

begin;

alter table public.competency_item_review_assignments
  add column queue_position integer;

with ranked as (
  select
    assignment.id,
    row_number() over (
      partition by assignment.reviewer_profile_id,membership.section_key
      order by assignment.item_id
    ) as section_rank,
    case membership.section_key
      when 'reading_comprehension' then 1
      when 'grammar' then 2
      when 'spelling' then 3
      when 'conjugation' then 4
      else 5
    end as section_position
  from public.competency_item_review_assignments assignment
  join public.diagnostic_item_bank_memberships membership
    on membership.item_id=assignment.item_id
)
update public.competency_item_review_assignments assignment
set queue_position=((ranked.section_rank-1)*4+ranked.section_position)::integer
from ranked
where ranked.id=assignment.id;

do $$
begin
  if exists(
    select 1 from public.competency_item_review_assignments
    where queue_position is null
  ) then
    raise exception 'all_item_review_assignments_require_a_queue_position';
  end if;
end
$$;

alter table public.competency_item_review_assignments
  alter column queue_position set not null,
  add constraint competency_item_review_assignments_queue_position_positive
    check(queue_position>0),
  add constraint competency_item_review_assignments_reviewer_position_unique
    unique(reviewer_profile_id,queue_position);

drop index competency_item_review_assignments_queue_idx;
create index competency_item_review_assignments_queue_idx
  on public.competency_item_review_assignments(reviewer_profile_id,status,queue_position);

comment on column public.competency_item_review_assignments.queue_position is
  'Stable per-reviewer round-robin order: reading, grammar, spelling, conjugation while each section remains.';

commit;
