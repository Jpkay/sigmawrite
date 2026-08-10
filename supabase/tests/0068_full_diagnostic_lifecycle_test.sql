begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(45);

-- Keep populated staging state intact while reserving the exact v2 identities
-- for this transaction's production unlock fixture. The outer rollback restores
-- any unpublished candidate names and concurrent sessions never see the rename.
update public.diagnostic_item_bank_releases
set bank_key='pgtap-existing-bank-'||id::text,
    version='pgtap-existing-bank-'||id::text
where bank_key='french-diagnostic-bank-v2' and version='2.0.0'
  and status not in ('published','withdrawn');
update public.taxonomy_releases
set release_key='pgtap-existing-taxonomy-'||id::text,
    version='pgtap-existing-taxonomy-'||id::text
where release_key='french-taxonomy-v2' and version='2.0.0'
  and status not in ('published','withdrawn');

-- This fixture deliberately starts from published release artifacts and an empty
-- learner history. Every response is created by the public atomic writer after
-- the selector issues a fresh item; no response or attempt is pre-seeded.
create function pg_temp.fixture_uuid(p_value bigint) returns uuid
language sql immutable as $$
  select ('68000000-0000-0000-0000-'||lpad(to_hex(p_value),12,'0'))::uuid
$$;

create temporary table diagnostic_fixture_sections(
  section_position integer primary key,
  section_key text unique not null,
  strand text not null,
  receptive_modality text not null
) on commit drop;

insert into diagnostic_fixture_sections values
  (1,'reading_comprehension','comprehension_ecrite','reading'),
  (2,'grammar','grammaire_syntaxe','grammar_analysis'),
  (3,'spelling','orthographe_lexicale','grammar_analysis'),
  (4,'conjugation','conjugaison','grammar_analysis');

create temporary table diagnostic_fixture_items(
  item_id uuid primary key,
  node_id uuid not null,
  mastery_evidence_id uuid not null,
  section_key text not null,
  evidence_expectation text not null,
  modality text not null,
  node_number integer not null,
  evidence_number integer not null,
  item_number integer not null,
  difficulty numeric not null
) on commit drop;

insert into auth.users(
  id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values (
  '68000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
  'full-diagnostic-admin@test.local','',now(),'{}',
  '{"role":"platform_admin","display_name":"Full Diagnostic Admin"}',now(),now()
);
update public.profiles set role='platform_admin'
where auth_user_id='68000000-0000-4000-8000-000000000001';

insert into public.ontology_versions(id,version,document_path,status,approved_at)
values(pg_temp.fixture_uuid(10),'68.0.0','tests/0068','active',now());

insert into public.taxonomy_releases(
  id,release_key,version,ontology_version_id,status,manifest,
  manifest_checksum,validation_report
) values (
  pg_temp.fixture_uuid(20),
  case when exists(select 1 from public.taxonomy_releases where release_key='french-taxonomy-v2' and version='2.0.0')
    then 'pgtap-full-diagnostic-v2' else 'french-taxonomy-v2' end,
  case when exists(select 1 from public.taxonomy_releases where version='2.0.0')
    then 'pgtap-68-taxonomy-v2' else '2.0.0' end,
  pg_temp.fixture_uuid(10),'draft','{"fixture":true}',
  'sha256:809df529f0934fc8b68dcf23d00a18238a9c01490f4a985b4fa4246751a1fc4b',
  '{"valid":true}'
);

insert into public.competency_nodes(
  id,key,strand,label_fr,ontology_version_id,node_type,
  expectation_scope,review_status,generation_type
)
select pg_temp.fixture_uuid(1000+section.section_position*100+node_number),
  'pgtap_full_'||section.section_key||'_node_'||node_number,
  section.strand,
  'Full diagnostic '||section.section_key||' node '||node_number,
  pg_temp.fixture_uuid(10),'linguistic',
  array['receptive','controlled_production']::text[],
  'human_approved','human'
from diagnostic_fixture_sections section
cross join generate_series(1,6) node_number;

insert into public.competency_mastery_evidence(
  id,node_id,evidence_key,observable_action_fr,modality,expectation,
  success_criteria,minimum_distinct_items,minimum_occasions,review_status
)
select pg_temp.fixture_uuid(
    10000+section.section_position*1000+node_number*10+evidence_number
  ),
  pg_temp.fixture_uuid(1000+section.section_position*100+node_number),
  case evidence_number when 1 then 'receptive-proof' else 'controlled-proof' end,
  'Démontrer '||section.section_key||' '||node_number,
  case evidence_number when 1 then 'reading' else 'writing' end,
  case evidence_number when 1 then 'receptive' else 'controlled_production' end,
  jsonb_build_object(
    'minimumAccuracy',.8,
    'minimumDistinctItems',2,
    'minimumOccasions',2
  ),
  2,2,'human_approved'
from diagnostic_fixture_sections section
cross join generate_series(1,6) node_number
cross join generate_series(1,2) evidence_number;

insert into public.taxonomy_release_memberships(
  release_id,record_type,record_id,stable_key,record_version,
  record_snapshot,record_checksum
)
select pg_temp.fixture_uuid(20),'competency_node',node.id,node.key,1,
  jsonb_build_object('key',node.key,'strand',node.strand),
  'sha256:'||node.key
from public.competency_nodes node
where node.key like 'pgtap_full_%';

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
  ),
  'sha256:'||node.key||':'||evidence.evidence_key
