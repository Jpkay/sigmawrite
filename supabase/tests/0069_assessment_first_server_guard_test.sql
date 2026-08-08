begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

select has_function(
  'public','student_learning_is_unlocked',array['uuid'],
  'Post-diagnostic learning has a server-side gate'
);
select function_privs_are(
  'public','student_learning_is_unlocked',array['uuid'],
  'authenticated',array['EXECUTE'],
  'Authenticated students may check their own gate'
);
select function_privs_are(
  'public','student_learning_is_unlocked',array['uuid'],
  'anon',array[]::text[],
  'Anonymous callers cannot execute the gate'
);
select is(
  (select count(*) from pg_catalog.pg_policies
   where schemaname='public'
     and policyname in (
       'sessions_insert','sessions_update','answers_insert','answers_update',
       'events_insert','word_mastery_rw','reading_est_insert',
       'skill_est_insert','skill_est_update','retrieval_cards_insert',
       'retrieval_cards_update','retrieval_schedules_insert',
       'retrieval_schedules_update','competency_attempts_insert',
       'package_progress_student_write','learning_retrieval_student_write',
       'quiz_session_write','quiz_response_write'
     )
     and (
       coalesce(qual,'')||' '||coalesce(with_check,'')
     ) like '%student_learning_is_unlocked%'),
  18::bigint,
  'Every authenticated post-assessment write policy uses the server gate'
);
select is(
  (select count(*) from pg_catalog.pg_policies
   where schemaname='public'
     and tablename in (
       'reading_sessions','student_answers','student_summaries',
       'reading_session_events','student_word_mastery',
       'student_reading_estimates','student_skill_estimates',
       'retrieval_cards','retrieval_schedules','retrieval_attempts',
       'competency_attempts','student_package_progress',
       'learning_retrieval_schedules','quiz_sessions','quiz_responses'
     )
     and cmd in ('INSERT','UPDATE','DELETE','ALL')
     and (
       coalesce(qual,'')||' '||coalesce(with_check,'')
     ) not like '%student_learning_is_unlocked%'),
  0::bigint,
  'No permissive learning-write policy can OR-bypass the assessment gate'
);
select is(
  (select count(*) from pg_catalog.pg_policies
   where schemaname='public'
     and tablename in ('student_summaries','retrieval_attempts')
     and cmd in ('INSERT','UPDATE','ALL')),
  0::bigint,
  'Moderated free-text summaries and retrieval attempts remain service-only'
);
select function_privs_are(
  'public','record_interest_session',
  array['uuid','text','boolean','numeric','integer'],
  'authenticated',array[]::text[],
  'Authenticated clients cannot bypass RLS through interest evidence'
);
select function_privs_are(
  'public','schedule_package_retrieval',
  array['uuid','uuid','timestamp with time zone'],
  'authenticated',array[]::text[],
  'Authenticated clients cannot bypass RLS through package scheduling'
);
select function_privs_are(
  'public','start_generated_content_session',array['uuid','uuid'],
  'authenticated',array[]::text[],
  'Authenticated clients cannot bypass RLS through provisional serving'
);
select function_privs_are(
  'public','record_interest_session',
  array['uuid','text','boolean','numeric','integer'],
  'service_role',array['EXECUTE'],
  'The server-side reading completion path retains interest evidence access'
);

