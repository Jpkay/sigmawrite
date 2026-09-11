-- Synthetic fixtures in a disposable database only. These publication fields
-- exercise SQL constraints; they do not represent pedagogical release approval.
begin;
do $$
declare
 user_a uuid:=gen_random_uuid(); user_b uuid:=gen_random_uuid();
 profile_a uuid; student_a uuid; student_b uuid; ontology uuid;
 taxonomy uuid; bank uuid; release uuid; session uuid;
 publisher_user uuid:=gen_random_uuid(); publisher uuid; section record; node_num integer; item_num integer;
 bad_bundle jsonb; node_id uuid; evidence_id uuid; item_id uuid; expectation text; modality text;
begin
 insert into auth.users(id,email,raw_user_meta_data) values
 (user_a,'granular-a@example.invalid','{"role":"student","display_name":"Test A"}'),
 (user_b,'granular-b@example.invalid','{"role":"student","display_name":"Test B"}');
 select p.id,s.id into strict profile_a,student_a from profiles p join students s on s.profile_id=p.id where p.auth_user_id=user_a;
 select s.id into strict student_b from profiles p join students s on s.profile_id=p.id where p.auth_user_id=user_b;
 insert into consent_records(student_id,consent_type,consent_version,privacy_policy_version)
 values(student_a,'guardian','test','test');
 insert into auth.users(id,email,raw_user_meta_data) values(publisher_user,'publisher@example.invalid','{"role":"parent"}');
 update profiles set role='platform_admin' where auth_user_id=publisher_user returning id into publisher;
 insert into ontology_versions(version,document_path) values('granular-db-test','test-only') returning id into ontology;
 insert into taxonomy_releases(release_key,version,ontology_version_id,status,manifest,manifest_checksum,validation_report,published_by,published_at)
 values('french-taxonomy-v3','granular-db-test',ontology,'draft','{}','test','{"valid":true}',publisher,now()) returning id into taxonomy;
 insert into diagnostic_item_bank_releases(bank_key,version,taxonomy_release_id,status,manifest_checksum,validation_report,published_by,published_at)
 values('granular-db-test','granular-db-test',taxonomy,'draft','test','{"valid":true}',publisher,now()) returning id into bank;
 -- Meet the real bank-publication guard with synthetic coverage in all sections.
 for section in select * from (values
  ('reading_comprehension','comprehension_ecrite'),('grammar','grammaire_syntaxe'),
  ('spelling','orthographe_lexicale'),('conjugation','conjugaison')) as sections(key,strand)
 loop
  for node_num in 1..6 loop
   expectation:=case when node_num<=2 then 'controlled_production' else 'receptive' end;
   modality:=case when node_num<=2 then 'writing' else 'reading' end;
   insert into competency_nodes(key,strand,label_fr,ontology_version_id,node_type,modality_scope,expectation_scope,review_status,generation_type)
   values('granular_fixture_'||section.key||node_num,section.strand,'Synthetic test node',ontology,'linguistic',array[modality],array[expectation],'human_approved','human') returning id into node_id;
   insert into competency_mastery_evidence(node_id,evidence_key,observable_action_fr,modality,expectation,success_criteria,minimum_distinct_items,minimum_occasions,review_status)
   values(node_id,'fixture','Synthetic SQL evidence',modality,expectation,'{"minimumAccuracy":0.8,"minimumDistinctItems":2,"minimumOccasions":2}',2,2,'human_approved') returning id into evidence_id;
   insert into taxonomy_release_memberships(release_id,record_type,record_id,stable_key,record_version,record_snapshot,record_checksum)
   values(taxonomy,'competency_node',node_id,node_id::text,1,jsonb_build_object('strand',section.strand),'test'),
    (taxonomy,'mastery_evidence',evidence_id,evidence_id::text,1,jsonb_build_object('expectation',expectation,'successCriteria',jsonb_build_object('minimumDistinctItems',2,'minimumOccasions',2)),'test');
   for item_num in 1..2 loop
    insert into competency_items(primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,correct_answer,validator_type,difficulty,generation_type,qc_gates,review_status,reviewer_profile_id,reviewed_at)
    values(node_id,section.strand,modality,'shared',case when node_num<=2 then 'short_answer' else 'mcq' end,'Synthetic database fixture','fixture','exact',case when item_num=1 then 25 else 75 end,'ai_human_reviewed',
     '{"gate1_schema":true,"gate1_invariants":{"ok":true,"violations":[]},"gate2_answer_key":{"ok":true},"verdict":"needs_human_review"}',
     'human_approved',publisher,now()) returning id into item_id;
    insert into diagnostic_item_bank_memberships(bank_release_id,item_id,node_id,mastery_evidence_id,section_key,evidence_expectation,modality,prompt_family,difficulty_tier,difficulty)
    values(bank,item_id,node_id,evidence_id,section.key,expectation,modality,'family-'||item_num,case when item_num=1 then 'foundation' else 'stretch' end,case when item_num=1 then 25 else 75 end);
   end loop;
  end loop;
 end loop;
 update taxonomy_releases set status='published' where id=taxonomy;
 update diagnostic_item_bank_releases set status='published',manifest='{"checksum":"test","itemCount":48}' where id=bank;
 for bad_bundle in select value from jsonb_array_elements('[{}, {"assessment":{"taxonomyChecksum":"other","bankChecksum":"test"}}, {"assessment":{"taxonomyChecksum":"test","bankChecksum":"other"}}]'::jsonb) loop
  begin
   insert into granular_assessment_releases(release_key,taxonomy_release_id,bank_release_id,status,content_checksum,bundle)
   values('bad-parent-version',taxonomy,bank,'published','test',bad_bundle);
   raise exception 'Invalid parent version was accepted';
  exception when raise_exception then
   if sqlerrm<>'Granular assessment parent content version mismatch' then raise; end if;
  end;
 end loop;
 insert into granular_assessment_releases(release_key,taxonomy_release_id,bank_release_id,status,content_checksum,bundle)
 values('granular-db-test',taxonomy,bank,'published','test','{"assessment":{"taxonomyChecksum":"test","bankChecksum":"test"}}') returning id into release;
 insert into granular_assessment_sessions(student_id,release_id,state)
 values(student_a,release,'{"revision":0,"phase":"assessing","paused":true,"release":{"checksum":"pinned"},"observations":[]}') returning id into session;
 perform set_config('test.student_a',student_a::text,true);
 perform set_config('test.student_b',student_b::text,true);
 perform set_config('test.user_a',user_a::text,true);
 perform set_config('test.user_b',user_b::text,true);
 perform set_config('test.session',session::text,true);
 perform set_config('test.release',release::text,true);
 perform set_config('test.bank',bank::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',user_a,'role','authenticated')::text,true);
end $$;
set local role authenticated;
do $$ begin
 if not owns_student(current_setting('test.student_a')::uuid) then raise exception 'Own student lookup failed'; end if;
 if owns_student(current_setting('test.student_b')::uuid) then raise exception 'Other student treated as own'; end if;
 if student_learning_is_unlocked(current_setting('test.student_a')::uuid) then raise exception 'Incomplete assessment unlocked learning'; end if;
 begin
  perform create_granular_learning_successor(current_setting('test.student_a')::uuid,current_setting('test.session')::uuid,0,current_setting('test.release')::uuid,'test','{}');
  raise exception 'Browser could create a learning successor';
 exception when insufficient_privilege then null; end;
 begin
  perform * from granular_assessment_sessions;
  raise exception 'Browser read of server-owned evidence allowed';
 exception when insufficient_privilege then null; end;
 begin
  perform * from granular_assessment_releases;
  raise exception 'Browser read of answer-key bundle allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role service_role;
do $$ declare changed integer; state_after jsonb; begin
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 update granular_assessment_sessions
 set revision=1,state=state||'{"revision":1,"phase":"learning","completionReason":"time_budget","teaching":{"contentId":"fixture","exerciseIndex":1}}'
 where id=current_setting('test.session')::uuid and revision=0;
 get diagnostics changed=row_count;
 if changed<>1 then raise exception 'Server save failed'; end if;
 update granular_assessment_sessions set revision=1,state=state||'{"revision":1}'
 where id=current_setting('test.session')::uuid and revision=0;
 get diagnostics changed=row_count;
 if changed<>0 then raise exception 'Stale revision overwrote progress'; end if;
 select state into strict state_after from granular_assessment_sessions where id=current_setting('test.session')::uuid;
 if state_after#>>'{teaching,exerciseIndex}'<>'1' or state_after->>'paused'<>'true' then raise exception 'Saved progress was lost'; end if;
 if not student_learning_is_unlocked(current_setting('test.student_a')::uuid) then raise exception 'Completed granular assessment did not unlock learning'; end if;
 if student_granular_learning_ready(current_setting('test.student_b')::uuid) then raise exception 'Unauthorized student gained access'; end if;
 begin
  update granular_assessment_sessions set student_id=current_setting('test.student_b')::uuid,revision=2,state=state||'{"revision":2}' where id=current_setting('test.session')::uuid;
  raise exception 'Session transferred to another student';
 exception when others then if SQLERRM<>'Session ownership and release are immutable' then raise; end if; end;
 begin
  update granular_assessment_sessions set revision=3,state=state||'{"revision":3}' where id=current_setting('test.session')::uuid;
  raise exception 'Revision skipped';
 exception when others then if SQLERRM<>'Session revision must advance exactly once' then raise; end if; end;
 begin
  update granular_assessment_releases set bundle='{"changed":true}' where id=current_setting('test.release')::uuid;
  raise exception 'Published bundle modified';
 exception when others then if SQLERRM<>'Published assessment releases are immutable' then raise; end if; end;
end $$;
reset role;
set local role authenticated;
do $$ begin
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.user_a'),'role','authenticated')::text,true);
 if not student_granular_learning_ready(current_setting('test.student_a')::uuid) then raise exception 'Owner cannot use completed assessment'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.user_b'),'role','authenticated')::text,true);
 if student_granular_learning_ready(current_setting('test.student_a')::uuid) then raise exception 'Cross-student learning access leaked'; end if;
end $$;
reset role;
-- Persist actual engine transitions over the complete approved graph. This
-- exercises state storage, not the HTTP/auth service or a full bank import;
-- parent SQL fixtures above deliberately remain synthetic constraint fixtures.
do $$
declare
 journey jsonb:=current_setting('test.journey')::jsonb;
 journey_user uuid:=gen_random_uuid(); journey_student uuid; journey_session uuid;
 next_state jsonb; stored_state jsonb; entry record; changed integer;
 taxonomy uuid; bank uuid; previous_revision integer:=-1;
begin
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 insert into auth.users(id,email,raw_user_meta_data)
 values(journey_user,'engine-journey@example.invalid','{"role":"student","display_name":"Engine fixture"}');
 select s.id into strict journey_student from students s join profiles p on p.id=s.profile_id where p.auth_user_id=journey_user;
 insert into consent_records(student_id,consent_type,consent_version,privacy_policy_version)
 values(journey_student,'guardian','test','test');
 select taxonomy_release_id,bank_release_id into strict taxonomy,bank from granular_assessment_releases where id=current_setting('test.release')::uuid;
 for entry in select value from jsonb_array_elements(journey->'states') loop
  next_state:=jsonb_set(jsonb_set(entry.value,'{release,taxonomyId}',to_jsonb(taxonomy::text)),'{release,bankId}',to_jsonb(bank::text));
  if (next_state->>'revision')::integer<>previous_revision+1 then raise exception 'Noncontiguous generated journey'; end if;
  if previous_revision=-1 then
   insert into granular_assessment_sessions(student_id,release_id,revision,state)
   values(journey_student,current_setting('test.release')::uuid,0,next_state) returning id into journey_session;
  else
   update granular_assessment_sessions set revision=previous_revision+1,state=next_state
   where id=journey_session and student_id=journey_student and revision=previous_revision;
   get diagnostics changed=row_count;
   if changed<>1 then raise exception 'Engine transition did not save'; end if;
  end if;
  select state into strict stored_state from granular_assessment_sessions where id=journey_session;
  if stored_state<>next_state then raise exception 'Engine state changed during persistence'; end if;
  if student_granular_learning_ready(journey_student)<>(next_state->>'phase'='learning') then raise exception 'Learning access disagrees with persisted engine phase'; end if;
  previous_revision:=(next_state->>'revision')::integer;
 end loop;
 if stored_state->>'completionReason'<>'time_budget' or (stored_state->>'activeSeconds')::integer<>2100 then raise exception 'Time-budget result lost'; end if;
 if jsonb_array_length(stored_state->'observations')<>12 or jsonb_array_length(stored_state->'refinements')<>1 then raise exception 'Initial or later evidence lost'; end if;
 if stored_state#>>'{refinements,0,source}'<>'learning' or stored_state->'learningCheck'<>'null'::jsonb then raise exception 'Independent check state lost'; end if;
 update granular_assessment_sessions set revision=previous_revision+1,state=stored_state||jsonb_build_object('revision',previous_revision+1)
 where id=journey_session and revision=(journey->>'issuedRevision')::integer;
 get diagnostics changed=row_count;
 if changed<>0 then raise exception 'Retry duplicated independent evidence'; end if;
end $$;
-- Successor fixtures test storage integrity, not educational compatibility.
do $$
declare
 student uuid:=current_setting('test.student_b')::uuid;
 source_release uuid:=current_setting('test.release')::uuid;
 source_id uuid; target_release uuid; successor uuid; retried uuid;
 before_state jsonb; target_state jsonb; stored jsonb; parents record;
begin
 select * into strict parents from granular_assessment_releases where id=source_release;
 insert into granular_assessment_releases(release_key,taxonomy_release_id,bank_release_id,status,content_checksum,bundle)
 values('successor-test',parents.taxonomy_release_id,parents.bank_release_id,'published','test',parents.bundle)
 returning id into target_release;
 before_state:='{"revision":0,"phase":"learning","paused":true,"completionReason":"time_budget","release":{"checksum":"old"},"observations":[{"itemId":"original","correct":false}],"diagnosticResponses":[{"itemId":"original","answer":"student text"}]}'::jsonb;
 insert into granular_assessment_sessions(student_id,release_id,state)
 values(student,source_release,before_state) returning id into source_id;
 target_state:=before_state||jsonb_build_object(
  'release',jsonb_build_object('taxonomyId',parents.taxonomy_release_id,'bankId',parents.bank_release_id,'checksum','new'),
  'lastPulseAt',null,'learningPredecessor',jsonb_build_object('sessionId',source_id,'releaseId',source_release,'revision',0),
  'diagnosticResponses',jsonb_build_array(jsonb_build_object('itemId','original','answer','student text','sourceSessionId',source_id)));
 begin
  perform create_granular_learning_successor(current_setting('test.student_a')::uuid,source_id,0,target_release,'test',target_state);
  raise exception 'Cross-student upgrade accepted';
 exception when others then if sqlerrm<>'Learning predecessor unavailable' then raise; end if; end;
 begin
  perform create_granular_learning_successor(student,source_id,1,target_release,'test',target_state);
  raise exception 'Stale upgrade accepted';
 exception when others then if sqlerrm<>'Learning predecessor revision changed' then raise; end if; end;
 begin
  perform create_granular_learning_successor(student,source_id,0,target_release,'test',target_state||'{"observations":[]}');
  raise exception 'Historical evidence rewrite accepted';
 exception when others then if sqlerrm<>'Learning successor changed historical state' then raise; end if; end;
 if exists(select 1 from granular_assessment_sessions where student_id=student and release_id=target_release) then
  raise exception 'Rejected upgrade left a partial successor'; end if;
 successor:=create_granular_learning_successor(student,source_id,0,target_release,'test',target_state);
 retried:=create_granular_learning_successor(student,source_id,0,target_release,'test',target_state);
 if successor<>retried then raise exception 'Retry forked learning'; end if;
 select state into strict stored from granular_assessment_sessions where id=source_id;
 if stored<>before_state then raise exception 'Source history changed'; end if;
 select state into strict stored from granular_assessment_sessions where id=successor;
 if stored<>target_state then raise exception 'Successor evidence changed'; end if;
 if exists(select 1 from granular_active_assessment_sessions where id=source_id)
  or not exists(select 1 from granular_active_assessment_sessions where id=successor) then
  raise exception 'Active session selection lost successor'; end if;
 begin
  update granular_assessment_sessions set revision=1,state=state||'{"revision":1}' where id=source_id;
  raise exception 'Superseded session remained writable';
 exception when others then if sqlerrm<>'Learning session has a successor' then raise; end if; end;
end $$;
do $$ begin
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 update consent_records set revoked_at=now() where student_id=current_setting('test.student_a')::uuid;
 if student_granular_learning_ready(current_setting('test.student_a')::uuid) then raise exception 'Revoked authorization still grants access'; end if;
 update consent_records set revoked_at=null where student_id=current_setting('test.student_a')::uuid;
 update diagnostic_item_bank_releases set status='withdrawn',withdrawn_at=now() where id=current_setting('test.bank')::uuid;
 if student_granular_learning_ready(current_setting('test.student_a')::uuid) then raise exception 'Withdrawn parent bank still grants access'; end if;
 begin
  update granular_assessment_sessions set revision=2,state=state||'{"revision":2}' where id=current_setting('test.session')::uuid;
  raise exception 'Session write accepted after parent-bank withdrawal';
 exception when others then if SQLERRM<>'Assessment release unavailable' then raise; end if; end;
end $$;
rollback;
