-- Synthetic users only; every mutation is rolled back.
begin;
set local search_path = public;

do $$ begin
  assert to_regprocedure('public.create_school_with_organization(text,uuid,text,text,text,text)') is not null;
  assert to_regprocedure('public.update_school(uuid,text,text,text)') is not null;
  assert to_regprocedure('public.create_school_class(uuid,text,integer,text)') is not null;
  assert to_regprocedure('public.update_school_class(uuid,text,integer,text)') is not null;
  assert to_regprocedure('public.create_teacher_class(text,integer,text)') is not null;
  assert has_function_privilege('authenticated','public.create_school_with_organization(text,uuid,text,text,text,text)','EXECUTE');
  assert has_function_privilege('authenticated','public.update_school(uuid,text,text,text)','EXECUTE');
  assert has_function_privilege('authenticated','public.create_school_class(uuid,text,integer,text)','EXECUTE');
  assert has_function_privilege('authenticated','public.update_school_class(uuid,text,integer,text)','EXECUTE');
  assert not has_function_privilege('anon','public.create_school_with_organization(text,uuid,text,text,text,text)','EXECUTE');
  assert not has_function_privilege('anon','public.update_school(uuid,text,text,text)','EXECUTE');
  assert not has_function_privilege('anon','public.create_school_class(uuid,text,integer,text)','EXECUTE');
  assert not has_function_privilege('anon','public.update_school_class(uuid,text,integer,text)','EXECUTE');
end $$;

insert into public.organizations(id,name,type) values
  ('91400000-0000-4000-8000-000000000001','Organisation A','school'),
  ('91400000-0000-4000-8000-000000000002','Organisation B','school');
insert into public.schools(id,organization_id,name,city,country,curriculum_type) values
  ('91400000-0000-4000-8000-000000000011','91400000-0000-4000-8000-000000000001','École A','Kigali','Rwanda','national'),
  ('91400000-0000-4000-8000-000000000012','91400000-0000-4000-8000-000000000002','École B','Huye','Rwanda','national');
insert into public.classes(id,school_id,name,grade_level,academic_year) values
  ('91400000-0000-4000-8000-000000000021','91400000-0000-4000-8000-000000000011','6e A',6,'2026–2027'),
  ('91400000-0000-4000-8000-000000000022','91400000-0000-4000-8000-000000000012','6e B',6,'2026–2027');
insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values
  ('91400000-0000-4000-8001-000000000001','school-platform@example.invalid','{}','{}'),
  ('91400000-0000-4000-8001-000000000002','school-admin-a@example.invalid','{}','{}'),
  ('91400000-0000-4000-8001-000000000003','school-admin-none@example.invalid','{}','{}'),
  ('91400000-0000-4000-8001-000000000004','school-teacher-home@example.invalid','{}','{}'),
  ('91400000-0000-4000-8001-000000000005','school-parent@example.invalid','{}','{}'),
  ('91400000-0000-4000-8001-000000000006','school-teacher-no-home@example.invalid','{}','{}');
update public.profiles set
  role = case auth_user_id
    when '91400000-0000-4000-8001-000000000001' then 'platform_admin'
    when '91400000-0000-4000-8001-000000000002' then 'school_admin'
    when '91400000-0000-4000-8001-000000000003' then 'school_admin'
    when '91400000-0000-4000-8001-000000000004' then 'teacher'
    when '91400000-0000-4000-8001-000000000006' then 'teacher'
    else 'parent'
  end,
  school_id = case auth_user_id
    when '91400000-0000-4000-8001-000000000002' then '91400000-0000-4000-8000-000000000011'::uuid
    when '91400000-0000-4000-8001-000000000004' then '91400000-0000-4000-8000-000000000012'::uuid
    else null
  end
where auth_user_id::text like '91400000-0000-4000-8001-%';

