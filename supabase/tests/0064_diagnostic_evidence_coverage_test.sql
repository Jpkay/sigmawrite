begin;
create extension if not exists pgtap with schema extensions;
select plan(46);

select has_table('public','diagnostic_node_evidence_results','Each mastery-evidence definition has a run-local posterior');
select has_column('public','diagnostic_node_results','evidence_expectations','Observed evidence channels remain auditable');
select has_column('public','diagnostic_node_results','evidence_coverage_confirmed','Node coverage is explicit');
select has_column('public','diagnostic_node_evidence_results','mastery_evidence_id','The ledger is keyed to canonical evidence');
select has_column('public','diagnostic_node_evidence_results','distinct_item_count','Distinct-item sufficiency is tracked');
select has_column('public','diagnostic_node_evidence_results','occasion_count','Assessment occasions are tracked separately');
select has_column('public','diagnostic_node_evidence_results','observed_accuracy','Evidence accuracy is not hidden inside a mixed posterior');
select has_column('public','diagnostic_node_evidence_results','required_accuracy','Pinned success accuracy remains auditable');
select col_is_pk(
  'public','diagnostic_node_evidence_results',
  array['run_id','node_id','mastery_evidence_id'],
  'Multiple evidence definitions sharing one expectation cannot collapse together'
);
select has_function(
  'public','apply_diagnostic_graph_inference',
  array['uuid','uuid','uuid','text','numeric','numeric','boolean'],
  'Graph inference keeps its stable service contract'
);
select function_privs_are(
  'public','submit_section_diagnostic_response',
  array['uuid','uuid','uuid','uuid','uuid','uuid','text','boolean','integer','text[]','uuid'],
  'service_role',array['EXECUTE'],
  'Only the trusted service can submit diagnostic evidence'
);
select function_privs_are(
  'public','submit_section_diagnostic_response',
  array['uuid','uuid','uuid','uuid','uuid','uuid','text','boolean','integer','text[]','uuid'],
  'authenticated',array[]::text[],
  'Students cannot forge scored evidence'
);
select function_privs_are(
  'public','submit_section_diagnostic_response_unvalidated_v1',
  array['uuid','uuid','uuid','uuid','uuid','uuid','text','boolean','integer','text[]','uuid'],
  'service_role',array[]::text[],
  'The validated wrapper cannot be bypassed by the service role'
);

create temporary table fixture_item_map(
  item_id uuid primary key,
  node_id uuid not null,
  mastery_evidence_id uuid not null,
  evidence_expectation text not null,
  item_index integer not null
);
create function pg_temp.fixture_uuid(p_value integer) returns uuid
language sql immutable as $$
  select ('64000000-0000-0000-0000-'||lpad(to_hex(p_value),12,'0'))::uuid
$$;

