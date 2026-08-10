begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(18);

select has_table('public','diagnostic_pilot_settings','Pilot kill switch exists');
select has_table('public','diagnostic_pilot_enrollments','Pilot enrollment allowlist exists');
select has_column('public','diagnostic_runs','is_pilot','Runs identify provisional pilots');
select has_column('public','diagnostic_runs','pilot_enrollment_id','Pilot runs pin their enrollment');
select has_column('public','diagnostic_results','provisional','Diagnostic results identify provisional output');
select has_column('public','student_learning_paths','provisional','Learning paths identify provisional output');
select has_column('public','competency_attempts','provisional','Pilot attempts are separable from psychometrics');

select has_function('public','diagnostic_pilot_context',array['uuid'],'Pilot access is resolved in the database');
select function_privs_are('public','diagnostic_pilot_context',array['uuid'],'service_role',array['EXECUTE'],'Only trusted server code resolves pilot access');
select function_privs_are('public','diagnostic_pilot_context',array['uuid'],'authenticated',array[]::text[],'Clients cannot call the pilot resolver directly');
select has_function('public','diagnostic_pilot_bank_readiness',array['uuid','uuid'],'Pilot bank has a separate structural readiness contract');
select has_function('public','next_pilot_section_diagnostic_item',array['uuid','uuid','text'],'Pilot selection has a separate RPC');
select function_privs_are('public','next_pilot_section_diagnostic_item',array['uuid','uuid','text'],'authenticated',array[]::text[],'Clients cannot bypass the pilot selector boundary');

select has_trigger('public','student_competency_estimates','suppress_pilot_competency_estimate_trigger','Pilot evidence cannot alter durable mastery');
select has_trigger('public','diagnostic_responses','mark_pilot_diagnostic_response_trigger','Pilot responses are marked provisional');
select has_trigger('public','competency_attempts','mark_pilot_competency_attempt_trigger','Pilot attempts are marked provisional');

select is((select enabled from public.diagnostic_pilot_settings where singleton),false,'Pilot defaults fail closed');
select extensions.ok(
  pg_get_functiondef('public.student_learning_is_unlocked(uuid)'::regprocedure)
    like '%bank.status=''published''%',
  'Production learning unlock still requires a published bank'
);

select * from finish();
rollback;
