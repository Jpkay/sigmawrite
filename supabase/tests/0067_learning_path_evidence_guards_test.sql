begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

select has_column(
  'public','student_learning_path_steps','required_evidence_expectation',
  'Learning-path steps can retain their required evidence channel'
);
select has_function(
  'public','advance_student_learning_path',
  array['uuid','uuid','numeric','timestamp with time zone','text'],
  'An evidence-aware path advancement entry point exists'
);
select function_privs_are(
  'public','advance_student_learning_path',
  array['uuid','uuid','numeric','timestamp with time zone','text'],
  'service_role',array['EXECUTE'],
  'Only the trusted server may submit typed path evidence'
);
select function_privs_are(
  'public','advance_student_learning_path',
  array['uuid','uuid','numeric','timestamp with time zone','text'],
  'authenticated',array[]::text[],
  'Students cannot label their own evidence channel'
);
select function_privs_are(
  'public','advance_student_learning_path',
  array['uuid','uuid','numeric','timestamp with time zone','text'],
  'anon',array[]::text[],
  'Anonymous callers cannot label path evidence'
);

insert into public.students(id,display_name) values (
  '67000000-0000-0000-0000-000000000001','Evidence guard student'
);
insert into public.ontology_versions(
  id,version,document_path,status
) values (
  '67000000-0000-0000-0000-000000000101',
  'pgtap-path-evidence-v1','pgtap/path-evidence.json','active'
);
insert into public.taxonomy_releases(
  id,release_key,version,ontology_version_id,status
) values (
  '67000000-0000-0000-0000-000000000102',
  'pgtap-path-evidence','pgtap-path-evidence-v1',
  '67000000-0000-0000-0000-000000000101','draft'
);
insert into public.competency_nodes(
  id,key,strand,label_fr,review_status
) values
  ('67000000-0000-0000-0000-000000000201','pgtap_independent_step','orthographe_grammaticale','Production autonome','human_approved'),
  ('67000000-0000-0000-0000-000000000202','pgtap_controlled_step','orthographe_grammaticale','Pratique contrôlée','human_approved');
insert into public.diagnostic_runs(
  id,student_id,status,protocol_version,taxonomy_release_id
) values (
  '67000000-0000-0000-0000-000000000301',
  '67000000-0000-0000-0000-000000000001',
  'completed','graph-sections-v2',
  '67000000-0000-0000-0000-000000000102'
);
insert into public.student_learning_paths(
  id,student_id,source_diagnostic_run_id,taxonomy_release_id,status
) values (
  '67000000-0000-0000-0000-000000000302',
  '67000000-0000-0000-0000-000000000001',
  '67000000-0000-0000-0000-000000000301',
  '67000000-0000-0000-0000-000000000102','active'
);
insert into public.student_learning_path_steps(
  id,path_id,node_id,section_key,position,stage,mastery_snapshot,
  uncertainty_snapshot,prerequisite_node_ids,rationale_fr,status,
  required_evidence_expectation
) values
  (
    '67000000-0000-0000-0000-000000000401',
    '67000000-0000-0000-0000-000000000302',
    '67000000-0000-0000-0000-000000000201',
    'spelling',1,'verification',.84,.4,'{}',
    'Verify unaided production','available','independent_production'
  ),
  (
    '67000000-0000-0000-0000-000000000402',
    '67000000-0000-0000-0000-000000000302',
    '67000000-0000-0000-0000-000000000202',
    'spelling',2,'consolidation',.6,.4,
    array['67000000-0000-0000-0000-000000000201']::uuid[],
    'Controlled dependent','pending',null
  );

select set_config('request.jwt.claim.role','service_role',true);

select is(
  (public.advance_student_learning_path(
    '67000000-0000-0000-0000-000000000001',
    '67000000-0000-0000-0000-000000000201',.95
  )->>'completed')::integer,
  0,
  'The legacy null-evidence default cannot complete a guarded step'
);
select is(
  (public.advance_student_learning_path(
    '67000000-0000-0000-0000-000000000001',
    '67000000-0000-0000-0000-000000000201',.95,
    '2026-07-12 12:00:00+00','controlled_production'
  )->>'completed')::integer,
  0,
  'Controlled practice cannot complete independent production'
);
select is(
  (select status from public.student_learning_path_steps
   where id='67000000-0000-0000-0000-000000000401'),
  'available',
  'An evidence mismatch leaves the independent step available'
);
select is(
  (public.advance_student_learning_path(
    '67000000-0000-0000-0000-000000000001',
    '67000000-0000-0000-0000-000000000201',.95,
    '2026-07-12 12:01:00+00','receptive'
  )->>'completed')::integer,
  0,
  'Receptive evidence cannot complete independent production'
);
select is(
  (public.advance_student_learning_path(
    '67000000-0000-0000-0000-000000000001',
    '67000000-0000-0000-0000-000000000201',.84,
    '2026-07-12 12:02:00+00','independent_production'
  )->>'completed')::integer,
  0,
  'Matching but sub-threshold evidence does not complete a step'
);
select is(
  (public.advance_student_learning_path(
    '67000000-0000-0000-0000-000000000001',
    '67000000-0000-0000-0000-000000000201',.90,
    '2026-07-12 12:03:00+00','independent_production'
  )->>'completed')::integer,
  1,
  'Mastered independent-production evidence completes the guarded step'
);
select is(
  (select status from public.student_learning_path_steps
   where id='67000000-0000-0000-0000-000000000401'),
  'completed',
  'The matching independent step is persisted as completed'
);
select is(
  (select status from public.student_learning_path_steps
   where id='67000000-0000-0000-0000-000000000402'),
  'available',
  'Completing the guarded prerequisite unlocks its dependent'
);
select is(
  (public.advance_student_learning_path(
    '67000000-0000-0000-0000-000000000001',
    '67000000-0000-0000-0000-000000000202',.90,
    '2026-07-12 12:04:00+00','controlled_production'
  )->>'completed')::integer,
  1,
  'Typed controlled practice still completes an unguarded path step'
);
select is(
  (select status from public.student_learning_paths
   where id='67000000-0000-0000-0000-000000000302'),
  'completed',
  'The path completes after every guarded and unguarded step completes'
);
select throws_ok(
  $$select public.advance_student_learning_path(
    '67000000-0000-0000-0000-000000000001',
    '67000000-0000-0000-0000-000000000202',.9,
    '2026-07-12 12:05:00+00','invented_evidence'
  )$$,
  '22023','invalid_evidence_expectation',
  'Unknown evidence labels are rejected before path lookup'
);
select throws_ok(
  $$update public.student_learning_path_steps
    set required_evidence_expectation='invented_evidence'
    where id='67000000-0000-0000-0000-000000000402'$$,
  '23514',null,
  'The persisted evidence channel is constrained to taxonomy expectations'
);

select * from finish();
rollback;
