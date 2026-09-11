-- Runs in a disposable database after migration 0141 and minimal parent tables.
begin;
insert into students(id) values ('10000000-0000-4000-8000-000000000001');
insert into taxonomy_releases(id,status) values ('20000000-0000-4000-8000-000000000001','published');
insert into diagnostic_item_bank_releases(id,status,taxonomy_release_id) values ('30000000-0000-4000-8000-000000000001','published','20000000-0000-4000-8000-000000000001');
insert into granular_assessment_releases(id,release_key,taxonomy_release_id,bank_release_id,status,content_checksum,bundle)
values ('40000000-0000-4000-8000-000000000001','test-granular','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','published','test-checksum','{}');
insert into granular_assessment_sessions(id,student_id,release_id,state)
values ('50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','{"revision":0,"phase":"assessing","release":{"checksum":"pinned"}}');
do $$ declare affected integer; begin
 insert into taxonomy_releases(id,status) values ('20000000-0000-4000-8000-000000000002','published');
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
rollback;
