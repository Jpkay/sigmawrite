begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(11);

select has_function(
  'public','diagnostic_item_is_release_approved',array['uuid'],
  'Release-approved item semantics are centralized'
);
select has_function(
  'public','guard_diagnostic_bank_publication',array[]::text[],
  'Diagnostic bank publication has a database guard'
);
select trigger_is(
  'public','diagnostic_item_bank_releases',
  'diagnostic_bank_publication_guard','public',
  'guard_diagnostic_bank_publication',
  'Every release update crosses the publication guard'
);

create function pg_temp.publication_uuid(p_value integer) returns uuid
language sql immutable as $$
  select (
    '66000000-0000-0000-0000-'||lpad(to_hex(p_value),12,'0')
  )::uuid
$$;

insert into auth.users(
  id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values (
  '66000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated','bank-publisher@test.local','',now(),
  '{}','{"role":"platform_admin","display_name":"Bank Publisher"}',
  now(),now()
);
insert into auth.users(
  id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values (
  '66000000-0000-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated','unauthorized-reviewer@test.local','',now(),
  '{}','{"role":"teacher","display_name":"Not an item reviewer"}',
  now(),now()
);
-- Signup metadata is untrusted after migration 0077. Assign fixture roles as a
-- privileged operator would so reviewer provenance tests the intended boundary.
update public.profiles
set role='platform_admin'
where auth_user_id='66000000-0000-4000-8000-000000000001';
update public.profiles
set role='teacher'
where auth_user_id='66000000-0000-4000-8000-000000000002';

insert into public.ontology_versions(
  id,version,document_path,status,approved_at
) values (
  pg_temp.publication_uuid(10),'66.0.0','tests/0066','active',now()
);
insert into public.taxonomy_releases(
  id,release_key,version,ontology_version_id,status,manifest,
  manifest_checksum,validation_report
) values (
  pg_temp.publication_uuid(20),'pgtap-publication-taxonomy','66.0.0',
  pg_temp.publication_uuid(10),'draft','{"fixture":true}',
  'sha256:pgtap-publication-taxonomy','{"valid":true}'
);

create temporary table publication_sections(
  section_number integer primary key,
  section_key text not null,
  strand text not null,
  production_node_count integer not null
) on commit drop;
insert into publication_sections values
  (1,'reading_comprehension','comprehension_ecrite',1),
  (2,'grammar','grammaire_syntaxe',1),
  (3,'spelling','orthographe_lexicale',2),
  (4,'conjugation','conjugaison',2);

create temporary table publication_item_map(
  section_number integer not null,
  section_key text not null,
  strand text not null,
  node_number integer not null,
  node_id uuid not null,
  mastery_evidence_id uuid not null,
  evidence_expectation text not null,
  item_number integer not null,
  item_id uuid primary key
) on commit drop;

insert into public.competency_nodes(
  id,key,strand,label_fr,ontology_version_id,node_type,
  modality_scope,expectation_scope,review_status,generation_type
)
select pg_temp.publication_uuid(1000+section.section_number*100+node_number),
  'pgtap_publication_'||section.section_key||'_'||node_number,
  section.strand,'Publication node '||section.section_key||' '||node_number,
  pg_temp.publication_uuid(10),'linguistic',
  case when node_number<=section.production_node_count
    then array['writing']::text[] else array['reading']::text[] end,
  case when node_number<=section.production_node_count
    then array['controlled_production']::text[]
    else array['receptive']::text[] end,
  'human_approved','human'
from publication_sections section
cross join generate_series(1,6) node_number;

insert into public.competency_mastery_evidence(
  id,node_id,evidence_key,observable_action_fr,modality,expectation,
  success_criteria,minimum_distinct_items,minimum_occasions,review_status
)
select pg_temp.publication_uuid(
    10000+section.section_number*100+node_number
  ),
  pg_temp.publication_uuid(1000+section.section_number*100+node_number),
  'live-proof','Démontrer la compétence',
  case when node_number<=section.production_node_count
    then 'writing' else 'reading' end,
  case when node_number<=section.production_node_count
    then 'controlled_production' else 'receptive' end,
  '{"minimumAccuracy":0.8,"minimumDistinctItems":2,"minimumOccasions":2,"unaidedTransferRequired":false}',
  2,2,'human_approved'
from publication_sections section
cross join generate_series(1,6) node_number;

insert into public.taxonomy_release_memberships(
  release_id,record_type,record_id,stable_key,record_version,
  record_snapshot,record_checksum
)
select pg_temp.publication_uuid(20),'competency_node',node.id,node.key,1,
  jsonb_build_object('key',node.key,'strand',node.strand),
  'sha256:'||node.key
from public.competency_nodes node
where node.key like 'pgtap_publication_%';

insert into public.taxonomy_release_memberships(
  release_id,record_type,record_id,stable_key,record_version,
  record_snapshot,record_checksum
)
select pg_temp.publication_uuid(20),'mastery_evidence',evidence.id,
  node.key||':'||evidence.evidence_key,1,
  jsonb_build_object(
    'key',evidence.evidence_key,
    'expectation',evidence.expectation,
    'successCriteria',evidence.success_criteria
  ),'sha256:'||node.key||':'||evidence.evidence_key
from public.competency_mastery_evidence evidence
join public.competency_nodes node on node.id=evidence.node_id
where node.key like 'pgtap_publication_%';

insert into publication_item_map(
  section_number,section_key,strand,node_number,node_id,
  mastery_evidence_id,evidence_expectation,item_number,item_id
)
select section.section_number,section.section_key,section.strand,node_number,
  pg_temp.publication_uuid(1000+section.section_number*100+node_number),
  pg_temp.publication_uuid(10000+section.section_number*100+node_number),
  case when node_number<=section.production_node_count
    then 'controlled_production' else 'receptive' end,
  item_number,
  pg_temp.publication_uuid(
    100000+section.section_number*1000+node_number*10+item_number
  )
from publication_sections section
cross join generate_series(1,6) node_number
cross join generate_series(1,2) item_number;

-- Conjugation production uses the deterministic auto-approval exception.
-- Every other fixture item carries attributable human approval.
insert into public.competency_items(
  id,primary_node_id,strand,modality,learner_mode,response_type,
  prompt_fr,correct_answer,validator_type,validator_config,difficulty,
  generation_type,qc_gates,review_status,reviewer_profile_id,reviewed_at
)
select mapping.item_id,mapping.node_id,mapping.strand,
  case mapping.evidence_expectation
    when 'controlled_production' then 'writing'
    when 'receptive' then
      case mapping.section_key
        when 'reading_comprehension' then 'reading'
        else 'grammar_analysis'
      end
  end,
  'shared',
  case mapping.evidence_expectation
    when 'controlled_production' then 'short_answer' else 'mcq' end,
  'Question de publication '||mapping.item_id,
  case when mapping.section_key='conjugation'
      and mapping.evidence_expectation='controlled_production'
    then 'parle' else 'réponse' end,
  case when mapping.section_key='conjugation'
      and mapping.evidence_expectation='controlled_production'
    then 'conjugator' else 'exact' end,
  case when mapping.section_key='conjugation'
      and mapping.evidence_expectation='controlled_production'
    then '{"verb":"parler","tense":"present","person":"1s"}'::jsonb
    else null end,
  case mapping.item_number when 1 then 25 else 75 end,
  case when mapping.section_key='conjugation'
      and mapping.evidence_expectation='controlled_production'
    then 'ai' else 'ai_human_reviewed' end,
  case when mapping.section_key='conjugation'
      and mapping.evidence_expectation='controlled_production'
    then '{
      "gate0_computed":{"applied":true,"correctedAnswer":"parle"},
      "gate1_schema":true,
      "gate1_invariants":{"ok":true,"violations":[]},
      "gate2_answer_key":{"ok":true},
      "verdict":"auto_approved"
    }'::jsonb
    else '{
      "gate1_schema":true,
      "gate1_invariants":{"ok":true,"violations":[]},
      "gate2_answer_key":{"ok":true},
      "verdict":"needs_human_review"
    }'::jsonb end,
  case when mapping.section_key='conjugation'
      and mapping.evidence_expectation='controlled_production'
    then 'auto_approved' else 'human_approved' end,
  case when mapping.section_key='conjugation'
      and mapping.evidence_expectation='controlled_production'
    then null else (
      select id from public.profiles
      where auth_user_id='66000000-0000-4000-8000-000000000001'
    ) end,
  case when mapping.section_key='conjugation'
      and mapping.evidence_expectation='controlled_production'
    then null else now() end
