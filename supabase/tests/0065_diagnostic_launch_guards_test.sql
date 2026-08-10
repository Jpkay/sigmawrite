begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(17);

insert into public.students(id,display_name) values
  ('65000000-0000-0000-0000-000000000001','Diagnostic run guard'),
  ('65000000-0000-0000-0000-000000000002','Learning path guard');

-- The partial unique index is the final authority when concurrent launches
-- both pass an application-level read-before-write check.
insert into public.diagnostic_runs(
  id,student_id,status,protocol_version,started_at
) values (
  '65000000-0000-0000-0000-000000000101',
  '65000000-0000-0000-0000-000000000001',
  'running','guard-v2','2026-07-12 10:00:00+00'
);

select throws_ok(
  $$insert into public.diagnostic_runs(
      id,student_id,status,protocol_version,started_at
    ) values (
      '65000000-0000-0000-0000-000000000102',
      '65000000-0000-0000-0000-000000000001',
      'running','guard-v2','2026-07-12 10:01:00+00'
    )$$,
  '23505',null,
  'A second running diagnostic for the same student and protocol is rejected'
);

select lives_ok(
  $$insert into public.diagnostic_runs(
      id,student_id,status,protocol_version,started_at
    ) values (
      '65000000-0000-0000-0000-000000000103',
      '65000000-0000-0000-0000-000000000001',
      'running','guard-v3','2026-07-12 10:01:00+00'
    )$$,
  'A different diagnostic protocol has an independent running slot'
);

update public.diagnostic_runs set status='abandoned'
where id='65000000-0000-0000-0000-000000000101';

select lives_ok(
  $$insert into public.diagnostic_runs(
      id,student_id,status,protocol_version,started_at
    ) values (
      '65000000-0000-0000-0000-000000000104',
      '65000000-0000-0000-0000-000000000001',
      'running','guard-v2','2026-07-12 10:02:00+00'
    )$$,
  'A terminal run releases the protocol slot for a replacement'
);

select is(
  (select count(*) from public.diagnostic_runs
   where student_id='65000000-0000-0000-0000-000000000001'
     and protocol_version='guard-v2' and status='running'),
  1::bigint,
  'Exactly one replacement run is active for the guarded protocol'
);

