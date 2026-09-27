begin;
insert into students(id) values ('15300000-0000-4000-8000-000000000001'),('15300000-0000-4000-8000-000000000002');
set local role service_role;
do $$ declare a uuid:='15300000-0000-4000-8000-000000000001';b uuid:='15300000-0000-4000-8000-000000000002';p uuid:='15300000-0000-4000-8000-000000000011';h text:='sha256:'||repeat('a',64);n integer;t text[];
begin
 perform record_student_material_delivery_text(a,'legacy:reading-text',h,array['Les chevaux courent.']);
 perform record_student_material_delivery_text(b,'legacy:reading-text',h,array['Private other-student text']);
 perform * from record_student_material_presentation(p,a,'current-question',array['word:sha256:'||repeat('b',64)]);
 perform record_student_material_delivery_text(a,'granular:diagnostic','sha256:'||repeat('c',64),array['Current question text']);
 select count(*) into n from prior_student_material_delivery_text(a,p);
 if n<>1 then raise exception 'Prior delivery query included own current payload or lost prior source: %',n; end if;
 select text_fragments into t from prior_student_material_delivery_text(a,p);
 if t<>array['Les chevaux courent.'] then raise exception 'Wrong prior delivery source'; end if;
 if exists(select 1 from prior_student_material_delivery_text(b,p))
 or exists(select 1 from prior_student_material_delivery_text(a,gen_random_uuid())) then raise exception 'Prior journal escaped presentation owner'; end if;
 if exists(select 1 from prior_student_material_delivery_text(a,p,1,100)) then raise exception 'Pagination offset ignored'; end if;
end $$;
reset role;
do $$ begin
 if has_function_privilege('authenticated','prior_student_material_delivery_text(uuid,uuid,integer,integer)','execute') then raise exception 'Client can read delivery history'; end if;
end $$;
rollback;
