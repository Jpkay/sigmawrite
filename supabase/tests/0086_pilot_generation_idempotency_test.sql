begin;
set local role postgres;
set local search_path = public, extensions;create extension if not exists pgtap with schema extensions;select plan(1);select has_index('public','ai_generation_jobs','ai_generation_jobs_active_pilot_key','Pilot request keys are unique while active/completed');select * from finish();rollback;