-- Exercise the public limiter rather than inspecting its source. The two
-- scopes use the same subject but independent counters and limits.
select set_config('request.jwt.claim.sub','65000000-0000-0000-0000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);

create temporary table ordinary_rate_results(
  attempt integer primary key,allowed boolean,remaining integer,retry_after integer
) on commit drop;
insert into ordinary_rate_results
select attempt,result.allowed,result.remaining,result.retry_after_seconds
from generate_series(1,61) attempt
cross join lateral public.consume_student_action(
  case when attempt>0 then 'submit_answer' else '' end
) result;

select is(
  (select count(*) from ordinary_rate_results where allowed),60::bigint,
  'Ordinary submit_answer still allows exactly 60 calls per window'
);
select is(
  (select allowed from ordinary_rate_results where attempt=61),false,
  'Ordinary submit_answer is still denied on call 61'
);

create temporary table diagnostic_rate_results(
  attempt integer primary key,allowed boolean,remaining integer,retry_after integer
) on commit drop;
insert into diagnostic_rate_results
select attempt,result.allowed,result.remaining,result.retry_after_seconds
from generate_series(1,121) attempt
cross join lateral public.consume_student_action(
  case when attempt>0 then 'diagnostic_answer' else '' end
) result;

select is(
  (select allowed from diagnostic_rate_results where attempt=80),true,
  'The complete 80-probe diagnostic envelope is allowed'
);
select is(
  (select allowed from diagnostic_rate_results where attempt=100),true,
  'Diagnostic scope leaves room for reasonable exact retries'
);
select is(
  (select count(*) from diagnostic_rate_results where allowed),120::bigint,
  'The isolated diagnostic scope allows 120 calls per window'
);
select is(
  (select allowed from diagnostic_rate_results where attempt=121),false,
  'The diagnostic scope is denied after its bounded retry allowance'
);

-- Build an active path where a high aggregate estimate exists for a retained
-- prerequisite. That estimate must not bypass the explicit verification step.
insert into public.ontology_versions(
  id,version,document_path,status
) values (
  '65000000-0000-0000-0000-000000000201',
  'pgtap-launch-guards-v1','pgtap/launch-guards.json','active'
);
insert into public.taxonomy_releases(
  id,release_key,version,ontology_version_id,status
) values (
  '65000000-0000-0000-0000-000000000202',
  'pgtap-launch-guards','pgtap-launch-guards-v1',
  '65000000-0000-0000-0000-000000000201','draft'
);
insert into public.competency_nodes(
  id,key,strand,label_fr,review_status
) values
  ('65000000-0000-0000-0000-000000000301','pgtap_guard_prerequisite','grammaire_syntaxe','Prerequisite','human_approved'),
  ('65000000-0000-0000-0000-000000000302','pgtap_guard_dependent','grammaire_syntaxe','Dependent','human_approved'),
  ('65000000-0000-0000-0000-000000000303','pgtap_guard_pending','grammaire_syntaxe','Pending','human_approved'),
  ('65000000-0000-0000-0000-000000000304','pgtap_guard_external_prerequisite','grammaire_syntaxe','External prerequisite','human_approved'),
  ('65000000-0000-0000-0000-000000000305','pgtap_guard_skipped','grammaire_syntaxe','Skipped','human_approved');
insert into public.diagnostic_runs(
  id,student_id,status,protocol_version,taxonomy_release_id
) values (
  '65000000-0000-0000-0000-000000000401',
  '65000000-0000-0000-0000-000000000002',
  'completed','path-guard-v2','65000000-0000-0000-0000-000000000202'
);
insert into public.student_learning_paths(
  id,student_id,source_diagnostic_run_id,taxonomy_release_id,status
) values (
  '65000000-0000-0000-0000-000000000402',
  '65000000-0000-0000-0000-000000000002',
  '65000000-0000-0000-0000-000000000401',
  '65000000-0000-0000-0000-000000000202','active'
);
insert into public.student_learning_path_steps(
  id,path_id,node_id,section_key,position,stage,mastery_snapshot,
  uncertainty_snapshot,prerequisite_node_ids,rationale_fr,status
) values
  ('65000000-0000-0000-0000-000000000501','65000000-0000-0000-0000-000000000402','65000000-0000-0000-0000-000000000301','grammar',1,'verification',.99,.1,'{}','Verify prerequisite','available'),
  ('65000000-0000-0000-0000-000000000502','65000000-0000-0000-0000-000000000402','65000000-0000-0000-0000-000000000302','grammar',2,'consolidation',.5,.5,array['65000000-0000-0000-0000-000000000301']::uuid[],'Dependent step','pending'),
  ('65000000-0000-0000-0000-000000000503','65000000-0000-0000-0000-000000000402','65000000-0000-0000-0000-000000000303','grammar',3,'remediation',.2,.8,array['65000000-0000-0000-0000-000000000304']::uuid[],'Blocked pending step','pending'),
  ('65000000-0000-0000-0000-000000000505','65000000-0000-0000-0000-000000000402','65000000-0000-0000-0000-000000000305','grammar',4,'verification',.9,.1,'{}','Skipped step','skipped');
insert into public.student_competency_estimates(
  student_id,node_id,mastery_probability,uncertainty,evidence_count
) values (
  '65000000-0000-0000-0000-000000000002',
  '65000000-0000-0000-0000-000000000301',.99,.01,20
);

select set_config('request.jwt.claim.role','service_role',true);

select is(
  (public.advance_student_learning_path(
    '65000000-0000-0000-0000-000000000002',
    '65000000-0000-0000-0000-000000000303',.99
  )->>'completed')::integer,
  0,
  'High mastery cannot complete a pending step'
);
select is(
  (select status from public.student_learning_path_steps
   where id='65000000-0000-0000-0000-000000000503'),
  'pending',
  'The blocked pending step remains pending'
);
select is(
  (select status from public.student_learning_path_steps
   where id='65000000-0000-0000-0000-000000000502'),
  'pending',
  'Aggregate mastery does not bypass a retained prerequisite step'
);

select is(
  (public.advance_student_learning_path(
    '65000000-0000-0000-0000-000000000002',
    '65000000-0000-0000-0000-000000000305',.99
  )->>'completed')::integer,
  0,
  'High mastery cannot turn a skipped step into completed'
);
select is(
  (select status from public.student_learning_path_steps
   where id='65000000-0000-0000-0000-000000000505'),
  'skipped',
  'A skipped step remains skipped'
);

select is(
  public.advance_student_learning_path(
    '65000000-0000-0000-0000-000000000002',
    '65000000-0000-0000-0000-000000000301',.90
  )->>'completed',
  '1',
  'An available retained prerequisite can complete'
);
select is(
  (select status from public.student_learning_path_steps
   where id='65000000-0000-0000-0000-000000000502'),
  'available',
  'Completing the retained prerequisite unlocks its dependent'
);

select * from finish();
rollback;