from public.competency_mastery_evidence evidence
join public.competency_nodes node on node.id=evidence.node_id
where node.key like 'pgtap_full_%';

-- This pinned edge is later materialized as two learning-path steps.
insert into public.competency_edges(
  id,source_node_id,target_node_id,edge_type,prerequisite_class,
  rationale,review_status,generation_type
) values (
  pg_temp.fixture_uuid(90001),
  pg_temp.fixture_uuid(1000+2*100+3),
  pg_temp.fixture_uuid(1000+2*100+4),
  'prerequisite','hard','Full lifecycle path edge','human_approved','human'
);

insert into public.taxonomy_release_memberships(
  release_id,record_type,record_id,stable_key,record_version,
  record_snapshot,record_checksum
) values (
  pg_temp.fixture_uuid(20),'competency_edge',pg_temp.fixture_uuid(90001),
  'pgtap_full_grammar_node_3:pgtap_full_grammar_node_4:prerequisite',1,
  jsonb_build_object(
    'source','pgtap_full_grammar_node_3',
    'target','pgtap_full_grammar_node_4',
    'type','prerequisite',
    'prerequisiteClass','hard'
  ),
  'sha256:pgtap-full-path-edge'
);

-- Two nodes per section have enough items to become anchors. The other four
-- provide direct breadth without pretending that one probe confirms mastery.
insert into diagnostic_fixture_items
select pg_temp.fixture_uuid(
    100000+section.section_position*10000+node_number*100
      +evidence_number*10+item_number
  ),
  pg_temp.fixture_uuid(1000+section.section_position*100+node_number),
  pg_temp.fixture_uuid(
    10000+section.section_position*1000+node_number*10+evidence_number
  ),
  section.section_key,
  case evidence_number when 1 then 'receptive' else 'controlled_production' end,
  case evidence_number when 1 then section.receptive_modality else 'writing' end,
  node_number,evidence_number,item_number,
  case item_number when 1 then 25 else 75 end
from diagnostic_fixture_sections section
cross join generate_series(1,6) node_number
cross join generate_series(1,2) evidence_number
cross join generate_series(1,2) item_number
where node_number<=2 or (evidence_number=1 and item_number=1);

insert into public.competency_items(
  id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,
  correct_answer,validator_type,difficulty,generation_type,review_status,
  reviewer_profile_id,reviewed_at,qc_gates
)
select mapping.item_id,mapping.node_id,section.strand,mapping.modality,
  'shared','short_answer',
  'Question fraîche '||mapping.section_key||' '||mapping.node_number||' '
    ||mapping.evidence_number||' '||mapping.item_number,
  'réponse','exact',mapping.difficulty,'ai_human_reviewed','human_approved',
  (select id from public.profiles
   where auth_user_id='68000000-0000-4000-8000-000000000001'),
  now(),
  '{"gate1_schema":true,"gate1_invariants":{"ok":true},"gate2_answer_key":{"ok":true},"verdict":"needs_human_review"}'::jsonb
from diagnostic_fixture_items mapping
join diagnostic_fixture_sections section on section.section_key=mapping.section_key;

insert into public.diagnostic_item_bank_releases(
  id,bank_key,version,taxonomy_release_id,status,manifest,
  manifest_checksum,validation_report
) values (
  pg_temp.fixture_uuid(30),
  case when exists(select 1 from public.diagnostic_item_bank_releases where bank_key='french-diagnostic-bank-v2' and version='2.0.0')
    then 'pgtap-full-diagnostic-bank-v2' else 'french-diagnostic-bank-v2' end,
  case when exists(select 1 from public.diagnostic_item_bank_releases where version='2.0.0')
    then 'pgtap-68-bank-v2' else '2.0.0' end,
  pg_temp.fixture_uuid(20),'draft',
  jsonb_build_object(
    'fixture',true,'sections',4,'items',48,
    'checksum','sha256:pgtap-full-diagnostic-bank'
  ),
  'sha256:pgtap-full-diagnostic-bank','{"valid":true}'
);

