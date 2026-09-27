-- Synthetic permission proof only, inside the disposable full-graph transaction.
do $$
declare
 parent record; old_member record; new_bank uuid; new_item uuid:='ad0fe820-b306-58b9-9342-088b47a1623c';
 digest text:='sha256:'||repeat('a',64); bundle_digest text:='sha256:'||repeat('b',64);
 proof jsonb; parallel_bank jsonb; parallel_bundle jsonb; got text; published_id uuid; retry_id uuid;
begin
 select * into strict parent from diagnostic_item_bank_releases where bank_key='synthetic-integration-only';
 select membership.* into old_member from diagnostic_item_bank_memberships membership where bank_release_id=parent.id limit 1;
 insert into diagnostic_item_bank_releases(bank_key,version,taxonomy_release_id,status,manifest,manifest_checksum,validation_report,published_by,published_at)
 values('french-diagnostic-bank-v3-r2','parallel-fixture-r2',parent.taxonomy_release_id,'draft',jsonb_build_object('checksum',digest),digest,'{"valid":true,"mode":"parallel_review"}',parent.published_by,now()) returning id into new_bank;
 insert into competency_items(id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,correct_answer,validator_type,difficulty,generation_type,qc_gates,review_status)
 select new_item,primary_node_id,strand,modality,learner_mode,response_type,'TEST UNIQUEMENT : permission de publication',correct_answer,validator_type,difficulty,'ai',qc_gates,'needs_human_review'
 from competency_items where id=old_member.item_id returning id into new_item;
 insert into diagnostic_item_bank_memberships(bank_release_id,item_id,node_id,mastery_evidence_id,section_key,evidence_expectation,modality,prompt_family,difficulty_tier,difficulty)
 values(new_bank,new_item,old_member.node_id,old_member.mastery_evidence_id,old_member.section_key,old_member.evidence_expectation,old_member.modality,old_member.prompt_family,old_member.difficulty_tier,old_member.difficulty);
 begin
  update diagnostic_item_bank_releases set status='published' where id=new_bank;
  raise exception 'Unpermitted pending bank published';
 exception when raise_exception then if sqlerrm<>'diagnostic_bank_not_ready' then raise; end if; end;
 select jsonb_build_object('bank',jsonb_build_object('key','french-diagnostic-bank-v3-r2'),'items',jsonb_build_array(jsonb_build_object(
  'itemKey','parallel-publication-fixture-r2','evidenceKey',(select substring(stable_key from strpos(stable_key,':')+1) from taxonomy_release_memberships where release_id=parent.taxonomy_release_id and record_type='mastery_evidence' and record_id=old_member.mastery_evidence_id),
  'sectionKey',old_member.section_key,'evidenceExpectation',old_member.evidence_expectation,'promptFamily',old_member.prompt_family,'difficultyTier',old_member.difficulty_tier,'reviewStatus',i.review_status,'qcGates',i.qc_gates,
  'item',jsonb_build_object('nodeKey',(select stable_key from taxonomy_release_memberships where release_id=parent.taxonomy_release_id and record_type='competency_node' and record_id=i.primary_node_id),
   'strand',i.strand,'modality',i.modality,'learnerMode',i.learner_mode,'responseType',i.response_type,'promptFr',i.prompt_fr,'instructionsFr',i.instructions_fr,'correctAnswer',i.correct_answer,'acceptableAnswers',coalesce(to_jsonb(i.acceptable_answers),'[]'::jsonb),'validatorType',i.validator_type,'validatorConfig',i.validator_config,'difficulty',i.difficulty,'cefrLevel',i.cefr_level))))
 into parallel_bank from competency_items i where id=new_item;
 proof:=jsonb_build_object('version','french-granular-parallel-publication-v1','authorization','product-owner-request-2026-09-11','reviewOwner','product_owner','ready',true,'bundleChecksum',bundle_digest,'bankChecksum',digest,'taxonomyChecksum','sha256:ef2b63974c580b3070c879125b23567cdf6be703c344d0365b998d1f0f14e880','instructionGapSkillIds','[]'::jsonb,'freshCheckGapSkillIds','[]'::jsonb,'bankItemCount',1);
 begin
  insert into granular_bank_publication_permissions(bank_release_id,bundle_checksum,bank_checksum,taxonomy_checksum,preflight)
  values(new_bank,bundle_digest,digest,proof->>'taxonomyChecksum',proof||'{"ready":false}');
  raise exception 'Failing preflight was accepted';
 exception when check_violation then null; end;
 insert into granular_bank_publication_permissions(bank_release_id,bundle_checksum,bank_checksum,taxonomy_checksum,preflight)
 values(new_bank,bundle_digest,digest,proof->>'taxonomyChecksum',proof);
 parallel_bundle:=jsonb_build_object('bank',parallel_bank,'bankId',new_bank,'taxonomyId',parent.taxonomy_release_id,'assessment',jsonb_build_object('taxonomyChecksum',proof->>'taxonomyChecksum','bankChecksum',digest,'reviewPolicy',jsonb_build_object('mode','parallel_review')));
 begin
  perform publish_granular_parallel_release('tampered-canonical-answer-r2',jsonb_set(parallel_bundle,'{bank,items,0,item,correctAnswer}','"changed answer"'::jsonb),bundle_digest,proof,parent.published_by);
  raise exception 'Changed canonical answer accepted';
 exception when raise_exception then if sqlerrm<>'Canonical question differs: parallel-publication-fixture-r2' then raise; end if; end;
 begin
  perform publish_granular_parallel_release('tampered-canonical-choices-r2',jsonb_set(parallel_bundle,'{bank,items,0,item,choices}','[{"text":"changed","correct":true}]'::jsonb),bundle_digest,proof,parent.published_by);
  raise exception 'Changed canonical choices accepted';
 exception when raise_exception then if sqlerrm<>'Canonical answer choices differ: parallel-publication-fixture-r2' then raise; end if; end;
 insert into granular_assessment_releases(release_key,taxonomy_release_id,bank_release_id,status,content_checksum,bundle)
 select 'occupied-publication-key-r2',taxonomy_release_id,bank_release_id,'draft',content_checksum,bundle
 from granular_assessment_releases where bank_release_id=parent.id limit 1;
 begin
  perform publish_granular_parallel_release('occupied-publication-key-r2',parallel_bundle,bundle_digest,proof,parent.published_by);
  raise exception 'Conflicting release key was accepted';
 exception when raise_exception then if sqlerrm<>'Granular release key already has different content' then raise; end if; end;
 if exists(select 1 from diagnostic_item_bank_releases where id=new_bank and status='published') then raise exception 'Failed publication left its bank published'; end if;
 published_id:=publish_granular_parallel_release('first-parallel-publication-r2',parallel_bundle,bundle_digest,proof,parent.published_by);
 if not exists(select 1 from diagnostic_item_bank_releases where id=new_bank and status='published') then raise exception 'Atomic publisher did not publish parent bank'; end if;
 parallel_bundle:=jsonb_build_object('assessment',jsonb_build_object('taxonomyChecksum',proof->>'taxonomyChecksum','bankChecksum',digest,'reviewPolicy',jsonb_build_object('mode','parallel_review')));
 begin
  insert into granular_assessment_releases(release_key,taxonomy_release_id,bank_release_id,status,content_checksum,bundle)
  values('wrong-parallel-bundle-r2',parent.taxonomy_release_id,new_bank,'published','sha256:'||repeat('c',64),parallel_bundle);
  raise exception 'Permission applied to another bundle';
 exception when raise_exception then if sqlerrm<>'Exact granular publication permission required' then raise; end if; end;
 insert into granular_assessment_releases(release_key,taxonomy_release_id,bank_release_id,status,content_checksum,bundle)
 values('permitted-parallel-bundle-r2',parent.taxonomy_release_id,new_bank,'published',bundle_digest,parallel_bundle);
 parallel_bundle:=parallel_bundle||jsonb_build_object('bank',parallel_bank,'bankId',new_bank,'taxonomyId',parent.taxonomy_release_id);
 published_id:=publish_granular_parallel_release('rpc-parallel-bundle-r2',parallel_bundle,bundle_digest,proof,parent.published_by);
 retry_id:=publish_granular_parallel_release('rpc-parallel-bundle-r2',parallel_bundle,bundle_digest,proof,parent.published_by);
 if published_id<>retry_id then raise exception 'Publication retry created another release'; end if;
 begin
  perform publish_granular_parallel_release('rpc-parallel-bundle-r2',parallel_bundle||'{"changed":true}',bundle_digest,proof,parent.published_by);
  raise exception 'Release key content conflict accepted';
 exception when raise_exception then if sqlerrm<>'Granular release key already has different content' then raise; end if; end;
 if has_function_privilege('authenticated','public.publish_granular_parallel_release(text,jsonb,text,jsonb,uuid)','EXECUTE') then raise exception 'Browser can publish a release'; end if;
 select review_status into got from competency_items where id=new_item;
 if got<>'needs_human_review' then raise exception 'Permission fabricated human approval'; end if;
 begin
  update granular_bank_publication_permissions set preflight=preflight||'{"reviewOwner":"another"}' where bank_release_id=new_bank;
  raise exception 'Permission was mutable';
 exception when raise_exception then if sqlerrm<>'Granular publication permissions are immutable' then raise; end if; end;
 if has_table_privilege('authenticated','public.granular_bank_publication_permissions','INSERT') or has_table_privilege('anon','public.granular_bank_publication_permissions','SELECT') then raise exception 'Browser can access publication permissions'; end if;
 if has_table_privilege('service_role','public.granular_bank_publication_permissions','UPDATE') then raise exception 'Server can rewrite permissions'; end if;
end $$;