from publication_item_map mapping;

insert into public.taxonomy_releases(
  id,release_key,version,ontology_version_id,status
) values (
  pg_temp.publication_uuid(21),'pgtap-unpublished-taxonomy','66.0.1',
  pg_temp.publication_uuid(10),'draft'
);

update public.taxonomy_releases set
  status='published',published_at=now(),
  published_by=(
    select id from public.profiles
    where auth_user_id='66000000-0000-4000-8000-000000000001'
  )
where id=pg_temp.publication_uuid(20);

insert into public.diagnostic_item_bank_releases(
  id,bank_key,version,taxonomy_release_id,status,manifest,
  manifest_checksum,validation_report
) values
  (pg_temp.publication_uuid(30),'pgtap-publication-complete','66.0.0-complete',pg_temp.publication_uuid(20),'validating','{"checksum":"sha256:complete","itemCount":48}','sha256:complete','{"valid":true}'),
  (pg_temp.publication_uuid(31),'pgtap-publication-incomplete','66.0.0-incomplete',pg_temp.publication_uuid(20),'validating','{"checksum":"sha256:incomplete","itemCount":12}','sha256:incomplete','{"valid":true}'),
  (pg_temp.publication_uuid(32),'pgtap-publication-unreviewed','66.0.0-unreviewed',pg_temp.publication_uuid(20),'validating','{"checksum":"sha256:unreviewed","itemCount":49}','sha256:unreviewed','{"valid":true}'),
  (pg_temp.publication_uuid(33),'pgtap-publication-unsupported','66.0.0-unsupported',pg_temp.publication_uuid(20),'validating','{"checksum":"sha256:unsupported","itemCount":49}','sha256:unsupported','{"valid":true}'),
  (pg_temp.publication_uuid(34),'pgtap-publication-bad-auto','66.0.0-bad-auto',pg_temp.publication_uuid(20),'validating','{"checksum":"sha256:bad-auto","itemCount":49}','sha256:bad-auto','{"valid":true}'),
  (pg_temp.publication_uuid(35),'pgtap-publication-invalid','66.0.0-invalid',pg_temp.publication_uuid(20),'validating','{"checksum":"sha256:invalid","itemCount":48}','sha256:invalid','{"valid":false}'),
  (pg_temp.publication_uuid(36),'pgtap-publication-no-metadata','66.0.0-no-metadata',pg_temp.publication_uuid(20),'validating','{}',null,null),
  (pg_temp.publication_uuid(37),'pgtap-publication-unpublished-taxonomy','66.0.0-unpublished-taxonomy',pg_temp.publication_uuid(21),'validating','{"checksum":"sha256:unpublished","itemCount":0}','sha256:unpublished','{"valid":true}'),
  (pg_temp.publication_uuid(38),'pgtap-publication-bad-response','66.0.0-bad-response',pg_temp.publication_uuid(20),'validating','{"checksum":"sha256:bad-response","itemCount":49}','sha256:bad-response','{"valid":true}'),
  (pg_temp.publication_uuid(39),'pgtap-publication-bad-qc','66.0.0-bad-qc',pg_temp.publication_uuid(20),'validating','{"checksum":"sha256:bad-qc","itemCount":49}','sha256:bad-qc','{"valid":true}'),
  (pg_temp.publication_uuid(40),'pgtap-publication-unauthorized-reviewer','66.0.0-unauthorized-reviewer',pg_temp.publication_uuid(20),'validating','{"checksum":"sha256:unauthorized-reviewer","itemCount":49}','sha256:unauthorized-reviewer','{"valid":true}');