insert into auth.users(
  id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values (
  '64000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
  'diagnostic-evidence-admin@test.local','',now(),'{}',
  '{"role":"platform_admin","display_name":"Evidence Admin"}',now(),now()
);
-- Authorization hardening deliberately ignores self-asserted signup roles.
-- Promote the fixture through the trusted profile boundary used by operators.
update public.profiles
set role='platform_admin'
where auth_user_id='64000000-0000-4000-8000-000000000001';
insert into public.ontology_versions(id,version,document_path,status,approved_at)
values(pg_temp.fixture_uuid(10),'64.0.0','tests/0064','active',now());
insert into public.taxonomy_releases(
  id,release_key,version,ontology_version_id,status,manifest,
  manifest_checksum,validation_report
) values (
  pg_temp.fixture_uuid(20),'pgtap-evidence-taxonomy','64.0.0',
  pg_temp.fixture_uuid(10),'draft','{"fixture":true}',
  'sha256:pgtap-evidence-taxonomy','{"valid":true}'
);

insert into public.competency_nodes(
  id,key,strand,label_fr,ontology_version_id,node_type,
  expectation_scope,review_status,generation_type
)
select pg_temp.fixture_uuid(100+node_number),
  'pgtap_evidence_node_'||node_number,'grammaire_syntaxe',
  'Evidence node '||node_number,pg_temp.fixture_uuid(10),'linguistic',
  case when node_number=1
    then array['receptive','controlled_production','independent_production']::text[]
    else array['receptive','controlled_production']::text[] end,
  'human_approved','human'
from generate_series(1,6) node_number;

insert into public.competency_mastery_evidence(
  id,node_id,evidence_key,observable_action_fr,modality,expectation,
  success_criteria,minimum_distinct_items,minimum_occasions,review_status
)
select pg_temp.fixture_uuid(1000+node_number*10+evidence_number),
  pg_temp.fixture_uuid(100+node_number),
  case evidence_number when 1 then 'receptive-proof' else 'controlled-proof' end,
  'Démontrer la compétence '||node_number,
  case evidence_number when 1 then 'reading' else 'writing' end,
  case evidence_number when 1 then 'receptive' else 'controlled_production' end,
  jsonb_build_object(
    'minimumAccuracy',.8,'minimumDistinctItems',3,
    'minimumOccasions',2,'unaidedTransferRequired',false
  ),3,2,'human_approved'
from generate_series(1,6) node_number
cross join generate_series(1,2) evidence_number;

insert into public.competency_mastery_evidence(
  id,node_id,evidence_key,observable_action_fr,modality,expectation,
  success_criteria,minimum_distinct_items,minimum_occasions,review_status
) values (
  pg_temp.fixture_uuid(1013),pg_temp.fixture_uuid(101),
  'independent-proof','Produire en contexte','writing','independent_production',
  '{"minimumAccuracy":0.85,"minimumDistinctItems":2,"minimumOccasions":2,"unaidedTransferRequired":true}',
  2,2,'human_approved'
);

insert into public.taxonomy_release_memberships(
  release_id,record_type,record_id,stable_key,record_version,
  record_snapshot,record_checksum
)
select pg_temp.fixture_uuid(20),'competency_node',node.id,node.key,1,
  jsonb_build_object('key',node.key,'strand',node.strand),
  'sha256:'||node.key
from public.competency_nodes node
where node.key like 'pgtap_evidence_node_%';

insert into public.taxonomy_release_memberships(
  release_id,record_type,record_id,stable_key,record_version,
  record_snapshot,record_checksum
)
select pg_temp.fixture_uuid(20),'mastery_evidence',evidence.id,
  node.key||':'||evidence.evidence_key,1,
  jsonb_build_object(
    'key',evidence.evidence_key,
    'expectation',evidence.expectation,
    'successCriteria',evidence.success_criteria
  ),'sha256:'||node.key||':'||evidence.evidence_key
from public.competency_mastery_evidence evidence
join public.competency_nodes node on node.id=evidence.node_id
where node.key like 'pgtap_evidence_node_%';

insert into public.competency_edges(
  source_node_id,target_node_id,edge_type,prerequisite_class,
  rationale,review_status,generation_type
) values
  (pg_temp.fixture_uuid(106),pg_temp.fixture_uuid(102),'prerequisite','hard','Fixture prerequisite','human_approved','human'),
  (pg_temp.fixture_uuid(106),pg_temp.fixture_uuid(101),'prerequisite','hard','Deferred prerequisite fixture','human_approved','human'),
  (pg_temp.fixture_uuid(105),pg_temp.fixture_uuid(102),'prerequisite','hard','Unpinned live edge fixture','human_approved','human');

insert into public.taxonomy_release_memberships(
  release_id,record_type,record_id,stable_key,record_version,
  record_snapshot,record_checksum
)
select pg_temp.fixture_uuid(20),'competency_edge',edge.id,
  source.key||':'||target.key||':'||edge.edge_type,1,
  jsonb_build_object(
    'source',source.key,'target',target.key,'type',edge.edge_type,
    'prerequisiteClass',edge.prerequisite_class
  ),'sha256:'||source.key||':'||target.key
from public.competency_edges edge
join public.competency_nodes source on source.id=edge.source_node_id
join public.competency_nodes target on target.id=edge.target_node_id
where source.key='pgtap_evidence_node_6'
  and target.key in ('pgtap_evidence_node_1','pgtap_evidence_node_2');

insert into fixture_item_map(
  item_id,node_id,mastery_evidence_id,evidence_expectation,item_index
)
select pg_temp.fixture_uuid(10000+node_number*100+evidence_number*10+item_index),
  pg_temp.fixture_uuid(100+node_number),
  pg_temp.fixture_uuid(1000+node_number*10+evidence_number),
  case evidence_number when 1 then 'receptive' else 'controlled_production' end,
  item_index
from generate_series(1,6) node_number
cross join generate_series(1,2) evidence_number
cross join lateral generate_series(
  1,case when node_number=2 and evidence_number=2 then 5 else 3 end
) item_index;

insert into public.competency_items(
  id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,
  correct_answer,validator_type,difficulty,generation_type,review_status,
  reviewer_profile_id,reviewed_at,qc_gates
)
select mapping.item_id,mapping.node_id,'grammaire_syntaxe',
  case mapping.evidence_expectation when 'receptive' then 'grammar_analysis' else 'writing' end,
  'shared',case mapping.evidence_expectation when 'receptive' then 'mcq' else 'short_answer' end,
  'Question '||mapping.item_id,'réponse','exact',
  case mapping.item_index when 1 then 25 when 2 then 50 when 3 then 75 else 50 end,
  'human','human_approved',
  (select id from public.profiles
   where auth_user_id='64000000-0000-4000-8000-000000000001'),now(),
  '{"gate1_schema":true,"gate1_invariants":{"ok":true},"gate2_answer_key":{"ok":true},"verdict":"needs_human_review"}'::jsonb
from fixture_item_map mapping;

insert into public.diagnostic_item_bank_releases(
  id,bank_key,version,taxonomy_release_id,status,manifest,
  manifest_checksum,validation_report
) values
  (pg_temp.fixture_uuid(30),'pgtap-complete-evidence-bank','64.0.0-complete',pg_temp.fixture_uuid(20),'draft','{"fixture":true}','sha256:complete','{"valid":true}'),
  (pg_temp.fixture_uuid(31),'pgtap-receptive-only-bank','64.0.0-incomplete',pg_temp.fixture_uuid(20),'draft','{"fixture":true}','sha256:incomplete','{"valid":true}');

insert into public.diagnostic_item_bank_memberships(
  bank_release_id,item_id,node_id,mastery_evidence_id,section_key,
  evidence_expectation,modality,prompt_family,difficulty_tier,difficulty
)
select pg_temp.fixture_uuid(30),mapping.item_id,mapping.node_id,
  mapping.mastery_evidence_id,'grammar',mapping.evidence_expectation,
  case mapping.evidence_expectation when 'receptive' then 'grammar_analysis' else 'writing' end,
  mapping.evidence_expectation||'-family-'||mapping.item_index,
  case mapping.item_index when 1 then 'foundation' when 3 then 'stretch' else 'core' end,
  case mapping.item_index when 1 then 25 when 2 then 50 when 3 then 75 else 50 end
from fixture_item_map mapping;

insert into public.diagnostic_item_bank_memberships(
  bank_release_id,item_id,node_id,mastery_evidence_id,section_key,
  evidence_expectation,modality,prompt_family,difficulty_tier,difficulty
)
select pg_temp.fixture_uuid(31),mapping.item_id,mapping.node_id,
  mapping.mastery_evidence_id,'grammar',mapping.evidence_expectation,
  'grammar_analysis','receptive-only-'||mapping.item_index,
  case mapping.item_index when 1 then 'foundation' when 3 then 'stretch' else 'core' end,
  case mapping.item_index when 1 then 25 when 2 then 50 else 75 end
from fixture_item_map mapping
where mapping.node_id=pg_temp.fixture_uuid(102)
  and mapping.evidence_expectation='receptive';

update public.taxonomy_releases set
  status='published',published_at=now(),
  published_by=(select id from public.profiles where auth_user_id='64000000-0000-4000-8000-000000000001')
where id=pg_temp.fixture_uuid(20);

select is(
  (select (section->>'confirmableNodeCount')::int
   from jsonb_array_elements(public.diagnostic_bank_readiness(
     pg_temp.fixture_uuid(20),pg_temp.fixture_uuid(31)
   )->'sections') section where section->>'key'='grammar'),
  0,
  'Three receptive items cannot make a receptive-plus-production node confirmable'
);
select is(
  (select (section->>'confirmableNodeCount')::int
   from jsonb_array_elements(public.diagnostic_bank_readiness(
     pg_temp.fixture_uuid(20),pg_temp.fixture_uuid(30)
   )->'sections') section where section->>'key'='grammar'),
  6,
  'Readiness requires the pinned three-item quota for every live evidence definition'
);

insert into public.students(id,display_name) values
  (pg_temp.fixture_uuid(4001),'Coverage learner'),
  (pg_temp.fixture_uuid(4002),'Gap learner'),
  (pg_temp.fixture_uuid(4003),'Selector learner'),
  (pg_temp.fixture_uuid(4004),'Deferred learner'),
  (pg_temp.fixture_uuid(4005),'Accuracy learner');

create function pg_temp.answer_fixture(
  p_student_id uuid,p_run_id uuid,p_item_id uuid,p_position integer,
  p_correct boolean,p_idempotency_key uuid,p_information_gain numeric default 1
) returns void language plpgsql as $$
declare
  v_run_item_id uuid:=gen_random_uuid();
  v_node_id uuid;
  v_evidence_id uuid;
  v_expectation text;
  v_dimensions text[];
begin
  select mapping.node_id,mapping.mastery_evidence_id,mapping.evidence_expectation
  into v_node_id,v_evidence_id,v_expectation
  from fixture_item_map mapping where mapping.item_id=p_item_id;
  v_dimensions:=case v_expectation
    when 'receptive' then array['receptive','written']::text[]
    else array['productive','written']::text[] end;
  insert into public.diagnostic_run_items(
    id,run_id,item_id,node_id,section_key,position,item_snapshot,information_gain
  ) values (
    v_run_item_id,p_run_id,p_item_id,v_node_id,'grammar',p_position,
    jsonb_build_object('masteryEvidenceId',v_evidence_id,'evidenceExpectation',v_expectation),
    p_information_gain
  );
  perform public.submit_section_diagnostic_response(
    p_student_id,p_run_id,v_run_item_id,p_item_id,p_idempotency_key,
    null,'réponse',p_correct,100,v_dimensions,v_evidence_id
  );
end
$$;

-- Main mixed-evidence run: two recognition successes are deliberately
-- insufficient, then all pinned quotas are filled.
insert into public.diagnostic_runs(
  id,student_id,status,taxonomy_release_id,item_bank_release_id,
  current_section,protocol_version,total_min_probes,total_max_probes
) values (
  pg_temp.fixture_uuid(5001),pg_temp.fixture_uuid(4001),'running',
  pg_temp.fixture_uuid(20),pg_temp.fixture_uuid(30),'grammar','graph-v2',8,20
);
insert into public.diagnostic_run_targets(run_id,node_id,target_reason) values
  (pg_temp.fixture_uuid(5001),pg_temp.fixture_uuid(102),'initial_scope'),
  (pg_temp.fixture_uuid(5001),pg_temp.fixture_uuid(106),'prerequisite'),
  (pg_temp.fixture_uuid(5001),pg_temp.fixture_uuid(105),'prerequisite');
insert into public.diagnostic_run_sections(
  run_id,section_key,position,status,min_probes,max_probes,min_distinct_nodes
) values(pg_temp.fixture_uuid(5001),'grammar',1,'active',1,20,1);

insert into public.diagnostic_run_items(
  id,run_id,item_id,node_id,section_key,position,item_snapshot,information_gain
) values (
  pg_temp.fixture_uuid(6001),pg_temp.fixture_uuid(5001),pg_temp.fixture_uuid(10211),
  pg_temp.fixture_uuid(102),'grammar',1,'{}',1
);
select set_config('request.jwt.claim.role','service_role',true);
select throws_ok(
  format(
    'select public.submit_section_diagnostic_response(%L,%L,%L,%L,%L,null,%L,true,100,%L,%L)',
    pg_temp.fixture_uuid(4001),pg_temp.fixture_uuid(5001),pg_temp.fixture_uuid(6001),
    pg_temp.fixture_uuid(10211),pg_temp.fixture_uuid(7001),'réponse',
    array['receptive','written']::text[],pg_temp.fixture_uuid(1022)
  ),
  'diagnostic_mastery_evidence_mismatch',
  'The RPC rejects evidence metadata not pinned to the issued item'
);
select throws_ok(
  format(
    'select public.submit_section_diagnostic_response(%L,%L,%L,%L,%L,null,%L,true,100,%L,%L)',
    pg_temp.fixture_uuid(4001),pg_temp.fixture_uuid(5001),pg_temp.fixture_uuid(6001),
    pg_temp.fixture_uuid(10211),pg_temp.fixture_uuid(7001),'réponse',
    array['productive','written']::text[],pg_temp.fixture_uuid(1021)
  ),
  'diagnostic_dimensions_mismatch',
  'The RPC derives dimensions instead of trusting arbitrary service input'
);
do $$ begin
  perform public.submit_section_diagnostic_response(
    pg_temp.fixture_uuid(4001),pg_temp.fixture_uuid(5001),pg_temp.fixture_uuid(6001),
    pg_temp.fixture_uuid(10211),pg_temp.fixture_uuid(7001),null,'réponse',true,100,
    array['receptive','written']::text[],pg_temp.fixture_uuid(1021)
  );
  perform pg_temp.answer_fixture(
    pg_temp.fixture_uuid(4001),pg_temp.fixture_uuid(5001),pg_temp.fixture_uuid(10212),
    2,true,pg_temp.fixture_uuid(7002)
  );
end $$;

select is(
  (select evidence_coverage_confirmed from public.diagnostic_node_results
   where run_id=pg_temp.fixture_uuid(5001) and node_id=pg_temp.fixture_uuid(102)),
  false,
  'Two receptive probes do not confirm a node with controlled-production evidence'
);
select is(
  (select distinct_item_count from public.diagnostic_node_evidence_results
   where run_id=pg_temp.fixture_uuid(5001)
     and mastery_evidence_id=pg_temp.fixture_uuid(1021)),
  2,
  'Two distinct issued items count as two items and two assessment occasions'
);
select is(
  (select occasion_count from public.diagnostic_node_evidence_results
   where run_id=pg_temp.fixture_uuid(5001)
     and mastery_evidence_id=pg_temp.fixture_uuid(1021)),
  2,
  'Each distinct accepted run item is one launch-time assessment occasion'
);
select is(
  (select classification from public.diagnostic_node_results
   where run_id=pg_temp.fixture_uuid(5001) and node_id=pg_temp.fixture_uuid(102)),
  'fragile',
  'Uncovered high evidence remains uncertain rather than mastered'
);
select is(
  (public.next_section_diagnostic_item(
    pg_temp.fixture_uuid(4001),pg_temp.fixture_uuid(5001),'grammar'
  )->>'evidenceExpectation'),
  'controlled_production',
  'The selector seeks the unobserved high-uncertainty evidence channel'
);

do $$ begin
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4001),pg_temp.fixture_uuid(5001),pg_temp.fixture_uuid(10213),3,true,pg_temp.fixture_uuid(7003));
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4001),pg_temp.fixture_uuid(5001),pg_temp.fixture_uuid(10221),4,true,pg_temp.fixture_uuid(7004));
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4001),pg_temp.fixture_uuid(5001),pg_temp.fixture_uuid(10222),5,true,pg_temp.fixture_uuid(7005));
end $$;
select is(
  (select evidence_coverage_confirmed from public.diagnostic_node_results
   where run_id=pg_temp.fixture_uuid(5001) and node_id=pg_temp.fixture_uuid(102)),
  false,
  'One channel with only two items still does not satisfy its pinned three-item criterion'
);
do $$ begin
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4001),pg_temp.fixture_uuid(5001),pg_temp.fixture_uuid(10223),6,true,pg_temp.fixture_uuid(7006));
end $$;
select is(
  (select evidence_coverage_confirmed from public.diagnostic_node_results
   where run_id=pg_temp.fixture_uuid(5001) and node_id=pg_temp.fixture_uuid(102)),
  true,
  'Every live evidence definition is sufficiently observed after three distinct items'
);
select is(
  (select classification from public.diagnostic_node_results
   where run_id=pg_temp.fixture_uuid(5001) and node_id=pg_temp.fixture_uuid(102)),
  'mastered',
  'A node is mastered only when every sufficient evidence posterior is high'
);
select cmp_ok(
  (select mastery_probability from public.diagnostic_node_results
   where run_id=pg_temp.fixture_uuid(5001) and node_id=pg_temp.fixture_uuid(102)),
  '>=',.85::numeric,
  'Aggregate node mastery is the weakest high evidence posterior'
);
select is(
  (select classification from public.diagnostic_node_results
   where run_id=pg_temp.fixture_uuid(5001) and node_id=pg_temp.fixture_uuid(106)),
  'mastered',
  'Only a fully mastered source creates mastered prerequisite inference'
);
select ok(
  not exists(select 1 from public.diagnostic_node_results
    where run_id=pg_temp.fixture_uuid(5001) and node_id=pg_temp.fixture_uuid(105)),
  'A live prerequisite edge outside the pinned taxonomy cannot affect inference'
);
select cmp_ok(
  (select mastery_probability from public.student_competency_estimates
   where student_id=pg_temp.fixture_uuid(4001) and node_id=pg_temp.fixture_uuid(102)),
  '>=',.85::numeric,
  'The longitudinal compatibility estimate receives conjunctive mastery only after confirmation'
);

