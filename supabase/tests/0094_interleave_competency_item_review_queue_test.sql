begin;
set local search_path=public,extensions;
create extension if not exists pgtap with schema extensions;
select plan(5);

select has_column('public','competency_item_review_assignments','queue_position','Review assignments have durable queue order');
select col_not_null('public','competency_item_review_assignments','queue_position','Every assignment has a queue position');
select col_is_unique('public','competency_item_review_assignments',array['reviewer_profile_id','queue_position'],'Queue positions are unique per reviewer');
select has_index('public','competency_item_review_assignments','competency_item_review_assignments_queue_idx','Ordered reviewer queue is indexed');
select ok(
  not exists(
    select 1
    from (
      select
        assignment.reviewer_profile_id,
        assignment.queue_position,
        membership.section_key,
        row_number() over(partition by assignment.reviewer_profile_id order by assignment.queue_position) as position
      from public.competency_item_review_assignments assignment
      join public.diagnostic_item_bank_memberships membership on membership.item_id=assignment.item_id
    ) ordered
    where ordered.position<=24
      and ordered.section_key<>case ((ordered.position-1)%4)
        when 0 then 'reading_comprehension'
        when 1 then 'grammar'
        when 2 then 'spelling'
        else 'conjugation'
      end
  ),
  'First 24 assignments repeat the four-section round robin for every reviewer'
);

select * from finish();
rollback;
