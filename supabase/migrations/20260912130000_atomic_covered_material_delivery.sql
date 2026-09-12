begin;
-- Infrastructure only. No capture contract is enabled and no baseline is added.
-- Trusted server callers must first establish complete payload capture. Ordinary
-- journal/presentation recorders continue to invalidate unverified coverage.
create function public.record_covered_student_material_delivery(
 p_student_id uuid,p_boundary text,p_payload_checksum text,p_text_fragments text[],
 p_presentations jsonb,p_contract_key text
) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_row jsonb; v_keys text[]; v_existing text[];
begin
 perform 1 from material_capture_contracts where contract_key=p_contract_key and enabled for share;
 if not found then raise exception 'Material capture contract is not enabled'; end if;
 if p_student_id is null or p_boundary is null or p_boundary !~ '^[a-z][a-z0-9:_-]{1,99}$'
 or p_payload_checksum is null or p_payload_checksum !~ '^sha256:[0-9a-f]{64}$'
 or p_text_fragments is null or array_position(p_text_fragments,null) is not null
 or cardinality(p_text_fragments) not between 1 and 20000
 or (select coalesce(sum(length(t)),0) from unnest(p_text_fragments) t)>2000000
 or coalesce(jsonb_typeof(p_presentations),'null')<>'array'
 then raise exception 'Invalid covered delivery payload'; end if;
 if jsonb_array_length(p_presentations)>100 then raise exception 'Too many covered presentations'; end if;
 -- The same student lock is used by ordinary delivery invalidation. Receipts
 -- precede this payload's journal timestamp, excluding self-exposure from prior
 -- history, while earlier delivered payloads remain visible to the reader.
 perform 1 from student_material_coverage_epochs where student_id=p_student_id for update;
 for v_row in select value from jsonb_array_elements(p_presentations) loop
  if jsonb_typeof(v_row)<>'object' or not(v_row ?& array['presentationId','sourceChecksum','materialKeys'])
   or (select count(*) from jsonb_object_keys(v_row))<>3
   or coalesce(jsonb_typeof(v_row->'materialKeys'),'null')<>'array'
   or coalesce(v_row->>'sourceChecksum','') !~ '^sha256:[0-9a-f]{64}$'
   then raise exception 'Invalid covered presentation'; end if;
  if exists(select 1 from jsonb_array_elements(v_row->'materialKeys') k where jsonb_typeof(k)<>'string')
   then raise exception 'Invalid covered material keys'; end if;
  select array_agg(value order by value) into v_keys from jsonb_array_elements_text(v_row->'materialKeys');
  perform * from record_covered_student_material_presentation(
   (v_row->>'presentationId')::uuid,p_student_id,v_row->>'sourceChecksum',v_keys,p_contract_key);
 end loop;
 insert into student_material_delivery_journal(student_id,boundary,payload_checksum,text_fragments)
 values(p_student_id,p_boundary,p_payload_checksum,p_text_fragments) on conflict do nothing;
 select text_fragments into strict v_existing from student_material_delivery_journal
 where student_id=p_student_id and boundary=p_boundary and payload_checksum=p_payload_checksum;
 if v_existing<>p_text_fragments then raise exception 'Delivery journal identity reused'; end if;
 -- Any error rolls back both the new journal and every presentation in the batch.
end $$;
revoke all on function public.record_covered_student_material_delivery(uuid,text,text,text[],jsonb,text) from public,anon,authenticated;
grant execute on function public.record_covered_student_material_delivery(uuid,text,text,text[],jsonb,text) to service_role;
commit;