select throws_ok(
  $$insert into public.diagnostic_item_bank_releases(
      id,bank_key,version,taxonomy_release_id,status,manifest,
      manifest_checksum,validation_report,published_by,published_at
    ) values (
      pg_temp.publication_uuid(41),'pgtap-publication-direct-insert',
      '66.0.0-direct-insert',pg_temp.publication_uuid(20),'published',
      '{"checksum":"sha256:direct-insert","itemCount":48}',
      'sha256:direct-insert','{"valid":true}',
      (select id from public.profiles
       where auth_user_id='66000000-0000-4000-8000-000000000001'),now()
    )$$,
  'diagnostic_bank_must_publish_from_mutable_release',
  'A release cannot bypass readiness by inserting directly as published'
);

-- Every behavioral bank except the deliberately incomplete one begins with
-- the complete, release-approved membership set.
insert into public.diagnostic_item_bank_memberships(
  bank_release_id,item_id,node_id,mastery_evidence_id,section_key,
  evidence_expectation,modality,prompt_family,difficulty_tier,difficulty
)
select bank.bank_release_id,mapping.item_id,mapping.node_id,
  mapping.mastery_evidence_id,mapping.section_key,
  mapping.evidence_expectation,
  case mapping.evidence_expectation
    when 'controlled_production' then 'writing'
    when 'receptive' then
      case mapping.section_key
        when 'reading_comprehension' then 'reading'
        else 'grammar_analysis'
      end
  end,
  'family-'||mapping.item_number,
  case mapping.item_number when 1 then 'foundation' else 'stretch' end,
  case mapping.item_number when 1 then 25 else 75 end