insert into public.diagnostic_item_bank_memberships(
  bank_release_id,item_id,node_id,mastery_evidence_id,section_key,
  evidence_expectation,modality,prompt_family,difficulty_tier,difficulty
)
select pg_temp.fixture_uuid(30),mapping.item_id,mapping.node_id,
  mapping.mastery_evidence_id,mapping.section_key,mapping.evidence_expectation,
  mapping.modality,
  mapping.section_key||'-'||mapping.evidence_expectation||'-family-'
    ||mapping.item_number,
  case mapping.item_number when 1 then 'foundation' else 'stretch' end,
  mapping.difficulty
from diagnostic_fixture_items mapping;

update public.taxonomy_releases set
  status='published',published_at=now(),
  published_by=(select id from public.profiles
    where auth_user_id='68000000-0000-4000-8000-000000000001')
where id=pg_temp.fixture_uuid(20);

-- Publication guards added before this test accept only a validating bank whose
-- exact reviewed membership set passes structural readiness.
update public.diagnostic_item_bank_releases set status='validating'
where id=pg_temp.fixture_uuid(30);
update public.diagnostic_item_bank_releases set
  status='published',published_at=now(),
  published_by=(select id from public.profiles
    where auth_user_id='68000000-0000-4000-8000-000000000001')
where id=pg_temp.fixture_uuid(30);

insert into public.students(id,display_name,current_grade)
values(pg_temp.fixture_uuid(40),'Fresh diagnostic learner',7);
insert into public.learner_profiles(student_id,student_type,home_language,exposure)
values(pg_temp.fixture_uuid(40),'french_first_language','fr','school');
insert into public.learning_goals(
  id,student_id,goal_type,target_framework,target_level,scope,status
) values (
  pg_temp.fixture_uuid(41),pg_temp.fixture_uuid(40),'catch_up',
  'native_grade','7',
  '{"strands":["comprehension_ecrite","grammaire_syntaxe","orthographe_lexicale","conjugaison"],"mastery_threshold":0.85}',
  'active'
);

select set_config('request.jwt.claim.role','service_role',true);

select is(
  (public.student_diagnostic_requirement(pg_temp.fixture_uuid(40))->>'required')::boolean,
  true,
  'A learner with no completed run requires an initial diagnostic'
);
select is(
  public.student_diagnostic_requirement(pg_temp.fixture_uuid(40))->>'kind',
  'initial',
  'The fresh learner requirement is explicitly initial'
);
select is(
  (public.diagnostic_bank_readiness(
    pg_temp.fixture_uuid(20),pg_temp.fixture_uuid(30)
  )->>'ready')::boolean,
  true,
  'The published bank is structurally compatible with its published taxonomy'
);
select is(
  (select count(*) from jsonb_array_elements(public.diagnostic_bank_readiness(
      pg_temp.fixture_uuid(20),pg_temp.fixture_uuid(30)
    )->'sections') section
   where (section->>'ready')::boolean),
  4::bigint,
  'All four independently adaptive sections pass publication readiness'
);

insert into public.diagnostic_runs(
  id,student_id,learning_goal_id,status,run_type,trigger_reason,
  taxonomy_release_id,item_bank_release_id,protocol_version,current_section,
  total_min_probes,total_max_probes,config_snapshot,prior_state_snapshot
) values (
  pg_temp.fixture_uuid(50),pg_temp.fixture_uuid(40),pg_temp.fixture_uuid(41),
  'running','initial','no_prior_assessment',pg_temp.fixture_uuid(20),
  pg_temp.fixture_uuid(30),'graph-sections-v2','reading_comprehension',
  32,80,
  '{"uncertainty_target":0.4,"graph_coverage_target":0.7}',
  '[]'
);

insert into public.diagnostic_run_targets(run_id,node_id,target_reason)
select pg_temp.fixture_uuid(50),node.id,'initial_scope'
from public.competency_nodes node
where node.key like 'pgtap_full_%';

insert into public.diagnostic_run_sections(
  run_id,section_key,position,status,min_probes,max_probes,min_distinct_nodes,
  target_node_count,started_at
)
select pg_temp.fixture_uuid(50),section.section_key,section.section_position,
  case when section.section_position=1 then 'active' else 'pending' end,
  8,20,6,6,
  case when section.section_position=1 then now() else null end
