begin;
set local search_path=public,extensions;
select plan(2);
select is((select pipeline_version from passage_automation_policy),'selective-passage-3','The independent-moderation v3 policy supersedes v2');
select is((select enabled from passage_automation_policy),false,'QA upgrades never enable publication');
select * from finish();
rollback;
