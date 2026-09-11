-- Disposable native database only. These visibly synthetic questions and review
-- identities test relational publication constraints, never pedagogical approval.
begin;
-- The owned native HTTP harness can retain only the synthetic release for its
-- subsequent authenticated requests. Default invocation still rolls back.
\if :{?fixture_seed_only}
select set_config('test.fixture_seed_only','true',true);
\endif
create temporary table fixture_nodes(key text primary key,id uuid);
create temporary table fixture_evidence(key text primary key,id uuid);
create temporary table fixture_items(key text primary key,id uuid);
do $$
declare
 payload jsonb; bundle jsonb; node jsonb; evidence jsonb; edge jsonb; entry jsonb; item jsonb; choice record;
 ontology uuid; taxonomy uuid; bank uuid; release uuid; publisher uuid; publisher_user uuid:=gen_random_uuid();
 selected_node uuid; evidence_id uuid; selected_item uuid; edge_id uuid; source_node uuid; target_node uuid;
 actual integer; expected integer; journey_state jsonb; saved jsonb; student_user uuid:=gen_random_uuid(); student uuid; session uuid;
begin
 select f.payload into strict payload from full_graph_fixture f;
 bundle:=payload->'bundle';taxonomy:=(bundle->>'taxonomyId')::uuid;bank:=(bundle->>'bankId')::uuid;
 insert into auth.users(id,email,raw_user_meta_data) values(publisher_user,'full-graph-publisher@example.invalid','{"role":"parent"}');
 update profiles set id='00000000-0000-4000-8000-000000000099',role='platform_admin' where auth_user_id=publisher_user returning id into publisher;
 insert into ontology_versions(version,document_path) values('full-graph-synthetic-test','test-only') returning id into ontology;
 insert into taxonomy_releases(id,release_key,version,ontology_version_id,status,manifest,manifest_checksum,validation_report,published_by,published_at)
 values(taxonomy,'french-taxonomy-v3','full-graph-test',ontology,'draft','{}',payload->>'taxonomyChecksum','{"valid":true}',publisher,now());
 for node in select value from jsonb_array_elements(payload#>'{taxonomy,nodes}') loop
  insert into competency_nodes(key,strand,label_fr,description_fr,ontology_version_id,node_type,modality_scope,expectation_scope,review_status,generation_type)
  values(node->>'key',node->>'strand',node->>'labelFr',node->>'descriptionFr',ontology,node->>'nodeType',
   array(select distinct value->>'modality' from jsonb_array_elements(node->'evidence') where value->>'modality'<>'multimodal'),
   array(select distinct value->>'expectation' from jsonb_array_elements(node->'evidence')),'human_approved','human')
  on conflict(key) do update set strand=excluded.strand,label_fr=excluded.label_fr,description_fr=excluded.description_fr,ontology_version_id=excluded.ontology_version_id,node_type=excluded.node_type,modality_scope=excluded.modality_scope,expectation_scope=excluded.expectation_scope,review_status=excluded.review_status
  returning id into selected_node;
  insert into fixture_nodes values(node->>'key',selected_node);
  insert into taxonomy_release_memberships(release_id,record_type,record_id,stable_key,record_version,record_snapshot,record_checksum)
  values(taxonomy,'competency_node',selected_node,node->>'key',1,node,'synthetic-test-snapshot');
  for evidence in select value from jsonb_array_elements(node->'evidence') loop
   insert into competency_mastery_evidence(node_id,evidence_key,observable_action_fr,modality,expectation,success_criteria,minimum_distinct_items,minimum_occasions,review_status)
   values(selected_node,evidence->>'key',evidence->>'actionFr',evidence->>'modality',evidence->>'expectation',evidence->'successCriteria',
    greatest(2,coalesce((evidence#>>'{successCriteria,minimumDistinctItems}')::integer,(evidence#>>'{successCriteria,minimumDistinctTexts}')::integer,2)),
    greatest(2,coalesce((evidence#>>'{successCriteria,minimumOccasions}')::integer,2)),'human_approved')
   on conflict(node_id,evidence_key) do update set observable_action_fr=excluded.observable_action_fr,modality=excluded.modality,expectation=excluded.expectation,success_criteria=excluded.success_criteria,minimum_distinct_items=excluded.minimum_distinct_items,minimum_occasions=excluded.minimum_occasions,review_status=excluded.review_status
   returning id into evidence_id;
   insert into fixture_evidence values((node->>'key')||':'||(evidence->>'key'),evidence_id);
   insert into taxonomy_release_memberships(release_id,record_type,record_id,stable_key,record_version,record_snapshot,record_checksum)
   values(taxonomy,'mastery_evidence',evidence_id,(node->>'key')||':'||(evidence->>'key'),1,evidence,'synthetic-test-snapshot');
  end loop;
 end loop;
 for edge in select value from jsonb_array_elements(payload#>'{taxonomy,edges}') loop
  select id into strict source_node from fixture_nodes where key=edge->>'source';
  select id into strict target_node from fixture_nodes where key=edge->>'target';
  insert into competency_edges(source_node_id,target_node_id,edge_type,prerequisite_class,rationale,generation_type,review_status)
  values(source_node,target_node,edge->>'type',edge->>'prerequisiteClass',edge->>'rationale','human','human_approved')
  on conflict(source_node_id,target_node_id,edge_type) do update set prerequisite_class=excluded.prerequisite_class,rationale=excluded.rationale,review_status=excluded.review_status
  returning id into edge_id;
  insert into taxonomy_release_memberships(release_id,record_type,record_id,stable_key,record_version,record_snapshot,record_checksum)
  values(taxonomy,'competency_edge',edge_id,(edge->>'source')||':'||(edge->>'target')||':'||(edge->>'type'),1,edge,'synthetic-test-snapshot');
 end loop;
 insert into diagnostic_item_bank_releases(id,bank_key,version,taxonomy_release_id,status,manifest,manifest_checksum,validation_report,published_by,published_at)
 values(bank,'synthetic-integration-only','full-graph-test',taxonomy,'draft',bundle#>'{bank,manifest}',bundle#>>'{bank,manifest,checksum}','{"valid":true}',publisher,now());
 for entry in select value from jsonb_array_elements(bundle#>'{bank,items}') loop
  item:=entry->'item';
  if (item->>'promptFr') not like 'TEST UNIQUEMENT : %' then raise exception 'Non-test question in synthetic fixture'; end if;
  select id into strict selected_node from fixture_nodes where key=item->>'nodeKey';
  select id into strict evidence_id from fixture_evidence where key=(item->>'nodeKey')||':'||(entry->>'evidenceKey');
  insert into competency_items(primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,generation_type,qc_gates,review_status,reviewer_profile_id,reviewed_at)
  values(selected_node,item->>'strand',item->>'modality',item->>'learnerMode',item->>'responseType',item->>'promptFr',item->>'instructionsFr',item->>'correctAnswer',
   array(select jsonb_array_elements_text(item->'acceptableAnswers')),item->>'validatorType',item->'validatorConfig',(item->>'difficulty')::integer,'ai_human_reviewed',entry->'qcGates','human_approved',publisher,(entry#>>'{review,reviewedAt}')::timestamptz) returning id into selected_item;
  insert into fixture_items values(entry->>'itemKey',selected_item);
  for choice in select value,ordinality from jsonb_array_elements(coalesce(item->'choices','[]'::jsonb)) with ordinality loop
   insert into competency_item_choices(item_id,choice_text,is_correct,position) values(selected_item,choice.value->>'text',(choice.value->>'correct')::boolean,choice.ordinality-1);
  end loop;
  insert into diagnostic_item_bank_memberships(bank_release_id,item_id,node_id,mastery_evidence_id,section_key,evidence_expectation,modality,prompt_family,difficulty_tier,difficulty)
  values(bank,selected_item,selected_node,evidence_id,entry->>'sectionKey',entry->>'evidenceExpectation',item->>'modality',entry->>'promptFamily',entry->>'difficultyTier',(item->>'difficulty')::integer);
  if not exists(select 1 from competency_items stored where stored.id=selected_item
   and stored.prompt_fr=item->>'promptFr' and stored.correct_answer=item->>'correctAnswer'
   and stored.validator_config is not distinct from item->'validatorConfig'
   and stored.qc_gates=entry->'qcGates' and stored.reviewer_profile_id=(entry#>>'{review,reviewerProfileId}')::uuid) then
   raise exception 'Relational item differs from the bundle';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('text',c.choice_text,'correct',c.is_correct) order by c.position),'[]'::jsonb)
  into saved from competency_item_choices c where c.item_id=selected_item;
  if saved<>coalesce(item->'choices','[]'::jsonb) then raise exception 'Relational answer choices differ from the bundle'; end if;
 end loop;
 update taxonomy_releases set status='published' where id=taxonomy;
 update diagnostic_item_bank_releases set status='published' where id=bank;
 insert into granular_assessment_releases(release_key,taxonomy_release_id,bank_release_id,status,content_checksum,bundle)
 values(coalesce(payload->>'releaseKey','full-graph-synthetic-test'),taxonomy,bank,'published',payload->>'bundleChecksum',bundle) returning id into release;
 select count(*) into actual from fixture_nodes;if actual<>181 then raise exception 'Incomplete approved graph'; end if;
 select count(*) into actual from fixture_evidence;if actual<>257 then raise exception 'Incomplete evidence definitions'; end if;
 select count(*) into actual from taxonomy_release_memberships where release_id=taxonomy and record_type='competency_edge';
 if actual<>jsonb_array_length(payload#>'{taxonomy,edges}') then raise exception 'Missing graph relationships'; end if;
 select count(*) into actual from diagnostic_item_bank_memberships where bank_release_id=bank;
 expected:=jsonb_array_length(bundle#>'{bank,items}');if actual<>expected then raise exception 'Missing question memberships'; end if;
 select r.bundle into strict saved from granular_assessment_releases r where id=release;
 if saved<>bundle then raise exception 'Full bundle changed in persistence'; end if;
 if current_setting('test.fixture_seed_only',true)='true' then return; end if;
 insert into auth.users(id,email,raw_user_meta_data) values(student_user,'full-graph-student@example.invalid','{"role":"student","display_name":"Full graph test"}');
 select s.id into strict student from students s join profiles p on p.id=s.profile_id where p.auth_user_id=student_user;
 insert into consent_records(student_id,consent_type,consent_version,privacy_policy_version) values(student,'guardian','test','test');
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 for journey_state in select value from jsonb_array_elements(payload#>'{journey,states}') loop
  if (journey_state->>'revision')::integer=0 then
   insert into granular_assessment_sessions(student_id,release_id,revision,state) values(student,release,0,journey_state) returning id into session;
  else
   update granular_assessment_sessions s set revision=(journey_state->>'revision')::integer,state=journey_state where id=session and s.revision=(journey_state->>'revision')::integer-1;
   get diagnostics actual=row_count;if actual<>1 then raise exception 'Full-graph session CAS failed'; end if;
  end if;
  select s.state into strict saved from granular_assessment_sessions s where id=session;
  if saved<>journey_state then raise exception 'Full-graph state round trip failed'; end if;
 end loop;
 if not student_granular_learning_ready(student) then raise exception 'Full-graph result did not unlock learning'; end if;
end $$;
\if :{?fixture_seed_only}
commit;
\else
\ir published-item-elo-test.sql
\ir granular-parallel-publication-test.sql
rollback;
\endif
