begin;
set local search_path=public,extensions;
select plan(2);
select is((select pipeline_version from passage_automation_policy),'selective-passage-2','QA version upgrades');
select is((select enabled from passage_automation_policy),false,'Upgrade never enables publication');
select * from finish();
rollback;