from diagnostic_fixture_sections section;

select is(
  public.student_learning_is_unlocked(pg_temp.fixture_uuid(40)),
  false,
  'A fresh running diagnostic keeps post-assessment learning locked'
);

create function pg_temp.submit_next_probe(
  p_section_key text,p_position integer,p_retry boolean default false
) returns jsonb language plpgsql as $$
declare
  v_candidate jsonb;
  v_submission jsonb;
  v_retry jsonb;
  v_run_item_id uuid:=pg_temp.fixture_uuid(700000+p_position);
  v_idempotency_key uuid:=pg_temp.fixture_uuid(800000+p_position);
  v_item_id uuid;
  v_node_id uuid;
  v_evidence_id uuid;
  v_expectation text;
  v_modality text;
  v_dimensions text[];
begin
  v_candidate:=public.next_section_diagnostic_item(
    pg_temp.fixture_uuid(40),pg_temp.fixture_uuid(50),p_section_key
  );
  if v_candidate is null then
    raise exception 'fresh selector exhausted in section % at position %',
      p_section_key,p_position;
  end if;
  v_item_id:=(v_candidate->>'id')::uuid;
  v_node_id:=(v_candidate->>'nodeId')::uuid;
  v_evidence_id:=(v_candidate->>'masteryEvidenceId')::uuid;
  v_expectation:=v_candidate->>'evidenceExpectation';
  select modality into v_modality from public.competency_items where id=v_item_id;
  v_dimensions:=case
    when p_section_key='reading_comprehension' and v_modality='writing'
      then array['receptive','written']::text[]
    when p_section_key='reading_comprehension'
      then array['receptive']::text[]
    when v_expectation='receptive' and v_modality='reading'
      then array['receptive']::text[]
    when v_expectation='receptive'
      then array['receptive','written']::text[]
    else array['productive','written']::text[]
  end;

  insert into public.diagnostic_run_items(
    id,run_id,item_id,node_id,section_key,position,item_snapshot,
    information_gain,assigned_at
  ) values (
    v_run_item_id,pg_temp.fixture_uuid(50),v_item_id,v_node_id,p_section_key,
    p_position,v_candidate,
    coalesce((v_candidate->>'informationGain')::numeric,0),now()
  );

  v_submission:=public.submit_section_diagnostic_response(
    pg_temp.fixture_uuid(40),pg_temp.fixture_uuid(50),v_run_item_id,v_item_id,
    v_idempotency_key,null,'réponse',true,100,v_dimensions,v_evidence_id
  );
  if p_retry then
    v_retry:=public.submit_section_diagnostic_response(
      pg_temp.fixture_uuid(40),pg_temp.fixture_uuid(50),v_run_item_id,v_item_id,
      v_idempotency_key,null,'réponse',true,100,v_dimensions,v_evidence_id
    );
  end if;
  return jsonb_build_object(
    'candidate',v_candidate,'submission',v_submission,'retry',v_retry,
    'runItemId',v_run_item_id
  );
end
$$;

create temporary table fresh_diagnostic_metrics(
  section_position integer primary key,
  section_key text unique not null,
  probes integer not null,
  distinct_nodes integer not null,
  confirmed_nodes integer not null,
  selector_closed boolean not null
) on commit drop;

create temporary table fresh_retry_observation(
  replayed boolean not null,
  response_count integer not null,
  attempt_count integer not null,
  evidence_count integer not null
) on commit drop;

do $$
declare
  section_record record;
  v_result jsonb;
  v_global_position integer:=0;
  v_local_probe integer;
  v_section_probe_count integer;
  v_distinct_nodes integer;
  v_confirmed_nodes integer;
  v_resolved_nodes integer;
  v_mean_uncertainty numeric;
  v_selector_closed boolean;
