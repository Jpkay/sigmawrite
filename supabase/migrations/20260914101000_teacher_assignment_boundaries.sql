-- Many-to-many class and individual supervision. Existing assignments are
-- preserved; authorization is evaluated afresh on every database request.
create or replace function public.teacher_belongs_to_school(p_teacher_profile_id uuid, p_school_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_teacher_profile_id and p.role = 'teacher' and p.deactivated_at is null
      and p_school_id is not null
      and (p.school_id = p_school_id or (p.school_id is null and exists (
        select 1 from public.teacher_classes tc join public.classes c on c.id = tc.class_id
        where tc.teacher_profile_id = p.id and c.school_id = p_school_id
      )))
  )
$$;

create or replace function public.student_belongs_to_school(p_student_id uuid, p_school_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.students s where s.id = p_student_id and p_school_id is not null
      and (s.school_id = p_school_id or (s.school_id is null and exists (
        select 1 from public.enrollments e join public.classes c on c.id = e.class_id
        where e.student_id = s.id and e.status = 'active' and c.school_id = p_school_id
      )))
  )
$$;

create or replace function public.teaches_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() = 'teacher', false) and (
    exists (
      select 1 from public.teacher_students ts join public.students s on s.id = ts.student_id
      where ts.teacher_profile_id = public.current_profile_id() and ts.student_id = p_student_id
        and public.teacher_belongs_to_school(ts.teacher_profile_id, s.school_id)
    ) or exists (
      select 1 from public.enrollments e
      join public.teacher_classes tc on tc.class_id = e.class_id
      join public.classes c on c.id = tc.class_id
      where e.student_id = p_student_id and e.status = 'active'
        and tc.teacher_profile_id = public.current_profile_id()
        and public.teacher_belongs_to_school(tc.teacher_profile_id, c.school_id)
        and public.student_belongs_to_school(e.student_id, c.school_id)
    )
  )
$$;

