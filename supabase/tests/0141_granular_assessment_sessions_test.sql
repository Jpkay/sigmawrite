begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
select extensions.plan(1);
insert into auth.users(id,email,raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000002','granular-publisher-141@example.invalid','{"role":"parent"}');
insert into ontology_versions(id,version,document_path) values
 ('20000000-0000-4000-8000-000000000099','granular-test-141','tests/0141');
insert into students(id) values ('10000000-0000-4000-8000-000000000001');
insert into taxonomy_releases(id,release_key,version,ontology_version_id,status,manifest,manifest_checksum,validation_report,published_by,published_at)
values ('20000000-0000-4000-8000-000000000001','granular-test-141','granular-test-141','20000000-0000-4000-8000-000000000099','published','{"fixture":true}','granular-test-141','{"valid":true}',
 (select id from profiles where auth_user_id='10000000-0000-4000-8000-000000000002'),now());
-- Bank publication readiness is tested in 0066/0124. This fixture exercises
-- the granular release and session guards with a pinned published bank.
alter table diagnostic_item_bank_releases disable trigger diagnostic_bank_publication_guard;
insert into diagnostic_item_bank_releases(id,bank_key,version,status,taxonomy_release_id,manifest,manifest_checksum,validation_report,published_by,published_at)
values ('30000000-0000-4000-8000-000000000001','granular-test-bank-141','granular-test-141','published','20000000-0000-4000-8000-000000000001',
 '{"checksum":"granular-test-141"}','granular-test-141','{"valid":true}',(select id from profiles where auth_user_id='10000000-0000-4000-8000-000000000002'),now());
alter table diagnostic_item_bank_releases enable trigger diagnostic_bank_publication_guard;
insert into granular_assessment_releases(id,release_key,taxonomy_release_id,bank_release_id,status,content_checksum,bundle)
values ('40000000-0000-4000-8000-000000000001','test-granular','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','published','test-checksum','{}');
insert into granular_assessment_sessions(id,student_id,release_id,state)
values ('50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','{"revision":0,"phase":"assessing","release":{"checksum":"pinned"}}');
do $$ declare affected integer; begin
 insert into taxonomy_releases(id,release_key,version,ontology_version_id,status)
 values ('20000000-0000-4000-8000-000000000002','granular-test-unpublished-141','granular-test-unpublished-141','20000000-0000-4000-8000-000000000099','draft');
 begin
  insert into granular_assessment_releases(release_key,taxonomy_release_id,bank_release_id,status,content_checksum,bundle)
  values('wrong-taxonomy','20000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','published','test','{}');
  raise exception 'MISMATCHED_TAXONOMY_ACCEPTED';
 exception when others then if SQLERRM <> 'Published taxonomy and bank required' then raise; end if; end;
 if has_table_privilege('authenticated','granular_assessment_releases','SELECT') or has_table_privilege('anon','granular_assessment_sessions','UPDATE') then raise exception 'Browser access leaked'; end if;
 if not has_table_privilege('service_role','granular_assessment_sessions','UPDATE') then raise exception 'Server permission missing'; end if;
 update granular_assessment_sessions set revision=1,state=jsonb_set(state,'{revision}','1') where revision=0;
 get diagnostics affected=row_count;if affected<>1 then raise exception 'First write failed'; end if;
 update granular_assessment_sessions set revision=1,state=jsonb_set(state,'{revision}','1') where revision=0;
 get diagnostics affected=row_count;if affected<>0 then raise exception 'Stale write accepted'; end if;
 begin
  update granular_assessment_releases set bundle='{"modified":true}';
  raise exception 'MUTATION_ACCEPTED';
 exception when others then if SQLERRM <> 'Published assessment releases are immutable' then raise; end if; end;
 begin
  update granular_assessment_sessions set revision=3,state=jsonb_set(state,'{revision}','3');
  raise exception 'REVISION_SKIP_ACCEPTED';
 exception when others then if SQLERRM <> 'Session revision must advance exactly once' then raise; end if; end;
 begin
  update granular_assessment_sessions set revision=2,state=jsonb_set(jsonb_set(state,'{revision}','2'),'{release}','{"checksum":"changed"}');
  raise exception 'RELEASE_SUBSTITUTION_ACCEPTED';
 exception when others then if SQLERRM <> 'Session ownership and release are immutable' then raise; end if; end;
 update granular_assessment_releases set status='withdrawn';
 begin
  update granular_assessment_sessions set revision=2,state=jsonb_set(state,'{revision}','2');
  raise exception 'WITHDRAWN_RELEASE_ACCEPTED';
 exception when others then if SQLERRM <> 'Assessment release unavailable' then raise; end if; end;
end $$;
select extensions.pass('Granular release and session guards hold');
select * from extensions.finish();
rollback;
