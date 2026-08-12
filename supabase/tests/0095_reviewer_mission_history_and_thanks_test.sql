begin;
set local search_path=public,extensions;
create extension if not exists pgtap with schema extensions;
select plan(8);

select function_returns('public','notify_reviewer_thanks',array[]::text[],'trigger','Review completion has an acknowledgement trigger');
select has_trigger('public','review_assignments','review_assignment_thanks','Passage completion creates reviewer thanks');
select has_trigger('public','competency_item_review_assignments','competency_review_assignment_thanks','Exercise completion creates reviewer thanks');
select has_function('public','revise_content_review',array['uuid','jsonb','text','text','text[]','jsonb'],'Submitted passage reviews can be revised');
select is_definer('public','revise_content_review',array['uuid','jsonb','text','text','text[]','jsonb'],'Passage revision is guarded across RLS');
select function_privs_are('public','revise_content_review',array['uuid','jsonb','text','text','text[]','jsonb'],'authenticated',array['EXECUTE'],'Reviewers may call passage revision');
select has_function('public','revise_competency_item_review',array['uuid','text','text','text','text'],'Submitted exercise reviews can be revised');
select function_privs_are('public','revise_competency_item_review',array['uuid','text','text','text','text'],'authenticated',array['EXECUTE'],'Reviewers may call exercise revision');

select * from finish();
rollback;