select set_config('request.jwt.claim.sub','91400000-0000-4000-8001-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
do $$ begin
  perform public.create_school_with_organization('École C','91400000-0000-4000-8000-000000000001',null,'Musanze','Rwanda','national');
  assert (select organization_id from public.schools where name='École C')='91400000-0000-4000-8000-000000000001'::uuid;
  perform public.create_school_with_organization('École D',null,'Organisation D','Rubavu','Rwanda','ib');
  assert (select organization.type from public.organizations organization join public.schools school on school.organization_id=organization.id where school.name='École D')='school';
  perform public.update_school('91400000-0000-4000-8000-000000000012','École B2','Nyamagabe','Rwanda');
  assert exists(select 1 from public.schools where id='91400000-0000-4000-8000-000000000012' and name='École B2' and city='Nyamagabe' and curriculum_type='national');
  begin
    perform public.create_school_class('91400000-0000-4000-8000-000000000011','Sans niveau',null,'2026–2027');
    raise exception 'null class grade accepted';
  exception when invalid_parameter_value then assert sqlerrm='invalid_class_input'; end;
end $$;

select set_config('request.jwt.claim.sub','91400000-0000-4000-8001-000000000002',true);
do $$ begin
  perform public.create_school_class('91400000-0000-4000-8000-000000000011','5e A',5,'2026–2027');
  perform public.update_school('91400000-0000-4000-8000-000000000011','École A2','Kigali','Rwanda');
  assert (select name from public.schools where id='91400000-0000-4000-8000-000000000011')='École A2';
  begin
    perform public.create_school_class('91400000-0000-4000-8000-000000000012','Interdite',6,'2026–2027');
    raise exception 'cross-school class creation accepted';
  exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
  begin
    perform public.update_school_class('91400000-0000-4000-8000-000000000022','Interdite',6,'2026–2027');
    raise exception 'cross-school class update accepted';
  exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
  begin
    perform public.update_school('91400000-0000-4000-8000-000000000012','Interdite','Huye','Rwanda');
    raise exception 'cross-school update accepted';
  exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
  perform public.update_school_class('91400000-0000-4000-8000-000000000021','6e A+',7,'2027–2028');
  assert exists(select 1 from public.classes where id='91400000-0000-4000-8000-000000000021' and school_id='91400000-0000-4000-8000-000000000011' and name='6e A+' and grade_level=7);
  update public.classes set school_id='91400000-0000-4000-8000-000000000012' where id='91400000-0000-4000-8000-000000000021';
  assert (select school_id from public.classes where id='91400000-0000-4000-8000-000000000021')='91400000-0000-4000-8000-000000000011'::uuid;
  perform public.create_teacher_class('Classe admin',8,'2027–2028');
  assert (select school_id from public.classes where name='Classe admin')='91400000-0000-4000-8000-000000000011'::uuid;
  assert not exists(select 1 from public.teacher_classes teacher_class join public.classes class on class.id=teacher_class.class_id where class.name='Classe admin');
end $$;

select set_config('request.jwt.claim.sub','91400000-0000-4000-8001-000000000003',true);
do $$ begin
  begin
    perform public.create_teacher_class('Classe orpheline',8,'2027–2028');
    raise exception 'unassigned admin created an orphan';
  exception when insufficient_privilege then assert sqlerrm='school_admin_school_required'; end;
end $$;

select set_config('request.jwt.claim.sub','91400000-0000-4000-8001-000000000004',true);
do $$ begin
  begin
    perform public.create_teacher_class('Sans niveau',null,'2026–2027');
    raise exception 'null legacy grade accepted';
  exception when invalid_parameter_value then assert sqlerrm='invalid_class_input'; end;
  perform public.create_teacher_class('Classe enseignant rattaché',9,'2027–2028');
  assert (select school_id from public.classes where name='Classe enseignant rattaché')='91400000-0000-4000-8000-000000000012'::uuid;
  assert exists(select 1 from public.teacher_classes teacher_class join public.classes class on class.id=teacher_class.class_id where class.name='Classe enseignant rattaché');
  begin perform public.create_school_with_organization('Interdite',null,'Interdite',null,null,'national'); raise exception 'teacher created school'; exception when insufficient_privilege then assert sqlerrm='platform_admin_required'; end;
  begin perform public.update_school('91400000-0000-4000-8000-000000000012','Interdite',null,null); raise exception 'teacher updated school'; exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
  begin perform public.create_school_class('91400000-0000-4000-8000-000000000012','Interdite',6,'2026–2027'); raise exception 'teacher created admin class'; exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
  begin perform public.update_school_class('91400000-0000-4000-8000-000000000022','Interdite',6,'2026–2027'); raise exception 'teacher updated admin class'; exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
end $$;

select set_config('request.jwt.claim.sub','91400000-0000-4000-8001-000000000005',true);
do $$ begin
  begin perform public.create_school_with_organization('Interdite',null,'Interdite',null,null,'national'); raise exception 'parent created school'; exception when insufficient_privilege then assert sqlerrm='platform_admin_required'; end;
  begin perform public.update_school('91400000-0000-4000-8000-000000000011','Interdite',null,null); raise exception 'parent updated school'; exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
  begin perform public.create_school_class('91400000-0000-4000-8000-000000000011','Interdite',6,'2026–2027'); raise exception 'parent created class'; exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
  begin perform public.update_school_class('91400000-0000-4000-8000-000000000021','Interdite',6,'2026–2027'); raise exception 'parent updated class'; exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
  begin perform public.create_teacher_class('Interdite',6,'2026–2027'); raise exception 'parent used legacy class creation'; exception when insufficient_privilege then assert sqlerrm='teacher_required'; end;
end $$;

select set_config('request.jwt.claim.sub','91400000-0000-4000-8999-000000000999',true);
do $$ begin
  begin perform public.create_school_with_organization('Interdite',null,'Interdite',null,null,'national'); raise exception 'missing profile created school'; exception when insufficient_privilege then assert sqlerrm='platform_admin_required'; end;
  begin perform public.update_school('91400000-0000-4000-8000-000000000011','Interdite',null,null); raise exception 'missing profile updated school'; exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
  begin perform public.create_school_class('91400000-0000-4000-8000-000000000011','Interdite',6,'2026–2027'); raise exception 'missing profile created class'; exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
  begin perform public.update_school_class('91400000-0000-4000-8000-000000000021','Interdite',6,'2026–2027'); raise exception 'missing profile updated class'; exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
  begin perform public.create_teacher_class('Interdite',6,'2026–2027'); raise exception 'missing profile used legacy class creation'; exception when insufficient_privilege then assert sqlerrm='teacher_required'; end;
end $$;

select set_config('request.jwt.claim.sub','91400000-0000-4000-8001-000000000006',true);
do $$ begin
  perform public.create_teacher_class('Classe indépendante test',7,'2026–2027');
  assert exists(select 1 from public.classes class join public.schools school on school.id=class.school_id where class.name='Classe indépendante test' and school.curriculum_type='independent');
  assert exists(select 1 from public.teacher_classes teacher_class join public.classes class on class.id=teacher_class.class_id where class.name='Classe indépendante test');
end $$;

rollback;