do $$ begin
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4001),pg_temp.fixture_uuid(5001),pg_temp.fixture_uuid(10224),7,false,pg_temp.fixture_uuid(7007));
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4001),pg_temp.fixture_uuid(5001),pg_temp.fixture_uuid(10225),8,false,pg_temp.fixture_uuid(7008));
end $$;
select is(
  (select classification from public.diagnostic_node_results
   where run_id=pg_temp.fixture_uuid(5001) and node_id=pg_temp.fixture_uuid(102)),
  'fragile',
  'Later required-channel misses retract source mastery'
);
select ok(
  not exists(select 1 from public.diagnostic_node_results
    where run_id=pg_temp.fixture_uuid(5001) and node_id=pg_temp.fixture_uuid(106)
      and classification='mastered'),
  'Stale mastered prerequisite inference is retracted with its source'
);
select cmp_ok(
  (select mastery_probability from public.student_competency_estimates
   where student_id=pg_temp.fixture_uuid(4001) and node_id=pg_temp.fixture_uuid(102)),
  '<',.85::numeric,
  'Mixed aggregate BKT cannot remain exposed as longitudinal mastery'
);
select is(
  (public.submit_section_diagnostic_response(
    pg_temp.fixture_uuid(4001),pg_temp.fixture_uuid(5001),
    (select id from public.diagnostic_run_items
     where run_id=pg_temp.fixture_uuid(5001) and position=8),
    pg_temp.fixture_uuid(10225),pg_temp.fixture_uuid(7008),null,'réponse',false,100,
    array['productive','written']::text[],pg_temp.fixture_uuid(1022)
  )->>'replayed')::boolean,
  true,
  'Validated retries preserve atomic idempotency'
);
select is(
  (select direct_evidence_count from public.diagnostic_node_evidence_results
   where run_id=pg_temp.fixture_uuid(5001)
     and mastery_evidence_id=pg_temp.fixture_uuid(1022)),
  5,
  'An idempotent replay cannot double-count evidence or occasions'
);

