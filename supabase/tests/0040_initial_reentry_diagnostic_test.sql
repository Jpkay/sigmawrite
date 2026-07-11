begin;create extension if not exists pgtap with schema extensions;select plan(9);
select has_column('public','diagnostic_runs','run_type','Run distinguishes initial/re-entry');
select has_column('public','diagnostic_runs','taxonomy_release_id','Run pins taxonomy release');
select has_column('public','diagnostic_runs','prior_state_snapshot','Prior history snapshot is preserved');
select has_column('public','diagnostic_runs','stopping_reason','Stopping is explainable');
select has_table('public','diagnostic_run_targets','Re-entry targets are relational');
select has_table('public','diagnostic_recommendations','Recommendations are auditable');
select has_function('public','student_diagnostic_requirement',array['uuid','integer','numeric'],'Assessment trigger exists');
select has_function('public','next_reentry_diagnostic_item',array['uuid','uuid'],'Targeted probe selector exists');
select is((select count(*) from information_schema.table_constraints where table_schema='public' and table_name='diagnostic_runs' and constraint_type='FOREIGN KEY' and constraint_name like '%taxonomy_release%'),1::bigint,'Runs reference an immutable taxonomy release');
select * from finish();rollback;