begin
  for section_record in
    select * from diagnostic_fixture_sections order by section_position
  loop
    update public.diagnostic_runs
    set current_section=section_record.section_key
    where id=pg_temp.fixture_uuid(50);
    update public.diagnostic_run_sections
    set status='active',started_at=coalesce(started_at,now())
    where run_id=pg_temp.fixture_uuid(50)
      and section_key=section_record.section_key;

    for v_local_probe in 1..20 loop
      v_global_position:=v_global_position+1;
      v_result:=pg_temp.submit_next_probe(
        section_record.section_key,v_global_position,v_global_position=1
      );

      if v_global_position=1 then
        insert into fresh_retry_observation
        select
          (v_result->'retry'->>'replayed')::boolean,
          (select count(*)::int from public.diagnostic_responses
           where run_id=pg_temp.fixture_uuid(50)),
          (select count(*)::int from public.competency_attempts
           where diagnostic_run_id=pg_temp.fixture_uuid(50)),
          (select direct_evidence_count
           from public.diagnostic_node_evidence_results evidence
           where evidence.run_id=pg_temp.fixture_uuid(50)
             and evidence.node_id=(v_result->'candidate'->>'nodeId')::uuid
             and evidence.mastery_evidence_id=
               (v_result->'candidate'->>'masteryEvidenceId')::uuid);
      end if;

      select count(distinct item.node_id)::int into v_distinct_nodes
      from public.diagnostic_run_items item
      where item.run_id=pg_temp.fixture_uuid(50)
        and item.section_key=section_record.section_key
        and item.answered_at is not null;
      select count(*)::int into v_confirmed_nodes
      from public.diagnostic_node_results result
      where result.run_id=pg_temp.fixture_uuid(50)
        and result.section_key=section_record.section_key
        and result.evidence_kind='direct'
        and result.evidence_coverage_confirmed;
      if v_distinct_nodes>=6 and v_confirmed_nodes>=2 then exit; end if;
    end loop;

    if v_distinct_nodes<6 or v_confirmed_nodes<2 then
      raise exception 'section % did not establish breadth and anchors',
        section_record.section_key;
    end if;

    select count(*)::int into v_section_probe_count
    from public.diagnostic_run_items item
    where item.run_id=pg_temp.fixture_uuid(50)
      and item.section_key=section_record.section_key
      and item.answered_at is not null;

    select count(*)::int,coalesce(avg(result.uncertainty),1)
    into v_resolved_nodes,v_mean_uncertainty
    from public.diagnostic_node_results result
    where result.run_id=pg_temp.fixture_uuid(50)
      and result.section_key=section_record.section_key;

    update public.diagnostic_run_sections set
      status='completed',probe_count=v_section_probe_count,
      distinct_nodes_tested=v_distinct_nodes,
      confirmed_node_count=v_confirmed_nodes,
      resolved_node_count=v_resolved_nodes,
      mean_uncertainty=v_mean_uncertainty,
      coverage_ratio=least(1,v_resolved_nodes::numeric/6),
      confidence='high',stopping_reason='resolved',completed_at=now()
    where run_id=pg_temp.fixture_uuid(50)
      and section_key=section_record.section_key;

    v_selector_closed:=public.next_section_diagnostic_item(
      pg_temp.fixture_uuid(40),pg_temp.fixture_uuid(50),section_record.section_key
    ) is null;
    insert into fresh_diagnostic_metrics values(
      section_record.section_position,section_record.section_key,
      v_section_probe_count,
      v_distinct_nodes,v_confirmed_nodes,v_selector_closed
    );
  end loop;

  update public.diagnostic_runs set
    status='completed',completed_at=now(),current_section=null,
    stopping_reason='resolved',
    coverage_report=jsonb_build_object(
      'sections',(select jsonb_agg(to_jsonb(metric) order by section_position)
                  from fresh_diagnostic_metrics metric)
    )
  where id=pg_temp.fixture_uuid(50);
end
$$;

select is((select count(*) from fresh_diagnostic_metrics),4::bigint,
  'Every diagnostic section executed its own adaptive loop');
select ok((select bool_and(probes between 8 and 20) from fresh_diagnostic_metrics),
  'Every section stays inside its independent 8–20 probe envelope');
select ok((select bool_and(distinct_nodes=6) from fresh_diagnostic_metrics),
  'Every section establishes six-node direct breadth');
select ok((select bool_and(confirmed_nodes>=2) from fresh_diagnostic_metrics),
  'Every section confirms at least two granular evidence anchors');
select ok((select bool_and(selector_closed) from fresh_diagnostic_metrics),
  'A completed section cannot issue another item');
select is(
  (select count(*) from public.diagnostic_run_sections
   where run_id=pg_temp.fixture_uuid(50) and status='completed'),
  4::bigint,
  'All four persisted section states are complete'
);
select cmp_ok((select sum(probes)::numeric from fresh_diagnostic_metrics),'>=',32::numeric,
  'The full diagnostic cannot collapse back to fifteen questions');
select cmp_ok((select sum(probes)::numeric from fresh_diagnostic_metrics),'<=',80::numeric,
  'The full diagnostic respects the configured fatigue ceiling');