-- Symmetric negative evidence: one wrong probe is uncertain; a gap becomes
-- missing only after every required evidence definition reaches sufficiency.
insert into public.diagnostic_runs(
  id,student_id,status,taxonomy_release_id,item_bank_release_id,current_section,protocol_version
) values(
  pg_temp.fixture_uuid(5002),pg_temp.fixture_uuid(4002),'running',
  pg_temp.fixture_uuid(20),pg_temp.fixture_uuid(30),'grammar','graph-v2'
);
insert into public.diagnostic_run_targets(run_id,node_id,target_reason)
values(pg_temp.fixture_uuid(5002),pg_temp.fixture_uuid(103),'initial_scope');
insert into public.diagnostic_run_sections(
  run_id,section_key,position,status,min_probes,max_probes,min_distinct_nodes
) values(pg_temp.fixture_uuid(5002),'grammar',1,'active',1,20,1);
do $$ begin
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4002),pg_temp.fixture_uuid(5002),pg_temp.fixture_uuid(10311),1,false,pg_temp.fixture_uuid(7101));
end $$;
select is(
  (select classification from public.diagnostic_node_results
   where run_id=pg_temp.fixture_uuid(5002) and node_id=pg_temp.fixture_uuid(103)),
  'fragile',
  'A single uncovered miss remains uncertain rather than a definitive gap'
);
do $$ begin
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4002),pg_temp.fixture_uuid(5002),pg_temp.fixture_uuid(10312),2,false,pg_temp.fixture_uuid(7102));
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4002),pg_temp.fixture_uuid(5002),pg_temp.fixture_uuid(10313),3,false,pg_temp.fixture_uuid(7103));
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4002),pg_temp.fixture_uuid(5002),pg_temp.fixture_uuid(10321),4,false,pg_temp.fixture_uuid(7104));
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4002),pg_temp.fixture_uuid(5002),pg_temp.fixture_uuid(10322),5,false,pg_temp.fixture_uuid(7105));
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4002),pg_temp.fixture_uuid(5002),pg_temp.fixture_uuid(10323),6,false,pg_temp.fixture_uuid(7106));
end $$;
select is(
  (select evidence_coverage_confirmed from public.diagnostic_node_results
   where run_id=pg_temp.fixture_uuid(5002) and node_id=pg_temp.fixture_uuid(103)),
  true,
  'A confirmed gap still requires complete live-evidence coverage'
);
select is(
  (select classification from public.diagnostic_node_results
   where run_id=pg_temp.fixture_uuid(5002) and node_id=pg_temp.fixture_uuid(103)),
  'missing',
  'Sufficient low evidence across the required channels confirms a gap'
);

