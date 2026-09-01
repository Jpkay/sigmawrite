begin;
set local search_path=public,extensions;
create extension if not exists pgtap with schema extensions;
select plan(2);

select has_function('public','validate_content_review_version_payload',array[]::text[],'Review snapshot body validator exists');
select has_trigger('public','content_review_versions','content_review_version_payload_valid','Incomplete review snapshots are rejected');

select * from finish();
rollback;
