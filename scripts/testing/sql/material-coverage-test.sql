begin;
-- Fixture-only contract activation. Application rollout must first verify every
-- delivery boundary; these synthetic students have no external content history.
insert into students(id) values ('15100000-0000-4000-8000-000000000001');
update material_capture_contracts set enabled=true where contract_key='plume-material-capture-v1';
insert into students(id) values ('15100000-0000-4000-8000-000000000002'),('15100000-0000-4000-8000-000000000003');
set local role service_role;
do $$ declare
 legacy uuid:='15100000-0000-4000-8000-000000000001';
 fresh uuid:='15100000-0000-4000-8000-000000000002';
 other uuid:='15100000-0000-4000-8000-000000000003';
 p uuid:='15100000-0000-4000-8000-000000000011';
 q uuid:='15100000-0000-4000-8000-000000000012';
 k text:='word:sha256:'||repeat('b',64);
 n integer;
begin
 perform * from record_covered_student_material_presentation(p,fresh,'source',array[k],'plume-material-capture-v1');
 if not student_material_history_complete(fresh,p) then raise exception 'Fresh covered presentation lacks proof'; end if;
 if student_material_history_complete(other,p) or student_material_history_complete(fresh,gen_random_uuid()) then raise exception 'Coverage escaped owner/presentation boundary'; end if;
 perform * from record_covered_student_material_presentation(p,fresh,'source',array[k],'plume-material-capture-v1');
 select count(*) into n from student_material_coverage_receipts where presentation_id=p;
 if n<>1 then raise exception 'Retry changed immutable receipt'; end if;
 perform * from record_covered_student_material_presentation(q,legacy,'old-student',array[k],'plume-material-capture-v1');
 if student_material_history_complete(legacy,q) then raise exception 'Legacy student received invented fresh baseline'; end if;
 perform invalidate_student_material_coverage(fresh,'untracked reference page');
 perform * from record_covered_student_material_presentation('15100000-0000-4000-8000-000000000013',fresh,'later',array[k],'plume-material-capture-v1');
 if student_material_history_complete(fresh,'15100000-0000-4000-8000-000000000013') then raise exception 'Later tracked write erased history gap'; end if;
 if not student_material_history_complete(fresh,p) then raise exception 'Later gap mutated earlier valid receipt'; end if;
 -- The old recorder must fail closed when a new presentation lacks coverage.
 perform * from record_student_material_presentation('15100000-0000-4000-8000-000000000014',other,'unverified',array[k]);
 if student_material_history_complete(other,'15100000-0000-4000-8000-000000000014') then raise exception 'Old recorder granted completeness'; end if;
 perform * from record_covered_student_material_presentation('15100000-0000-4000-8000-000000000015',other,'after-gap',array[k],'plume-material-capture-v1');
 if student_material_history_complete(other,'15100000-0000-4000-8000-000000000015') then raise exception 'Old recorder did not invalidate coverage'; end if;
 begin
  update student_material_coverage_receipts set history_complete=true;
  raise exception 'Service role can overwrite proof';
 exception when insufficient_privilege then null; end;
 begin
  perform * from record_covered_student_material_presentation(p,fresh,'changed',array[k],'plume-material-capture-v1');
  raise exception 'Changed source was accepted';
 exception when others then if SQLERRM<>'Material presentation identity reused' then raise; end if; end;
end $$;
reset role;
do $$ begin
 if has_function_privilege('authenticated','student_material_history_complete(uuid,uuid)','execute')
 or has_function_privilege('anon','record_covered_student_material_presentation(uuid,uuid,text,text[],text)','execute')
 or has_table_privilege('authenticated','student_material_coverage_epochs','insert')
 then raise exception 'Client can access coverage authority'; end if;
end $$;
rollback;