-- Posterior probability alone is insufficient when observed accuracy misses
-- the pinned evidence criterion (wrong, correct, correct produces high BKT).
insert into public.diagnostic_runs(
  id,student_id,status,taxonomy_release_id,item_bank_release_id,current_section,protocol_version
) values(
  pg_temp.fixture_uuid(5005),pg_temp.fixture_uuid(4005),'running',
  pg_temp.fixture_uuid(20),pg_temp.fixture_uuid(30),'grammar','graph-v2'
);
insert into public.diagnostic_run_targets(run_id,node_id,target_reason)
values(pg_temp.fixture_uuid(5005),pg_temp.fixture_uuid(104),'initial_scope');
insert into public.diagnostic_run_sections(
  run_id,section_key,position,status,min_probes,max_probes,min_distinct_nodes
) values(pg_temp.fixture_uuid(5005),'grammar',1,'active',1,20,1);
do $$ begin
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4005),pg_temp.fixture_uuid(5005),pg_temp.fixture_uuid(10411),1,false,pg_temp.fixture_uuid(7401));
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4005),pg_temp.fixture_uuid(5005),pg_temp.fixture_uuid(10412),2,true,pg_temp.fixture_uuid(7402));
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4005),pg_temp.fixture_uuid(5005),pg_temp.fixture_uuid(10413),3,true,pg_temp.fixture_uuid(7403));
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4005),pg_temp.fixture_uuid(5005),pg_temp.fixture_uuid(10421),4,true,pg_temp.fixture_uuid(7404));
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4005),pg_temp.fixture_uuid(5005),pg_temp.fixture_uuid(10422),5,true,pg_temp.fixture_uuid(7405));
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4005),pg_temp.fixture_uuid(5005),pg_temp.fixture_uuid(10423),6,true,pg_temp.fixture_uuid(7406));
end $$;
select cmp_ok(
  (select mastery_probability from public.diagnostic_node_evidence_results
   where run_id=pg_temp.fixture_uuid(5005) and mastery_evidence_id=pg_temp.fixture_uuid(1041)),
  '>=',.85::numeric,
  'The accuracy fixture isolates a high posterior after two of three answers'
);
select is(
  (select classification from public.diagnostic_node_results
   where run_id=pg_temp.fixture_uuid(5005) and node_id=pg_temp.fixture_uuid(104)),
  'fragile',
  'Observed accuracy below the pinned criterion blocks mastery despite high BKT'
);