from publication_item_map mapping
cross join (values
  (pg_temp.publication_uuid(30)),
  (pg_temp.publication_uuid(32)),
  (pg_temp.publication_uuid(33)),
  (pg_temp.publication_uuid(34)),
  (pg_temp.publication_uuid(35)),
  (pg_temp.publication_uuid(36)),
  (pg_temp.publication_uuid(38)),
  (pg_temp.publication_uuid(39)),
  (pg_temp.publication_uuid(40))
) bank(bank_release_id);

insert into public.diagnostic_item_bank_memberships(
  bank_release_id,item_id,node_id,mastery_evidence_id,section_key,
  evidence_expectation,modality,prompt_family,difficulty_tier,difficulty
)
select pg_temp.publication_uuid(31),mapping.item_id,mapping.node_id,
  mapping.mastery_evidence_id,mapping.section_key,
  mapping.evidence_expectation,
  case mapping.evidence_expectation
    when 'controlled_production' then 'writing' else 'reading' end,
  'family-'||mapping.item_number,
  case mapping.item_number when 1 then 'foundation' else 'stretch' end,
  case mapping.item_number when 1 then 25 else 75 end
from publication_item_map mapping
where mapping.section_key='reading_comprehension';

-- Three distinct failure modes are hidden behind otherwise complete banks.
insert into public.competency_items(
  id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,
  correct_answer,validator_type,validator_config,difficulty,
  generation_type,qc_gates,review_status,reviewer_profile_id,reviewed_at
) values
  (pg_temp.publication_uuid(9001),pg_temp.publication_uuid(1101),'comprehension_ecrite','writing','shared','short_answer','Unreviewed extra','réponse','exact',null,50,'ai','{"gate1_schema":true,"gate1_invariants":{"ok":true},"gate2_answer_key":{"ok":true},"verdict":"needs_human_review"}','needs_human_review',null,null),
  (pg_temp.publication_uuid(9002),pg_temp.publication_uuid(1101),'comprehension_ecrite','writing','shared','short_answer','Unsupported extra','réponse','llm_assisted',null,50,'ai_human_reviewed','{"gate1_schema":true,"gate1_invariants":{"ok":true},"gate2_answer_key":{"ok":true},"verdict":"needs_human_review"}','human_approved',(select id from public.profiles where auth_user_id='66000000-0000-4000-8000-000000000001'),now()),
  (pg_temp.publication_uuid(9003),pg_temp.publication_uuid(1101),'comprehension_ecrite','writing','shared','short_answer','Irreproducible conjugation','parle','conjugator','{"verb":"parler","tense":"present","person":"1s"}',50,'ai','{"gate0_computed":{"applied":true,"correctedAnswer":"parles"},"gate1_schema":true,"gate1_invariants":{"ok":true},"gate2_answer_key":{"ok":true},"verdict":"auto_approved"}','auto_approved',null,null),
  (pg_temp.publication_uuid(9004),pg_temp.publication_uuid(1101),'comprehension_ecrite','writing','shared','mcq','Disguised recognition item','réponse','exact',null,50,'ai_human_reviewed','{"gate1_schema":true,"gate1_invariants":{"ok":true},"gate2_answer_key":{"ok":true},"verdict":"needs_human_review"}','human_approved',(select id from public.profiles where auth_user_id='66000000-0000-4000-8000-000000000001'),now()),
  (pg_temp.publication_uuid(9005),pg_temp.publication_uuid(1101),'comprehension_ecrite','writing','shared','short_answer','Missing hard gates','réponse','exact',null,50,'ai_human_reviewed',null,'human_approved',(select id from public.profiles where auth_user_id='66000000-0000-4000-8000-000000000001'),now()),
  (pg_temp.publication_uuid(9006),pg_temp.publication_uuid(1101),'comprehension_ecrite','writing','shared','short_answer','Unauthorized reviewer','réponse','exact',null,50,'ai_human_reviewed','{"gate1_schema":true,"gate1_invariants":{"ok":true},"gate2_answer_key":{"ok":true},"verdict":"needs_human_review"}','human_approved',(select id from public.profiles where auth_user_id='66000000-0000-4000-8000-000000000002'),now());

