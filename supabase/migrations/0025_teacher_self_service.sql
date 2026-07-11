-- Sprint 13: teacher-owned class lifecycle and graph assignments.

alter table public.assignments alter column text_slug drop not null;
alter table public.assignments
  add column if not exists target_type text not null default 'text' check (target_type in ('text','competency_node','catch_up_step')),
  add column if not exists target_node_id uuid references public.competency_nodes(id) on delete set null;

create or replace function public.create_teacher_class(p_name text, p_grade integer, p_year text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_profile uuid; v_school uuid; v_org uuid; v_class uuid;
begin
  v_profile := public.current_profile_id();
  if not exists (select 1 from public.profiles where id=v_profile and role in ('teacher','school_admin')) then raise exception 'teacher required' using errcode='42501'; end if;
  select c.school_id into v_school from public.teacher_classes tc join public.classes c on c.id=tc.class_id where tc.teacher_profile_id=v_profile and c.school_id is not null limit 1;
  if v_school is null then
    insert into public.organizations(name,type) values ('Espace enseignant','tutoring_center') returning id into v_org;
    insert into public.schools(organization_id,name,country,curriculum_type) values (v_org,'Classe indépendante',null,'independent') returning id into v_school;
  end if;
  insert into public.classes(school_id,name,grade_level,academic_year) values(v_school,trim(p_name),p_grade,trim(p_year)) returning id into v_class;
  insert into public.teacher_classes(teacher_profile_id,class_id) values(v_profile,v_class);
  return v_class;
end $$;
revoke all on function public.create_teacher_class(text,integer,text) from public;
grant execute on function public.create_teacher_class(text,integer,text) to authenticated;

create or replace function public.set_class_enrollment(p_class_id uuid, p_student_id uuid, p_status text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.teacher_classes where class_id=p_class_id and teacher_profile_id=public.current_profile_id()) then raise exception 'forbidden' using errcode='42501'; end if;
  if p_status not in ('active','removed') then raise exception 'invalid status'; end if;
  update public.enrollments set status=p_status where class_id=p_class_id and student_id=p_student_id;
end $$;
revoke all on function public.set_class_enrollment(uuid,uuid,text) from public;
grant execute on function public.set_class_enrollment(uuid,uuid,text) to authenticated;