-- Independent production is deliberately absent from the live bank. Even
-- perfect live evidence remains an explicit verification step and cannot infer.
insert into public.diagnostic_runs(
  id,student_id,status,taxonomy_release_id,item_bank_release_id,current_section,protocol_version
) values(
  pg_temp.fixture_uuid(5004),pg_temp.fixture_uuid(4004),'running',
  pg_temp.fixture_uuid(20),pg_temp.fixture_uuid(30),'grammar','graph-v2'
);
insert into public.diagnostic_run_targets(run_id,node_id,target_reason) values
  (pg_temp.fixture_uuid(5004),pg_temp.fixture_uuid(101),'initial_scope'),
  (pg_temp.fixture_uuid(5004),pg_temp.fixture_uuid(106),'prerequisite');
insert into public.diagnostic_run_sections(
  run_id,section_key,position,status,min_probes,max_probes,min_distinct_nodes
) values(pg_temp.fixture_uuid(5004),'grammar',1,'active',1,20,1);
do $$ begin
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4004),pg_temp.fixture_uuid(5004),pg_temp.fixture_uuid(10111),1,true,pg_temp.fixture_uuid(7201));
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4004),pg_temp.fixture_uuid(5004),pg_temp.fixture_uuid(10112),2,true,pg_temp.fixture_uuid(7202));
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4004),pg_temp.fixture_uuid(5004),pg_temp.fixture_uuid(10113),3,true,pg_temp.fixture_uuid(7203));
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4004),pg_temp.fixture_uuid(5004),pg_temp.fixture_uuid(10121),4,true,pg_temp.fixture_uuid(7204));
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4004),pg_temp.fixture_uuid(5004),pg_temp.fixture_uuid(10122),5,true,pg_temp.fixture_uuid(7205));
  perform pg_temp.answer_fixture(pg_temp.fixture_uuid(4004),pg_temp.fixture_uuid(5004),pg_temp.fixture_uuid(10123),6,true,pg_temp.fixture_uuid(7206));
