begin;
insert into students(id) values
 ('14300000-0000-4000-8000-000000000001'),
 ('14300000-0000-4000-8000-000000000002');
set local role service_role;
do $$ declare
 a uuid:='14300000-0000-4000-8000-000000000001';
 b uuid:='14300000-0000-4000-8000-000000000002';
 p uuid:='14300000-0000-4000-8000-000000000011';
 q uuid:='14300000-0000-4000-8000-000000000012';
 r uuid:='14300000-0000-4000-8000-000000000013';
 word_key text:='word:sha256:'||repeat('a',64);
 sentence_key text:='sentence:sha256:'||repeat('b',64);
 n integer; fresh boolean;
begin
 select count(*),bool_and(first_recorded_exposure) into n,fresh
 from record_student_material_presentation(p,a,'source-one',array[word_key,sentence_key,word_key]);
 if n<>2 or not fresh then raise exception 'First presentation not recorded'; end if;
 select bool_and(first_recorded_exposure) into fresh
 from record_student_material_presentation(p,a,'source-one',array[sentence_key,word_key]);
 if not fresh then raise exception 'Retry changed first-exposure result'; end if;
 select bool_or(first_recorded_exposure) into fresh
 from record_student_material_presentation(q,a,'different-question',array[word_key]);
 if fresh then raise exception 'Same word in another question treated as new'; end if;
 select bool_and(first_recorded_exposure) into fresh
 from record_student_material_presentation(r,b,'source-one',array[word_key]);
 if not fresh then raise exception 'Exposure leaked across students'; end if;
 select count(*) into n from known_student_material_keys(a,array[word_key,'word:sha256:'||repeat('f',64)]);
 if n<>1 then raise exception 'Known-material lookup did not filter requested keys'; end if;
 select count(*) into n from known_student_material_keys(b,array[sentence_key]);
 if n<>0 then raise exception 'Known-material lookup leaked another student history'; end if;
 select count(*) into n from read_student_material_presentation(p,a,'source-one');
 if n<>2 then raise exception 'Saved receipt not readable'; end if;
 if exists(select 1 from read_student_material_presentation(p,b,'source-one'))
  or exists(select 1 from read_student_material_presentation(p,a,'changed-source'))
  or exists(select 1 from read_student_material_presentation(gen_random_uuid(),a,'source-one'))
 then raise exception 'Mismatched receipt yielded evidence'; end if;
 select count(*) into n from student_material_presentations;
 if n<>3 then raise exception 'Receipt lookup created a presentation'; end if;
 -- Exact sound clips share identity across different prompts and written labels.
 select bool_and(first_recorded_exposure) into fresh
 from record_student_material_presentation('14300000-0000-4000-8000-000000000014',a,'audio-one',array['audio:sha256:'||repeat('c',64)]);
 if not fresh then raise exception 'First audio presentation not recorded'; end if;
 select bool_or(first_recorded_exposure) into fresh
 from record_student_material_presentation('14300000-0000-4000-8000-000000000015',a,'audio-another-prompt',array['audio:sha256:'||repeat('c',64)]);
 if fresh then raise exception 'Same recording treated as novel'; end if;
 select bool_and(first_recorded_exposure) into fresh
 from record_student_material_presentation('14300000-0000-4000-8000-000000000016',b,'audio-one',array['audio:sha256:'||repeat('c',64)]);
 if not fresh then raise exception 'Audio exposure leaked across students'; end if;
 begin
  perform * from record_student_material_presentation(p,b,'source-one',array[word_key,sentence_key]);
  raise exception 'Owner substitution accepted';
 exception when others then if SQLERRM<>'Material presentation identity reused' then raise; end if; end;
 begin
  perform * from record_student_material_presentation(p,a,'changed-source',array[word_key,sentence_key]);
  raise exception 'Source substitution accepted';
 exception when others then if SQLERRM<>'Material presentation identity reused' then raise; end if; end;
 begin
  perform * from record_student_material_presentation(p,a,'source-one',array[word_key]);
  raise exception 'Material substitution accepted';
 exception when others then if SQLERRM<>'Material presentation identity reused' then raise; end if; end;
 begin
  perform * from record_student_material_presentation(gen_random_uuid(),a,'bad',array['raw student text']);
  raise exception 'Unvalidated material identity accepted';
 exception when others then if SQLERRM<>'Invalid material presentation' then raise; end if; end;
 begin
  delete from student_material_exposures where student_id=a;
  raise exception 'Service erased exposure history';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
do $$ begin
 begin
  perform * from student_material_exposures;
  raise exception 'Browser read exposure history';
 exception when insufficient_privilege then null; end;
 begin
  perform * from record_student_material_presentation(gen_random_uuid(),'14300000-0000-4000-8000-000000000001','bad',array['word:sha256:'||repeat('a',64)]);
  raise exception 'Browser forged exposure evidence';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
