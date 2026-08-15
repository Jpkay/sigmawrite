begin;
set local search_path=public,extensions;
create extension if not exists pgtap with schema extensions;
select plan(3);

select has_function('public','validate_content_review_version_payload',array[]::text[],'Review snapshot completeness validator exists');
select has_trigger('public','content_review_versions','content_review_version_payload_valid','Incomplete review snapshots are rejected');
select function_returns('public','validate_content_review_version_payload',array[]::text[],'trigger','Completeness validator remains a trigger function');

select * from finish();
rollback;
