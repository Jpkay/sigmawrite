begin;
set local role postgres;
set local search_path = public, extensions;create extension if not exists pgtap with schema extensions;select plan(3);select has_function('public','claim_job_run',array['text','integer'],'Leased job claim exists');select function_privs_are('public','claim_job_run',array['text','integer'],'authenticated',array[]::text[],'Clients cannot claim jobs');select function_privs_are('public','claim_job_run',array['text','integer'],'service_role',array['EXECUTE'],'Scheduler may claim jobs');select * from finish();rollback;