insert into auth.users(
  id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values
  (
    '69000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'assessment-owner@test.local','',now(),'{}',
    '{"role":"student","display_name":"Assessment owner"}',now(),now()
  ),
  (
    '69000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'assessment-other@test.local','',now(),'{}',
    '{"role":"student","display_name":"Assessment other"}',now(),now()
  ),
  (
    '69000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'assessment-publisher@test.local','',now(),'{}',
    '{"role":"platform_admin","display_name":"Assessment publisher"}',now(),now()
  );

update public.profiles set role='platform_admin'
where auth_user_id='69000000-0000-4000-8000-000000000003';

update public.students set id='69000000-0000-0000-0000-000000000001'
where profile_id=(
  select id from public.profiles
  where auth_user_id='69000000-0000-4000-8000-000000000001'
);
update public.students set id='69000000-0000-0000-0000-000000000002'
where profile_id=(
  select id from public.profiles
  where auth_user_id='69000000-0000-4000-8000-000000000002'
);

insert into public.ontology_versions(
  id,version,document_path,status,approved_at
) values (
  '69000000-0000-0000-0000-000000000010',
  'pgtap-access-v2','tests/0069','active',now()
);
insert into public.taxonomy_releases(
  id,release_key,version,ontology_version_id,status,manifest,
  manifest_checksum,validation_report
) values (
  '69000000-0000-0000-0000-000000000020','french-taxonomy-v2',
  '2.0.0','69000000-0000-0000-0000-000000000010','draft',
  '{"fixture":true}',
  'sha256:809df529f0934fc8b68dcf23d00a18238a9c01490f4a985b4fa4246751a1fc4b',
  '{"valid":true}'
);

create function pg_temp.assessment_uuid(p_value bigint) returns uuid
language sql immutable as $$
  select ('69000000-0000-0000-0000-'||lpad(to_hex(p_value),12,'0'))::uuid
$$;
create temporary table assessment_fixture_sections(
  section_number integer primary key,
  section_key text unique not null,
  strand text not null,
  production_node_count integer not null
) on commit drop;
insert into assessment_fixture_sections values
  (1,'reading_comprehension','comprehension_ecrite',1),
  (2,'grammar','grammaire_syntaxe',1),
  (3,'spelling','orthographe_lexicale',2),
  (4,'conjugation','conjugaison',2);

create temporary table assessment_fixture_items(
  item_id uuid primary key,
  node_id uuid not null,
  mastery_evidence_id uuid not null,
  section_key text not null,
  strand text not null,
  evidence_expectation text not null,
  modality text not null,
  item_number integer not null,
  difficulty numeric not null
) on commit drop;

insert into public.competency_nodes(
  id,key,strand,label_fr,ontology_version_id,node_type,
  expectation_scope,review_status,generation_type
)
select pg_temp.assessment_uuid(
    1000+section.section_number*100+node_number
  ),
  'pgtap_assessment_'||section.section_key||'_'||node_number,
  section.strand,'Assessment gate node '||section.section_key||' '||node_number,
  '69000000-0000-0000-0000-000000000010','linguistic',
  case when node_number<=section.production_node_count
    then array['controlled_production']::text[]
    else array['receptive']::text[] end,
  'human_approved','human'
from assessment_fixture_sections section
cross join generate_series(1,6) node_number;

insert into public.competency_mastery_evidence(
  id,node_id,evidence_key,observable_action_fr,modality,expectation,
  success_criteria,minimum_distinct_items,minimum_occasions,review_status
)
select pg_temp.assessment_uuid(
    10000+section.section_number*100+node_number
  ),
  pg_temp.assessment_uuid(1000+section.section_number*100+node_number),
  'live-proof','Démontrer la compétence',
  case when node_number<=section.production_node_count
    then 'writing' else 'reading' end,
  case when node_number<=section.production_node_count
    then 'controlled_production' else 'receptive' end,
  '{"minimumAccuracy":0.8,"minimumDistinctItems":2,"minimumOccasions":2}',
  2,2,'human_approved'
from assessment_fixture_sections section
cross join generate_series(1,6) node_number;

insert into public.taxonomy_release_memberships(
  release_id,record_type,record_id,stable_key,record_version,
  record_snapshot,record_checksum
)
select '69000000-0000-0000-0000-000000000020','competency_node',
  node.id,node.key,1,
  jsonb_build_object('key',node.key,'strand',node.strand),
  'sha256:'||node.key
from public.competency_nodes node
where node.key like 'pgtap_assessment_%';

insert into public.taxonomy_release_memberships(
  release_id,record_type,record_id,stable_key,record_version,
  record_snapshot,record_checksum
)
select '69000000-0000-0000-0000-000000000020','mastery_evidence',
  evidence.id,node.key||':'||evidence.evidence_key,1,
  jsonb_build_object(
    'key',evidence.evidence_key,
    'expectation',evidence.expectation,
    'successCriteria',evidence.success_criteria
  ),'sha256:'||node.key||':'||evidence.evidence_key
from public.competency_mastery_evidence evidence
join public.competency_nodes node on node.id=evidence.node_id
where node.key like 'pgtap_assessment_%';

insert into assessment_fixture_items
select pg_temp.assessment_uuid(
    100000+section.section_number*1000+node_number*10+item_number
  ),
  pg_temp.assessment_uuid(1000+section.section_number*100+node_number),
  pg_temp.assessment_uuid(10000+section.section_number*100+node_number),
  section.section_key,section.strand,
  case when node_number<=section.production_node_count
    then 'controlled_production' else 'receptive' end,
  case
    when node_number<=section.production_node_count then 'writing'
    when section.section_key='reading_comprehension' then 'reading'
    else 'grammar_analysis'
  end,
  item_number,case item_number when 1 then 25 else 75 end
from assessment_fixture_sections section
cross join generate_series(1,6) node_number
cross join generate_series(1,2) item_number;

insert into public.competency_items(
  id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,
  correct_answer,validator_type,difficulty,generation_type,review_status,
  reviewer_profile_id,reviewed_at,qc_gates
)
select item.item_id,item.node_id,item.strand,item.modality,'shared',
  'short_answer','Question assessment '||item.item_id,'réponse','exact',
  item.difficulty,'ai_human_reviewed','human_approved',(
    select id from public.profiles
    where auth_user_id='69000000-0000-4000-8000-000000000003'
  ),now(),
  '{"gate1_schema":true,"gate1_invariants":{"ok":true},"gate2_answer_key":{"ok":true},"verdict":"needs_human_review"}'::jsonb
from assessment_fixture_items item;

update public.taxonomy_releases set
  status='published',published_by=(
    select id from public.profiles
    where auth_user_id='69000000-0000-4000-8000-000000000003'
  ),published_at=now()
where id='69000000-0000-0000-0000-000000000020';

insert into public.diagnostic_item_bank_releases(
  id,bank_key,version,taxonomy_release_id,status,manifest,
  manifest_checksum,validation_report
) values (
  '69000000-0000-0000-0000-000000000030','french-diagnostic-bank-v2',
  '2.0.0','69000000-0000-0000-0000-000000000020','draft',
  '{"checksum":"sha256:pgtap-assessment-bank","itemCount":48}',
  'sha256:pgtap-assessment-bank','{"valid":true}'
);

insert into public.diagnostic_item_bank_memberships(
  bank_release_id,item_id,node_id,mastery_evidence_id,section_key,
  evidence_expectation,modality,prompt_family,difficulty_tier,difficulty
)
select '69000000-0000-0000-0000-000000000030',item.item_id,item.node_id,
  item.mastery_evidence_id,item.section_key,item.evidence_expectation,
  item.modality,'family-'||item.item_number,
  case item.item_number when 1 then 'foundation' else 'stretch' end,
  item.difficulty
from assessment_fixture_items item;

update public.diagnostic_item_bank_releases set status='validating'
where id='69000000-0000-0000-0000-000000000030';
update public.diagnostic_item_bank_releases set
  status='published',published_by=(
    select id from public.profiles
    where auth_user_id='69000000-0000-4000-8000-000000000003'
  ),published_at=now()
where id='69000000-0000-0000-0000-000000000030';

insert into public.learning_goals(
  id,student_id,goal_type,target_framework,target_grade,status
) values
  (
    '69000000-0000-0000-0000-000000000035',
    '69000000-0000-0000-0000-000000000001',
    'catch_up','native_grade',7,'active'
  ),
  (
    '69000000-0000-0000-0000-000000000036',
    '69000000-0000-0000-0000-000000000002',
    'catch_up','native_grade',7,'active'
  );
insert into public.diagnostic_runs(
  id,student_id,learning_goal_id,status,protocol_version,
  taxonomy_release_id,item_bank_release_id,probe_count,
  total_min_probes,total_max_probes,completed_at
) values
  (
    '69000000-0000-0000-0000-000000000040',
    '69000000-0000-0000-0000-000000000001',
    '69000000-0000-0000-0000-000000000035','completed',
    'graph-sections-v2','69000000-0000-0000-0000-000000000020',
    '69000000-0000-0000-0000-000000000030',32,32,80,
    '2026-07-12T08:00:00Z'
  ),
  (
    '69000000-0000-0000-0000-000000000041',
    '69000000-0000-0000-0000-000000000002',
    '69000000-0000-0000-0000-000000000036','completed',
    'graph-sections-v2','69000000-0000-0000-0000-000000000020',
    '69000000-0000-0000-0000-000000000030',32,32,80,
    '2026-07-12T08:00:00Z'
  );

insert into public.diagnostic_run_sections(
  run_id,section_key,position,status,min_probes,max_probes,
  min_distinct_nodes,probe_count,distinct_nodes_tested,
  completed_at
)
select '69000000-0000-0000-0000-000000000040',section_key,position,
  'completed',8,20,6,8,6,'2026-07-12T08:00:00Z'::timestamptz
from (values
  ('reading_comprehension',1),('grammar',2),('spelling',3),('conjugation',4)
) section(section_key,position);

insert into public.student_reading_estimates(
  student_id,diagnostic_run_id,estimate_type,grade_min,grade_max,
  confidence,evidence_count
) values (
  '69000000-0000-0000-0000-000000000001',
  '69000000-0000-0000-0000-000000000040','adaptive_diagnostic',
  6.5,7.5,'medium',32
);
insert into public.diagnostic_results(
  student_id,diagnostic_run_id,grade_min,grade_max,confidence,
  recommended_starting_level,narrative_estimate,expository_estimate,
  argumentative_estimate,source_based_estimate,completed_at
) values (
  '69000000-0000-0000-0000-000000000001',
  '69000000-0000-0000-0000-000000000040',6.5,7.5,'medium',
  'Graph pathway',7,7,7,7,'2026-07-12T08:00:00Z'
);
insert into public.student_learning_paths(
  id,student_id,source_diagnostic_run_id,learning_goal_id,
  taxonomy_release_id,status
) values (
  '69000000-0000-0000-0000-000000000050',
  '69000000-0000-0000-0000-000000000001',
  '69000000-0000-0000-0000-000000000040',
  '69000000-0000-0000-0000-000000000035',
  '69000000-0000-0000-0000-000000000020','active'
);

select set_config('request.jwt.claim.role','service_role',true);
select ok(
  public.student_learning_is_unlocked(
    '69000000-0000-0000-0000-000000000001'
  ),
  'A completed exact v2 run unlocks learning'
);
select is(
  public.student_learning_is_unlocked(
    '69000000-0000-0000-0000-000000000002'
  ),false,
  'A forged completed run without server finalization cannot unlock learning'
);
select is(
  public.student_learning_is_unlocked(
    '69000000-0000-0000-0000-000000000099'
  ),false,
  'No diagnostic leaves learning locked'
);

select set_config(
  'request.jwt.claim.sub','69000000-0000-4000-8000-000000000001',true
);
select set_config('request.jwt.claim.role','authenticated',true);
select ok(
  public.student_learning_is_unlocked(
    '69000000-0000-0000-0000-000000000001'
  ),
  'The student may check their own completed assessment'
);
select is(
  public.student_learning_is_unlocked(
    '69000000-0000-0000-0000-000000000002'
  ),false,
  'A student cannot check or unlock another student record'
);

select set_config('request.jwt.claim.role','',true);
select is(
  public.student_learning_is_unlocked(
    '69000000-0000-0000-0000-000000000001'
  ),false,
  'A missing JWT role fails closed instead of bypassing ownership'
);

select set_config(
  'request.jwt.claim.sub','69000000-0000-4000-8000-000000000002',true
);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select throws_ok(
  $$insert into public.student_reading_estimates(
      student_id,estimate_type,grade_min,grade_max,confidence,evidence_count
    ) values (
      '69000000-0000-0000-0000-000000000002','direct-policy-bypass',
      6,7,'low',1
    )$$,
  '42501',null,
  'A locked student cannot bypass assessment-first through the data API'
);
reset role;

select set_config(
  'request.jwt.claim.sub','69000000-0000-4000-8000-000000000001',true
);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select lives_ok(
  $$insert into public.student_reading_estimates(
      student_id,estimate_type,grade_min,grade_max,confidence,evidence_count
    ) values (
      '69000000-0000-0000-0000-000000000001','direct-policy-proof',
      6,7,'low',1
    )$$,
  'An unlocked owner retains the intended authenticated write path'
);
reset role;

select set_config('request.jwt.claim.role','service_role',true);
update public.diagnostic_run_sections set status='active',completed_at=null
where run_id='69000000-0000-0000-0000-000000000040'
  and section_key='spelling';
select is(
  public.student_learning_is_unlocked(
    '69000000-0000-0000-0000-000000000001'
  ),false,
  'All four protocol sections must be completed'
);
update public.diagnostic_run_sections
set status='completed',completed_at='2026-07-12T08:00:00Z'
where run_id='69000000-0000-0000-0000-000000000040'
  and section_key='spelling';

update public.learning_goals set status='paused'
where id='69000000-0000-0000-0000-000000000035';
select is(
  public.student_learning_is_unlocked(
    '69000000-0000-0000-0000-000000000001'
  ),false,
  'A diagnostic for a paused goal cannot unlock a different active journey'
);
update public.learning_goals set status='active'
where id='69000000-0000-0000-0000-000000000035';

update public.diagnostic_runs set status='abandoned'
where id='69000000-0000-0000-0000-000000000040';
select is(
  public.student_learning_is_unlocked(
    '69000000-0000-0000-0000-000000000001'
  ),false,
  'A non-completed v2 run does not unlock learning'
);
update public.diagnostic_runs set status='completed'
where id='69000000-0000-0000-0000-000000000040';

update public.diagnostic_item_bank_releases
set status='withdrawn',withdrawn_at=now()
where id='69000000-0000-0000-0000-000000000030';
select is(
  public.student_learning_is_unlocked(
    '69000000-0000-0000-0000-000000000001'
  ),false,
  'A withdrawn canonical bank immediately closes the learning gate'
);

select * from finish();
rollback;
