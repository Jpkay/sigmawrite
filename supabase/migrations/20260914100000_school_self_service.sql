-- Bounded self-service school and class setup.
-- Every mutation derives authorization from auth.uid(); direct table writes are
-- unnecessary, and classes cannot be moved between schools through these RPCs.

create or replace function public.create_school_with_organization(
  p_school_name text,
  p_organization_id uuid,
  p_organization_name text,
  p_city text,
  p_country text,
  p_curriculum_type text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_organization_id uuid;
  v_school_id uuid;
  v_school_name text := btrim(coalesce(p_school_name, ''));
  v_organization_name text := nullif(btrim(coalesce(p_organization_name, '')), '');
  v_city text := nullif(btrim(coalesce(p_city, '')), '');
  v_country text := nullif(btrim(coalesce(p_country, '')), '');
  v_curriculum_type text := btrim(coalesce(p_curriculum_type, ''));
begin
  if not coalesce(public.is_platform_admin(), false) then
    raise exception 'platform_admin_required' using errcode = '42501';
  end if;
  if char_length(v_school_name) not between 2 and 120
    or (v_city is not null and char_length(v_city) not between 2 and 120)
    or (v_country is not null and char_length(v_country) not between 2 and 120)
    or v_curriculum_type not in ('national', 'french', 'ib', 'cambridge', 'other') then
    raise exception 'invalid_school_input' using errcode = '22023';
  end if;
  if (p_organization_id is null) = (v_organization_name is null) then
    raise exception 'organization_selection_required' using errcode = '22023';
  end if;

  if p_organization_id is not null then
    select organization.id into v_organization_id
    from public.organizations organization
    where organization.id = p_organization_id
    for key share;
    if v_organization_id is null then
      raise exception 'organization_not_found' using errcode = '22023';
    end if;
  else
    if char_length(v_organization_name) not between 2 and 160 then
      raise exception 'invalid_organization_input' using errcode = '22023';
    end if;
    insert into public.organizations(name, type)
    values (v_organization_name, 'school')
    returning id into v_organization_id;
  end if;

  insert into public.schools(organization_id, name, city, country, curriculum_type)
  values (v_organization_id, v_school_name, v_city, v_country, v_curriculum_type)
  returning id into v_school_id;
  return v_school_id;
end;
$$;

create or replace function public.update_school(
  p_school_id uuid,
  p_name text,
  p_city text,
  p_country text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_school_id uuid;
  v_name text := btrim(coalesce(p_name, ''));
  v_city text := nullif(btrim(coalesce(p_city, '')), '');
  v_country text := nullif(btrim(coalesce(p_country, '')), '');
begin
  select school.id into v_school_id
  from public.schools school
  where school.id = p_school_id
  for update;
  if v_school_id is null then raise exception 'school_not_found' using errcode = '22023'; end if;
  if not (coalesce(public.is_platform_admin(), false) or coalesce(public.is_school_admin_of(v_school_id), false)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if char_length(v_name) not between 2 and 120
    or (v_city is not null and char_length(v_city) not between 2 and 120)
    or (v_country is not null and char_length(v_country) not between 2 and 120) then
    raise exception 'invalid_school_input' using errcode = '22023';
  end if;
  update public.schools set name = v_name, city = v_city, country = v_country where id = v_school_id;
  return v_school_id;
end;
$$;

create or replace function public.create_school_class(
  p_school_id uuid,
  p_name text,
  p_grade_level integer,
  p_academic_year text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_school_id uuid;
  v_class_id uuid;
  v_name text := btrim(coalesce(p_name, ''));
  v_academic_year text := btrim(coalesce(p_academic_year, ''));
begin
  select school.id into v_school_id from public.schools school where school.id = p_school_id for key share;
  if v_school_id is null then raise exception 'school_not_found' using errcode = '22023'; end if;
  if not (coalesce(public.is_platform_admin(), false) or coalesce(public.is_school_admin_of(v_school_id), false)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if char_length(v_name) not between 2 and 100
    or p_grade_level is null or p_grade_level not between 5 and 12
    or char_length(v_academic_year) not between 4 and 20 then
    raise exception 'invalid_class_input' using errcode = '22023';
  end if;
  insert into public.classes(school_id, name, grade_level, academic_year)
  values (v_school_id, v_name, p_grade_level, v_academic_year)
  returning id into v_class_id;
  return v_class_id;
end;
$$;

create or replace function public.update_school_class(
  p_class_id uuid,
  p_name text,
  p_grade_level integer,
  p_academic_year text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_school_id uuid;
  v_name text := btrim(coalesce(p_name, ''));
  v_academic_year text := btrim(coalesce(p_academic_year, ''));
begin
  select class.school_id into v_school_id from public.classes class where class.id = p_class_id for update;
  if v_school_id is null then raise exception 'class_not_found' using errcode = '22023'; end if;
  if not (coalesce(public.is_platform_admin(), false) or coalesce(public.is_school_admin_of(v_school_id), false)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if char_length(v_name) not between 2 and 100
    or p_grade_level is null or p_grade_level not between 5 and 12
    or char_length(v_academic_year) not between 4 and 20 then
    raise exception 'invalid_class_input' using errcode = '22023';
  end if;
  update public.classes
  set name = v_name, grade_level = p_grade_level, academic_year = v_academic_year
  where id = p_class_id;
  return p_class_id;
end;
$$;

-- Preserve the existing teacher class-creation contract while making its
-- school choice deterministic. An administrator never bootstraps an orphan.
create or replace function public.create_teacher_class(p_name text, p_grade integer, p_year text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_profile_id uuid := public.current_profile_id();
  v_role text;
  v_assigned_school_id uuid;
  v_existing_school_id uuid;
  v_existing_school_count integer;
  v_school_id uuid;
  v_organization_id uuid;
  v_class_id uuid;
  v_name text := btrim(coalesce(p_name, ''));
  v_year text := btrim(coalesce(p_year, ''));
begin
  select profile.role, profile.school_id into v_role, v_assigned_school_id
  from public.profiles profile
  where profile.id = v_profile_id and profile.deactivated_at is null
  for key share;
  if v_role is null or v_role not in ('teacher', 'school_admin') then
    raise exception 'teacher_required' using errcode = '42501';
  end if;
  if char_length(v_name) not between 2 and 100
    or p_grade is null or p_grade not between 5 and 12
    or char_length(v_year) not between 4 and 20 then
    raise exception 'invalid_class_input' using errcode = '22023';
  end if;

  if v_assigned_school_id is not null then
    v_school_id := v_assigned_school_id;
  elsif v_role = 'school_admin' then
    raise exception 'school_admin_school_required' using errcode = '42501';
  else
    select count(distinct class.school_id), min(class.school_id::text)::uuid
    into v_existing_school_count, v_existing_school_id
    from public.teacher_classes teacher_class
    join public.classes class on class.id = teacher_class.class_id
    where teacher_class.teacher_profile_id = v_profile_id and class.school_id is not null;
    if v_existing_school_count > 1 then
      raise exception 'teacher_school_ambiguous' using errcode = '22023';
    elsif v_existing_school_count = 1 then
      v_school_id := v_existing_school_id;
    else
      insert into public.organizations(name, type) values ('Espace enseignant', 'tutoring_center') returning id into v_organization_id;
      insert into public.schools(organization_id, name, curriculum_type)
      values (v_organization_id, 'Classe indépendante', 'independent') returning id into v_school_id;
    end if;
  end if;

  insert into public.classes(school_id, name, grade_level, academic_year)
  values (v_school_id, v_name, p_grade, v_year) returning id into v_class_id;
  if v_role = 'teacher' then
    insert into public.teacher_classes(teacher_profile_id, class_id) values (v_profile_id, v_class_id);
  end if;
  return v_class_id;
end;
$$;

revoke all on function public.create_school_with_organization(text,uuid,text,text,text,text) from public, anon;
revoke all on function public.update_school(uuid,text,text,text) from public, anon;
revoke all on function public.create_school_class(uuid,text,integer,text) from public, anon;
revoke all on function public.update_school_class(uuid,text,integer,text) from public, anon;
revoke all on function public.create_teacher_class(text,integer,text) from public, anon;
grant execute on function public.create_school_with_organization(text,uuid,text,text,text,text) to authenticated;
grant execute on function public.update_school(uuid,text,text,text) to authenticated;
grant execute on function public.create_school_class(uuid,text,integer,text) to authenticated;
grant execute on function public.update_school_class(uuid,text,integer,text) to authenticated;
grant execute on function public.create_teacher_class(text,integer,text) to authenticated;