select is(
  (select probe_count from public.diagnostic_runs where id=pg_temp.fixture_uuid(50)),
  (select sum(probes)::int from fresh_diagnostic_metrics),
  'Atomic submissions maintain the authoritative run probe count'
);
select is(
  (select count(*) from public.diagnostic_responses where run_id=pg_temp.fixture_uuid(50)),
  (select sum(probes) from fresh_diagnostic_metrics),
  'Every counted probe has exactly one newly inserted response'
);
select is(
  (select count(*) from public.competency_attempts
   where diagnostic_run_id=pg_temp.fixture_uuid(50)),
  (select sum(probes) from fresh_diagnostic_metrics),
  'Every response has exactly one competency attempt'
);
select is(
  (select count(*) from public.diagnostic_run_items where run_id=pg_temp.fixture_uuid(50)),
  (select sum(probes) from fresh_diagnostic_metrics),
  'Every response originated from one freshly selected and assigned occurrence'
);
select is((select replayed from fresh_retry_observation),true,
  'An exact retry returns the idempotent replay result');
select is((select response_count from fresh_retry_observation),1,
  'The exact retry does not insert a second response');
select is((select attempt_count from fresh_retry_observation),1,
  'The exact retry does not insert a second attempt');
select is((select evidence_count from fresh_retry_observation),1,
  'The exact retry does not increment the per-evidence ledger');

select is(
  (with ranked as (
    select section_key,node_id,row_number() over(
      partition by section_key order by position
    ) probe_rank
    from public.diagnostic_run_items where run_id=pg_temp.fixture_uuid(50)
  ), section_breadth as (
    select section_key,count(distinct node_id) distinct_nodes
    from ranked where probe_rank<=6 group by section_key
  ) select count(*) from section_breadth where distinct_nodes=6),
  4::bigint,
  'The first six probes in every section establish breadth before concentration'
);
select is(
  (with ranked as (
    select section_key,node_id,row_number() over(
      partition by section_key order by position
    ) probe_rank
    from public.diagnostic_run_items where run_id=pg_temp.fixture_uuid(50)
  ), anchors as (
    select section_key,array_agg(node_id order by probe_rank) anchor_ids
    from ranked where probe_rank<=2 group by section_key
  ) select count(*) from ranked
    join anchors using(section_key)
    where probe_rank>6 and not (node_id=any(anchor_ids))),
  0::bigint,
  'After breadth, the selector concentrates only on the two stable anchors'
);
select is(
  (select sum(direct_evidence_count) from public.diagnostic_node_evidence_results
   where run_id=pg_temp.fixture_uuid(50)),
  (select sum(probes) from fresh_diagnostic_metrics),
  'Per-evidence ledgers account for every accepted fresh response'
);
select is(
  (select count(*) from public.diagnostic_node_evidence_results
   where run_id=pg_temp.fixture_uuid(50)),
  32::bigint,
  'The run retains separate evidence-definition rows instead of collapsing channels'
);
select is(
  (select count(*) from public.diagnostic_node_evidence_results
   where run_id=pg_temp.fixture_uuid(50) and classification='mastered'),
  16::bigint,
  'Both evidence definitions are mastered for each of the eight anchors'
);
select is(
  (select count(*) from public.diagnostic_node_evidence_results
   where run_id=pg_temp.fixture_uuid(50) and classification='mastered'
     and distinct_item_count>=required_distinct_items
     and occasion_count>=required_occasions
     and observed_accuracy>=required_accuracy),
  16::bigint,
  'Every mastered evidence row satisfies its pinned item, occasion, and accuracy criteria'
);
select is(
  (select count(*) from public.diagnostic_node_results
   where run_id=pg_temp.fixture_uuid(50) and evidence_kind='direct'),
  24::bigint,
  'The diagnostic records a direct result for all six nodes in every section'
);
select is(
  (select count(*) from public.diagnostic_node_results
   where run_id=pg_temp.fixture_uuid(50) and evidence_kind='direct'
     and classification='mastered'),
  8::bigint,
  'Exactly two fully evidenced nodes per section are mastered'
);
select is(
  (select count(*) from public.diagnostic_node_results
   where run_id=pg_temp.fixture_uuid(50) and evidence_kind='direct'
     and classification='fragile'),
  16::bigint,
  'Breadth-only observations remain fragile rather than becoming false gaps'
);
select is(
  (select count(*) from public.diagnostic_node_results
   where run_id=pg_temp.fixture_uuid(50) and evidence_kind='direct'
     and evidence_coverage_confirmed),
  8::bigint,
  'Coverage is confirmed only for the two evidence-complete anchors per section'
);
select is(
  (select count(*) from public.student_competency_estimates estimate
   join public.diagnostic_node_results result
     on result.run_id=pg_temp.fixture_uuid(50) and result.node_id=estimate.node_id
   where estimate.student_id=pg_temp.fixture_uuid(40)
     and not result.evidence_coverage_confirmed
     and estimate.mastery_probability>=.85),
  0::bigint,
  'Incomplete evidence cannot leak into longitudinal mastery'
);
select is(
  (select count(*)
   from public.diagnostic_run_items assigned
   join public.diagnostic_item_bank_memberships membership
     on membership.bank_release_id=pg_temp.fixture_uuid(30)
     and membership.item_id=assigned.item_id
   where assigned.run_id=pg_temp.fixture_uuid(50)
     and (
       assigned.node_id<>membership.node_id
       or assigned.section_key<>membership.section_key
       or assigned.item_snapshot->>'masteryEvidenceId'
         <>membership.mastery_evidence_id::text
     )),
  0::bigint,
  'Every frozen assignment matches the pinned bank node, section, and evidence'
);
select is(
  (select count(*) from public.diagnostic_run_items assigned
   left join public.diagnostic_responses response on response.run_item_id=assigned.id
   left join public.competency_attempts attempt
     on attempt.diagnostic_response_id=response.id
   where assigned.run_id=pg_temp.fixture_uuid(50)
     and (response.id is null or attempt.id is null)),
  0::bigint,
  'Every fresh assignment is joined to its atomic response and attempt'
);
select is(
  (select status from public.diagnostic_runs where id=pg_temp.fixture_uuid(50)),
  'completed',
  'The fresh run reaches a terminal completed state after all four sections'
);
select is(
  (select current_section from public.diagnostic_runs where id=pg_temp.fixture_uuid(50)),
  null::text,
  'A completed run has no active section'
);
select is(
  public.student_learning_is_unlocked(pg_temp.fixture_uuid(40)),
  false,
  'A terminal run alone stays locked until server finalization artifacts exist'
);