insert into public.diagnostic_item_bank_memberships(
  bank_release_id,item_id,node_id,mastery_evidence_id,section_key,
  evidence_expectation,modality,prompt_family,difficulty_tier,difficulty
) values
  (pg_temp.publication_uuid(32),pg_temp.publication_uuid(9001),pg_temp.publication_uuid(1101),pg_temp.publication_uuid(10101),'reading_comprehension','controlled_production','writing','unreviewed-extra','core',50),
  (pg_temp.publication_uuid(33),pg_temp.publication_uuid(9002),pg_temp.publication_uuid(1101),pg_temp.publication_uuid(10101),'reading_comprehension','controlled_production','writing','unsupported-extra','core',50),
  (pg_temp.publication_uuid(34),pg_temp.publication_uuid(9003),pg_temp.publication_uuid(1101),pg_temp.publication_uuid(10101),'reading_comprehension','controlled_production','writing','bad-auto-extra','core',50),
  (pg_temp.publication_uuid(38),pg_temp.publication_uuid(9004),pg_temp.publication_uuid(1101),pg_temp.publication_uuid(10101),'reading_comprehension','controlled_production','writing','bad-response-extra','core',50),
  (pg_temp.publication_uuid(39),pg_temp.publication_uuid(9005),pg_temp.publication_uuid(1101),pg_temp.publication_uuid(10101),'reading_comprehension','controlled_production','writing','bad-qc-extra','core',50),
  (pg_temp.publication_uuid(40),pg_temp.publication_uuid(9006),pg_temp.publication_uuid(1101),pg_temp.publication_uuid(10101),'reading_comprehension','controlled_production','writing','unauthorized-reviewer-extra','core',50);

select ok(
  (public.diagnostic_bank_readiness(
    pg_temp.publication_uuid(20),pg_temp.publication_uuid(30)
  )->>'ready')::boolean,
  'A complete validating bank is structurally ready before publication'
);
select ok(
  (select bool_and(public.diagnostic_item_is_release_approved(item_id))
   from public.diagnostic_item_bank_memberships
   where bank_release_id=pg_temp.publication_uuid(30)),
  'Every complete-bank membership is independently release-approved'
);
select is(
  (select count(*) from public.diagnostic_item_bank_memberships membership
   join public.competency_items item on item.id=membership.item_id
   where membership.bank_release_id=pg_temp.publication_uuid(30)
     and item.review_status='auto_approved'
     and public.diagnostic_item_is_release_approved(item.id)),
  4::bigint,
  'SQL-verifiable deterministic conjugator items need no invented reviewer'
);

-- Partial publication (0124): readiness reports the mode and pending count,
-- pending members are tolerated, anomalies still block.
select is(
  public.diagnostic_bank_readiness(pg_temp.publication_uuid(20),pg_temp.publication_uuid(32))->>'publicationMode',
  'partial','A release with a pending member is in partial mode'
);
select is(
  (public.diagnostic_bank_readiness(pg_temp.publication_uuid(20),pg_temp.publication_uuid(32))->>'pendingItemCount')::int,
  1,'Pending members are counted'
);
select is(
  public.diagnostic_bank_readiness(pg_temp.publication_uuid(20),pg_temp.publication_uuid(30))->>'publicationMode',
  'complete','A fully reviewed release is in complete mode'
);
select throws_ok(
  $$update public.diagnostic_item_bank_releases set
      status='published',published_at=now(),
      published_by=(select id from public.profiles where auth_user_id='66000000-0000-4000-8000-000000000001')
    where id=pg_temp.publication_uuid(32)$$,
  'diagnostic_bank_not_ready',
  'A pending member does not by itself block; the section floors do'
);
select * from finish();
rollback;