end $$;
select is(
  (select classification from public.diagnostic_node_results
   where run_id=pg_temp.fixture_uuid(5004) and node_id=pg_temp.fixture_uuid(101)),
  'fragile',
  'Deferred independent production is evidenced but remains explicitly unmastered'
);
select ok(
  not exists(select 1 from public.diagnostic_node_results
    where run_id=pg_temp.fixture_uuid(5004) and node_id=pg_temp.fixture_uuid(106)),
  'Deferred independent production cannot create prerequisite mastery inference'
);

-- Full selector sequence: six breadth nodes first, then two stable anchors.
insert into public.diagnostic_runs(
  id,student_id,status,taxonomy_release_id,item_bank_release_id,
  current_section,protocol_version,total_min_probes,total_max_probes
) values(
  pg_temp.fixture_uuid(5003),pg_temp.fixture_uuid(4003),'running',
  pg_temp.fixture_uuid(20),pg_temp.fixture_uuid(30),'grammar','graph-v2',8,20
);
insert into public.diagnostic_run_targets(run_id,node_id,target_reason)
select pg_temp.fixture_uuid(5003),pg_temp.fixture_uuid(100+node_number),'initial_scope'
from generate_series(1,6) node_number;
insert into public.diagnostic_run_sections(
  run_id,section_key,position,status,min_probes,max_probes,min_distinct_nodes
) values(pg_temp.fixture_uuid(5003),'grammar',1,'active',8,20,6);
create temporary table selector_outcome(
  probes integer,distinct_nodes integer,confirmed_nodes integer
);
do $$
declare
  candidate jsonb;
  probe integer;
  distinct_count integer;
  confirmed_count integer;