-- Path generation itself is application-side. Persist the two graph-derived
-- steps it would create together with the other service-only finalization
-- artifacts, then exercise the database evidence/progression guard.
insert into public.student_learning_paths(
  id,student_id,source_diagnostic_run_id,learning_goal_id,
  taxonomy_release_id,status,summary
) values (
  pg_temp.fixture_uuid(60),pg_temp.fixture_uuid(40),pg_temp.fixture_uuid(50),
  pg_temp.fixture_uuid(41),pg_temp.fixture_uuid(20),'active',
  '{"fixture":"fresh-full-diagnostic"}'
);

insert into public.student_reading_estimates(
  student_id,diagnostic_run_id,estimate_type,grade_min,grade_max,
  confidence,evidence_count
)
select pg_temp.fixture_uuid(40),pg_temp.fixture_uuid(50),
  'adaptive_diagnostic',6.5,7.5,'high',run.probe_count
from public.diagnostic_runs run where run.id=pg_temp.fixture_uuid(50);

insert into public.diagnostic_results(
  student_id,diagnostic_run_id,grade_min,grade_max,confidence,
  recommended_starting_level,narrative_estimate,expository_estimate,
  argumentative_estimate,source_based_estimate,completed_at
)
select pg_temp.fixture_uuid(40),pg_temp.fixture_uuid(50),6.5,7.5,'high',
  'Graph pathway',7,7,7,7,run.completed_at
from public.diagnostic_runs run where run.id=pg_temp.fixture_uuid(50);

-- A populated staging database already owns the immutable exact v2 release
-- identities. Reuse those identities for the production unlock assertion;
-- a clean test database continues to use the exact fixture created above.
do $$
declare v_taxonomy_id uuid; v_bank_id uuid;
begin
  select taxonomy.id,bank.id into v_taxonomy_id,v_bank_id
  from public.taxonomy_releases taxonomy
  join public.diagnostic_item_bank_releases bank
    on bank.taxonomy_release_id=taxonomy.id
  where taxonomy.release_key='french-taxonomy-v2'
    and taxonomy.version='2.0.0'
    and taxonomy.status='published'
    and bank.bank_key='french-diagnostic-bank-v2'
    and bank.version='2.0.0'
    and bank.status='published'
  limit 1;
  if v_taxonomy_id is not null then
    update public.diagnostic_runs
    set taxonomy_release_id=v_taxonomy_id,item_bank_release_id=v_bank_id
    where id=pg_temp.fixture_uuid(50);
    update public.student_learning_paths set taxonomy_release_id=v_taxonomy_id
    where id=pg_temp.fixture_uuid(60);
  end if;
end
$$;

