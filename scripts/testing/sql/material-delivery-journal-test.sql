begin;
update material_capture_contracts set enabled=true where contract_key='plume-material-capture-v1';
insert into students(id) values ('15200000-0000-4000-8000-000000000001'),('15200000-0000-4000-8000-000000000002');
set local role service_role;
do $$ declare a uuid:='15200000-0000-4000-8000-000000000001';b uuid:='15200000-0000-4000-8000-000000000002';h text:='sha256:'||repeat('a',64);n integer;
begin
 perform record_student_material_delivery_text(a,'granular:diagnostic',h,array['Les chevaux courent.','chevaux']);
 perform record_student_material_delivery_text(a,'granular:diagnostic',h,array['Les chevaux courent.','chevaux']);
 select count(*) into n from student_material_delivery_journal where student_id=a;
 if n<>1 then raise exception 'Retry duplicated text delivery'; end if;
 if exists(select 1 from student_material_delivery_journal where student_id=b) then raise exception 'Journal owner mismatch'; end if;
 if exists(select 1 from student_material_coverage_epochs where student_id=a and invalidated_at is null) then raise exception 'Unverified raw text preserved completeness'; end if;
 if exists(select 1 from student_material_coverage_receipts) then raise exception 'Journal created a coverage proof'; end if;
 begin
  perform record_student_material_delivery_text(a,'granular:diagnostic',h,array['Different text']);
  raise exception 'Changed journal identity accepted';
 exception when others then if SQLERRM<>'Delivery journal identity reused' then raise; end if; end;
 begin
  update student_material_delivery_journal set text_fragments=array['replaced'];
  raise exception 'Journal overwrite accepted';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
 if has_function_privilege('authenticated','record_student_material_delivery_text(uuid,text,text,text[])','execute')
 or has_table_privilege('anon','student_material_delivery_journal','select')
 then raise exception 'Journal exposed to client'; end if;
end $$;
rollback;
