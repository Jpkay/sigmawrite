begin;
set local search_path=public,extensions;
create extension if not exists pgtap with schema extensions;
select plan(14);

select has_table('public','competency_item_review_assignments','Item review workloads are durable');
select has_column('public','competency_item_review_assignments','item_id','Assignments identify the reviewed item');
select has_column('public','competency_item_review_assignments','reviewer_profile_id','Assignments identify the accountable reviewer');
select has_column('public','competency_item_review_assignments','status','Assignments have lifecycle state');
select has_column('public','competency_item_review_assignments','decision','Completed assignments retain the decision');
select has_column('public','competency_item_review_assignments','submitted_at','Completion time is attributable');
select fk_ok('public','competency_item_review_assignments','item_id','public','competency_items','id','Assignment item references canonical content');
select fk_ok('public','competency_item_review_assignments','reviewer_profile_id','public','profiles','id','Assignment reviewer references a profile');
select col_is_unique('public','competency_item_review_assignments','item_id','An item belongs to one reviewer workload');
select has_index('public','competency_item_review_assignments','competency_item_review_assignments_queue_idx','Reviewer queue lookup is indexed');
select table_privs_are('public','competency_item_review_assignments','authenticated',array['SELECT'],'Reviewers cannot mutate assignment rows directly');
select function_privs_are('public','submit_competency_item_review',array['uuid','text','text','text','text'],'authenticated',array['EXECUTE'],'Authenticated reviewers may use the constrained submission RPC');
select is_definer('public','submit_competency_item_review',array['uuid','text','text','text','text'],'Submission crosses RLS only through the guarded function');
select volatility_is('public','submit_competency_item_review',array['uuid','text','text','text','text'],'volatile','Submission is a mutation');

select * from finish();
rollback;