create or replace function public.set_teacher_class(p_teacher_profile_id uuid, p_class_id uuid, p_assigned boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_school uuid;
begin
  if p_assigned is null then raise exception 'invalid_assignment'; end if;
  select school_id into v_school from public.classes where id = p_class_id for update;
  if v_school is null then raise exception 'class_not_found'; end if;
  if not (coalesce(auth.role() = 'service_role', false) or public.is_platform_admin()
    or coalesce(public.is_school_admin_of(v_school), false)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  -- A scoped administrator can remove a stale link even if its teacher was
  -- deactivated or moved. Adding access always requires a current school match.
  if p_assigned then
    perform 1 from public.profiles where id = p_teacher_profile_id for update;
    if not public.teacher_belongs_to_school(p_teacher_profile_id, v_school) then
      raise exception 'teacher_school_mismatch' using errcode = '42501';
    end if;
    insert into public.teacher_classes(teacher_profile_id, class_id)
    values(p_teacher_profile_id, p_class_id) on conflict do nothing;
  else
    delete from public.teacher_classes where teacher_profile_id = p_teacher_profile_id and class_id = p_class_id;
  end if;
  return p_assigned;
end $$;

create or replace function public.set_teacher_student(p_teacher_profile_id uuid, p_student_id uuid, p_assigned boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_school uuid;
begin
  if p_assigned is null then raise exception 'invalid_assignment'; end if;
  select school_id into v_school from public.students where id = p_student_id for update;
  if v_school is null then raise exception 'student_school_required'; end if;
  if not (coalesce(auth.role() = 'service_role', false) or public.is_platform_admin()
    or coalesce(public.is_school_admin_of(v_school), false)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_assigned then
    perform 1 from public.profiles where id = p_teacher_profile_id for update;
    if not public.teacher_belongs_to_school(p_teacher_profile_id, v_school) then
      raise exception 'teacher_school_mismatch' using errcode = '42501';
    end if;
    insert into public.teacher_students(teacher_profile_id, student_id, assigned_by_profile_id)
    values(p_teacher_profile_id, p_student_id, public.current_profile_id()) on conflict do nothing;
  else
    delete from public.teacher_students where teacher_profile_id = p_teacher_profile_id and student_id = p_student_id;
  end if;
  return p_assigned;
end $$;

-- Existing students may join an additional class in their school; this is not
-- a school-transfer API. All checks precede an atomic enrollment/direct grant.
create or replace function public.assign_student_class(p_student_id uuid, p_class_id uuid, p_teacher_profile_id uuid default null)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_school uuid;
begin
  select school_id into v_school from public.classes where id = p_class_id for update;
  if v_school is null then raise exception 'class_not_found'; end if;
  if not (public.is_platform_admin() or coalesce(public.is_school_admin_of(v_school),false)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform 1 from public.students where id = p_student_id for update;
  if not public.student_belongs_to_school(p_student_id, v_school) then
    raise exception 'student_school_mismatch' using errcode = '42501';
  end if;
  if p_teacher_profile_id is not null then
    perform 1 from public.profiles where id = p_teacher_profile_id for update;
    if not public.teacher_belongs_to_school(p_teacher_profile_id, v_school) then
      raise exception 'teacher_school_mismatch' using errcode = '42501';
    end if;
  end if;
  insert into public.enrollments(student_id,class_id,status) values(p_student_id,p_class_id,'active')
  on conflict(student_id,class_id) do update set status = 'active';
  update public.students set school_id = v_school where id = p_student_id and school_id is null;
  if p_teacher_profile_id is not null then
    perform public.set_teacher_student(p_teacher_profile_id,p_student_id,true);
  end if;
  return true;
end $$;

create or replace function public.set_class_enrollment(p_class_id uuid, p_student_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare v_school uuid;
begin
  if p_status is null or p_status not in ('active','removed') then raise exception 'invalid status'; end if;
  select school_id into v_school from public.classes where id = p_class_id for update;
  if v_school is null then raise exception 'class_not_found'; end if;
  if not (public.is_platform_admin() or coalesce(public.is_school_admin_of(v_school),false) or (
    coalesce(public.app_role() = 'teacher',false)
    and public.teacher_belongs_to_school(public.current_profile_id(), v_school)
    and exists(select 1 from public.teacher_classes where class_id = p_class_id and teacher_profile_id = public.current_profile_id())
  )) then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_status = 'active' and not public.student_belongs_to_school(p_student_id, v_school) then
    raise exception 'student_school_mismatch' using errcode = '42501';
  end if;
  update public.enrollments set status = p_status where class_id = p_class_id and student_id = p_student_id;
  if not found then raise exception 'enrollment_not_found'; end if;
end $$;

drop policy if exists teacher_students_select on public.teacher_students;
create policy teacher_students_select on public.teacher_students for select using (
  (teacher_profile_id = public.current_profile_id() and public.teaches_student(student_id))
  or public.administers_student(student_id) or public.supervises_student(student_id) or public.is_platform_admin()
);
drop policy if exists teacher_classes_select on public.teacher_classes;
create policy teacher_classes_select on public.teacher_classes for select using (
  (teacher_profile_id = public.current_profile_id()
    and public.teacher_belongs_to_school(teacher_profile_id, public.class_school_id(class_id)))
  or public.is_school_admin_of(public.class_school_id(class_id)) or public.is_platform_admin()
);

-- Read visibility must not survive an account deactivation or an invalid
-- cross-school class link. Direct student access does not grant the whole class.
drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes for select using (
  (public.app_role() = 'teacher' and public.teacher_belongs_to_school(public.current_profile_id(), classes.school_id)
    and exists (select 1 from public.teacher_classes tc where tc.class_id = classes.id and tc.teacher_profile_id = public.current_profile_id()))
  or (public.app_role() = 'supervisor' and (
    exists (select 1 from public.supervisor_classes sc where sc.class_id = classes.id and sc.supervisor_profile_id = public.current_profile_id())
    or exists (select 1 from public.supervisor_schools ss where ss.school_id = classes.school_id and ss.supervisor_profile_id = public.current_profile_id())
  )) or public.is_school_admin_of(classes.school_id) or public.is_platform_admin()
);

revoke insert, update, delete on public.teacher_students, public.teacher_classes from anon, authenticated;
revoke all on function public.teacher_belongs_to_school(uuid,uuid), public.student_belongs_to_school(uuid,uuid),
  public.set_teacher_student(uuid,uuid,boolean), public.set_teacher_class(uuid,uuid,boolean),
  public.assign_student_class(uuid,uuid,uuid), public.set_class_enrollment(uuid,uuid,text) from public, anon;
grant execute on function public.teacher_belongs_to_school(uuid,uuid), public.student_belongs_to_school(uuid,uuid),
  public.set_teacher_student(uuid,uuid,boolean), public.set_teacher_class(uuid,uuid,boolean),
  public.assign_student_class(uuid,uuid,uuid), public.set_class_enrollment(uuid,uuid,text) to authenticated, service_role;