begin
  for probe in 1..20 loop
    candidate:=public.next_section_diagnostic_item(
      pg_temp.fixture_uuid(4003),pg_temp.fixture_uuid(5003),'grammar'
    );
    if candidate is null then raise exception 'selector_exhausted_before_confirmation'; end if;
    perform pg_temp.answer_fixture(
      pg_temp.fixture_uuid(4003),pg_temp.fixture_uuid(5003),
      (candidate->>'id')::uuid,probe,true,pg_temp.fixture_uuid(7300+probe),
      coalesce((candidate->>'informationGain')::numeric,1)
    );
    select count(distinct node_id)::int into distinct_count
    from public.diagnostic_run_items
    where run_id=pg_temp.fixture_uuid(5003) and answered_at is not null;
    select count(*)::int into confirmed_count
    from public.diagnostic_node_results
    where run_id=pg_temp.fixture_uuid(5003) and evidence_kind='direct'
      and evidence_coverage_confirmed;
    if distinct_count>=6 and confirmed_count>=2 then
      insert into selector_outcome values(probe,distinct_count,confirmed_count);
      return;
    end if;
  end loop;
  insert into selector_outcome values(20,distinct_count,confirmed_count);
end
$$;
select cmp_ok(
  (select probes from selector_outcome),'<=',20,
  'The selector reaches two evidence-complete anchors inside the section ceiling'
);
select is(
  (select distinct_nodes from selector_outcome),6,
  'The selector establishes exactly the required six-node breadth before concentrating'
);
select cmp_ok(
  (select confirmed_nodes from selector_outcome),'>=',2,
  'The focused phase confirms at least two granular nodes'
);
update public.diagnostic_run_sections set status='completed'
where run_id=pg_temp.fixture_uuid(5003) and section_key='grammar';
select is(
  public.next_section_diagnostic_item(
    pg_temp.fixture_uuid(4003),pg_temp.fixture_uuid(5003),'grammar'
  ),
  null::jsonb,
  'The database refuses to issue an item for a non-active section'
);
update public.diagnostic_run_sections set
  status='active',max_probes=(select probes from selector_outcome)
where run_id=pg_temp.fixture_uuid(5003) and section_key='grammar';
select is(
  public.next_section_diagnostic_item(
    pg_temp.fixture_uuid(4003),pg_temp.fixture_uuid(5003),'grammar'
  ),
  null::jsonb,
  'The database refuses to issue beyond the section probe ceiling'
);

select * from finish();
rollback;
