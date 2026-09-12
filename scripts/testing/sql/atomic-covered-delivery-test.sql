begin;
insert into students(id) values ('16100000-0000-4000-8000-000000000001');
set local role service_role;
do $$ begin
 begin
  perform record_covered_student_material_delivery('16100000-0000-4000-8000-000000000001','test:atomic','sha256:'||repeat('1',64),array['Une phrase.'],'[]','plume-material-capture-v1');
  raise exception 'Disabled contract accepted';
 exception when others then if SQLERRM<>'Material capture contract is not enabled' then raise; end if; end;
end $$;
reset role;
update material_capture_contracts set enabled=true where contract_key='plume-material-capture-v1';
insert into students(id) values ('16100000-0000-4000-8000-000000000002'),('16100000-0000-4000-8000-000000000003');
set local role service_role;
do $$ declare
 a uuid:='16100000-0000-4000-8000-000000000002';
 b uuid:='16100000-0000-4000-8000-000000000003';
 p uuid:='16100000-0000-4000-8000-000000000011';
 q uuid:='16100000-0000-4000-8000-000000000012';
 k text:='sentence:sha256:'||repeat('a',64);
 digest text:='sha256:'||repeat('1',64);
 batch jsonb; n integer; stamp timestamptz;
begin
 batch:=jsonb_build_array(jsonb_build_object('presentationId',p,'sourceChecksum',digest,'materialKeys',jsonb_build_array(k)));
 perform record_covered_student_material_delivery(a,'test:atomic',digest,array['Les oiseaux chantent.'],batch,'plume-material-capture-v1');
 if not student_material_history_complete(a,p) or student_material_history_complete(b,p) then raise exception 'Covered owner receipt failed'; end if;
 select count(*) into n from prior_student_material_delivery_text(a,p);
 if n<>0 then raise exception 'Current payload counted as earlier exposure'; end if;
 select recorded_at into stamp from student_material_coverage_receipts where presentation_id=p;
 perform record_covered_student_material_delivery(a,'test:atomic',digest,array['Les oiseaux chantent.'],batch,'plume-material-capture-v1');
 if stamp<>(select recorded_at from student_material_coverage_receipts where presentation_id=p) then raise exception 'Retry rewrote receipt'; end if;
 batch:=jsonb_build_array(jsonb_build_object('presentationId',q,'sourceChecksum',digest,'materialKeys',jsonb_build_array(k)));
 begin
  perform record_covered_student_material_delivery(a,'test:atomic',digest,array['Different payload.'],batch,'plume-material-capture-v1');
  raise exception 'Journal mismatch accepted';
 exception when others then if SQLERRM<>'Delivery journal identity reused' then raise; end if; end;
 if exists(select 1 from student_material_presentations where id=q) then raise exception 'Failed journal retained partial presentation'; end if;
 perform record_covered_student_material_delivery(a,'test:second','sha256:'||repeat('2',64),array['Un autre texte.'],batch,'plume-material-capture-v1');
 select count(*) into n from prior_student_material_delivery_text(a,q);
 if n<>1 then raise exception 'Earlier payload missing or self-exposure included'; end if;
 begin
  perform record_covered_student_material_delivery(b,'test:other',digest,array['Other owner.'],batch,'plume-material-capture-v1');
  raise exception 'Owner reuse accepted';
 exception when others then if SQLERRM<>'Material presentation identity reused' then raise; end if; end;
 if exists(select 1 from student_material_delivery_journal where student_id=b) then raise exception 'Failed owner reuse retained journal'; end if;
 -- A later invalid member must roll back an earlier valid member of the batch.
 batch:=jsonb_build_array(
  jsonb_build_object('presentationId','16100000-0000-4000-8000-000000000014','sourceChecksum',digest,'materialKeys',jsonb_build_array(k)),
  jsonb_build_object('presentationId','16100000-0000-4000-8000-000000000015','sourceChecksum','invalid','materialKeys',jsonb_build_array(k)));
 begin
  perform record_covered_student_material_delivery(a,'test:batch-failure',digest,array['Failed batch.'],batch,'plume-material-capture-v1');
  raise exception 'Invalid batch member accepted';
 exception when others then if SQLERRM<>'Invalid covered presentation' then raise; end if; end;
 if exists(select 1 from student_material_presentations where id='16100000-0000-4000-8000-000000000014')
 or exists(select 1 from student_material_coverage_receipts where presentation_id='16100000-0000-4000-8000-000000000014')
 or exists(select 1 from student_material_delivery_journal where boundary='test:batch-failure')
 then raise exception 'Failed batch retained partial state'; end if;
 -- Enabling capture cannot invent the earlier history of an existing student.
 batch:=jsonb_build_array(jsonb_build_object('presentationId','16100000-0000-4000-8000-000000000016','sourceChecksum',digest,'materialKeys',jsonb_build_array(k)));
 perform record_covered_student_material_delivery('16100000-0000-4000-8000-000000000001','test:legacy',digest,array['Legacy student.'],batch,'plume-material-capture-v1');
 if student_material_history_complete('16100000-0000-4000-8000-000000000001','16100000-0000-4000-8000-000000000016') then raise exception 'Legacy history invented'; end if;
 -- Ordinary unverified delivery still invalidates the epoch and cannot be healed.
 perform record_student_material_delivery_text(a,'test:uncovered','sha256:'||repeat('3',64),array['Untracked coverage.']);
 batch:=jsonb_build_array(jsonb_build_object('presentationId','16100000-0000-4000-8000-000000000013','sourceChecksum',digest,'materialKeys',jsonb_build_array(k)));
 perform record_covered_student_material_delivery(a,'test:later','sha256:'||repeat('4',64),array['Later covered payload.'],batch,'plume-material-capture-v1');
 if student_material_history_complete(a,'16100000-0000-4000-8000-000000000013') then raise exception 'Later batch healed history gap'; end if;
 if not student_material_history_complete(a,p) then raise exception 'Later gap changed past receipt'; end if;
end $$;
reset role;
do $$ begin
 if has_function_privilege('anon','record_covered_student_material_delivery(uuid,text,text,text[],jsonb,text)','execute')
 or has_function_privilege('authenticated','record_covered_student_material_delivery(uuid,text,text,text[],jsonb,text)','execute')
 then raise exception 'Client can attest complete capture'; end if;
end $$;
rollback;
