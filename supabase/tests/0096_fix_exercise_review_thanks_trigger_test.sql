begin;
set local search_path=public,extensions;
create extension if not exists pgtap with schema extensions;
select plan(3);

select has_function('public','notify_reviewer_thanks',array[]::text[],'Shared reviewer acknowledgement trigger exists');
select has_trigger('public','review_assignments','review_assignment_thanks','Passage acknowledgement trigger remains installed');
select has_trigger('public','competency_item_review_assignments','competency_review_assignment_thanks','Exercise acknowledgement trigger remains installed');

select * from finish();
rollback;