select is(
  public.student_learning_is_unlocked(pg_temp.fixture_uuid(40)),
  true,
  'The fully finalized exact four-section v2 run unlocks learning'
);

insert into public.student_learning_path_steps(
  id,path_id,node_id,section_key,position,stage,mastery_snapshot,
  uncertainty_snapshot,prerequisite_node_ids,rationale_fr,status,
  required_evidence_expectation
) values
  (pg_temp.fixture_uuid(61),pg_temp.fixture_uuid(60),
   pg_temp.fixture_uuid(1000+2*100+3),'grammar',1,'consolidation',.84,1,
   '{}','Consolider le prérequis','available','controlled_production'),
  (pg_temp.fixture_uuid(62),pg_temp.fixture_uuid(60),
   pg_temp.fixture_uuid(1000+2*100+4),'grammar',2,'consolidation',.84,1,
   array[pg_temp.fixture_uuid(1000+2*100+3)],
   'Continuer après le prérequis','pending','controlled_production');

create temporary table fresh_path_observation(
  wrong_evidence_completed integer not null,
  root_completed integer not null,
  dependent_unlocked boolean not null,
  dependent_completed integer not null
) on commit drop;

insert into public.competency_items(
  id,primary_node_id,strand,modality,response_type,prompt_fr,
  correct_answer,validator_type,review_status
)
select pg_temp.fixture_uuid(8000+node_offset*10+item_number),
       pg_temp.fixture_uuid(1000+2*100+3+node_offset),
       'grammaire_syntaxe','writing','cloze',
       'Preuve contrôlée '||node_offset||'-'||item_number,
       item_number::text,'exact','human_approved'
from generate_series(0,1) node_offset
cross join generate_series(1,3) item_number;

insert into public.competency_mastery_evidence_occurrences(
  student_id,node_id,occurrence_key,source_type,source_id,item_id,
  evidence_expectation,successful,hints_used,occurred_at
)
select pg_temp.fixture_uuid(40),
       pg_temp.fixture_uuid(1000+2*100+3+node_offset),
       'pgtap-full-path-'||node_offset||'-'||item_number,
       'practice','pgtap-practice-session-'||least(item_number,2),
       pg_temp.fixture_uuid(8000+node_offset*10+item_number),
       'controlled_production',true,0,
       '2026-07-13 09:00:00+00'::timestamptz + item_number*interval '1 minute'
from generate_series(0,1) node_offset
cross join generate_series(1,3) item_number;

do $$
declare
  v_wrong jsonb;
  v_root jsonb;
  v_dependent jsonb;
begin
  v_wrong:=public.advance_student_learning_path(
    pg_temp.fixture_uuid(40),pg_temp.fixture_uuid(1000+2*100+3),.9,
    now(),'receptive'
  );
  v_root:=public.advance_student_learning_path(
    pg_temp.fixture_uuid(40),pg_temp.fixture_uuid(1000+2*100+3),.9,
    now(),'controlled_production'
  );
  v_dependent:=public.advance_student_learning_path(
    pg_temp.fixture_uuid(40),pg_temp.fixture_uuid(1000+2*100+4),.9,
    now(),'controlled_production'
  );
  insert into fresh_path_observation values(
    (v_wrong->>'completed')::int,
    (v_root->>'completed')::int,
    (select status='available' or status='completed'
     from public.student_learning_path_steps where id=pg_temp.fixture_uuid(62)),
    (v_dependent->>'completed')::int
  );
end
$$;

select is((select wrong_evidence_completed from fresh_path_observation),0,
  'A path step cannot complete from the wrong evidence expectation');
select is((select root_completed from fresh_path_observation),1,
  'Repeated matching post-diagnostic evidence completes the available root step');
select is((select dependent_unlocked from fresh_path_observation),true,
  'Completing the retained prerequisite unlocks its dependent');
select is((select dependent_completed from fresh_path_observation),1,
  'Repeated matching evidence completes the newly available dependent step');
select is(
  (select status from public.student_learning_paths where id=pg_temp.fixture_uuid(60)),
  'completed',
  'Completing every generated step completes the persisted learning path'
);
select is(
  (select source_diagnostic_run_id from public.student_learning_paths
   where id=pg_temp.fixture_uuid(60)),
  pg_temp.fixture_uuid(50),
  'The learning path remains pinned to the fresh diagnostic run'
);
select is(
  public.next_section_diagnostic_item(
    pg_temp.fixture_uuid(40),pg_temp.fixture_uuid(50),'reading_comprehension'
  ),
  null::jsonb,
  'A completed run cannot issue another diagnostic item'
);

select * from finish();
rollback;
