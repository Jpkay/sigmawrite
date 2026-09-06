-- Account management hardening (audit 2026-09-06).
--
-- 1. school_admin becomes a real, school-scoped role: profiles.school_id links
--    the administrator to one school; they see and manage that school's
--    classes, teachers, students and reports and nothing else. is_staff() no
--    longer includes school_admin, closing the cross-school read it granted.
-- 2. Teachers can be attached to / detached from existing classes.
-- 3. A student may have several guardians; consent is per guardian.
-- 4. Schools carry a teacher sign-up code so self-registered teachers are
--    verified against a school rather than trusted on their word.
-- 5. Profiles can be deactivated (offboarding) without deleting evidence.

alter table public.profiles
  add column if not exists school_id uuid references public.schools(id) on delete set null,
  add column if not exists deactivated_at timestamptz;
create index if not exists profiles_school_idx on public.profiles (school_id) where school_id is not null;

alter table public.schools add column if not exists teacher_code text;
create unique index if not exists schools_teacher_code_unique on public.schools (upper(teacher_code)) where teacher_code is not null;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.admin_school_id()
returns uuid language sql stable security definer set search_path = public as $$
  select p.school_id from public.profiles p
  where p.auth_user_id = auth.uid() and p.role = 'school_admin' and p.deactivated_at is null
$$;

create or replace function public.is_school_admin_of(p_school_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_school_id is not null and public.admin_school_id() = p_school_id
$$;

-- A student belongs to the administrator's school when enrolled in one of its
-- classes or created under it.
create or replace function public.administers_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.admin_school_id() is not null and (
    exists (select 1 from public.students s where s.id = p_student_id and s.school_id = public.admin_school_id())
    or exists (
      select 1 from public.enrollments e join public.classes c on c.id = e.class_id
      where e.student_id = p_student_id and e.status = 'active' and c.school_id = public.admin_school_id()
    )
  )
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() = 'platform_admin', false)
$$;

create or replace function public.can_view_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.owns_student(p_student_id)
      or public.is_guardian_of(p_student_id)
      or public.teaches_student(p_student_id)
      or public.supervises_student(p_student_id)
      or public.administers_student(p_student_id)
      or public.is_platform_admin()
$$;

-- Deactivated accounts lose their role everywhere the role is consulted.
create or replace function public.app_role()
returns text language sql stable security definer set search_path = public as $$
  select p.role from public.profiles p where p.auth_user_id = auth.uid() and p.deactivated_at is null
$$;

-- Cross-table checks used inside policies run as security definer to avoid policy recursion.
create or replace function public.class_school_id(p_class_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select c.school_id from public.classes c where c.id = p_class_id
$$;
create or replace function public.teaches_in_school(p_school_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.teacher_classes tc join public.classes c on c.id = tc.class_id
    where c.school_id = p_school_id and tc.teacher_profile_id = public.current_profile_id()
  )
$$;
create or replace function public.profile_in_admin_school(p_profile_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.admin_school_id() is not null and (
    exists (select 1 from public.profiles p where p.id = p_profile_id and p.school_id = public.admin_school_id())
    or exists (select 1 from public.students s where s.profile_id = p_profile_id and public.administers_student(s.id))
    or exists (select 1 from public.teacher_classes tc join public.classes c on c.id = tc.class_id where tc.teacher_profile_id = p_profile_id and c.school_id = public.admin_school_id())
  )
$$;
revoke all on function public.class_school_id(uuid) from public, anon;
revoke all on function public.teaches_in_school(uuid) from public, anon;
revoke all on function public.profile_in_admin_school(uuid) from public, anon;
grant execute on function public.class_school_id(uuid) to authenticated, service_role;
grant execute on function public.teaches_in_school(uuid) to authenticated, service_role;
grant execute on function public.profile_in_admin_school(uuid) to authenticated, service_role;

revoke all on function public.admin_school_id() from public, anon;
revoke all on function public.is_school_admin_of(uuid) from public, anon;
revoke all on function public.administers_student(uuid) from public, anon;
grant execute on function public.admin_school_id() to authenticated, service_role;
grant execute on function public.is_school_admin_of(uuid) to authenticated, service_role;
grant execute on function public.administers_student(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Policies: school-scoped reads for the administrator
-- ---------------------------------------------------------------------------
drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes for select using (
  exists (select 1 from public.teacher_classes tc where tc.class_id = id and tc.teacher_profile_id = public.current_profile_id())
  or exists (select 1 from public.supervisor_classes sc where sc.class_id = id and sc.supervisor_profile_id = public.current_profile_id())
  or exists (select 1 from public.supervisor_schools ss where ss.school_id = classes.school_id and ss.supervisor_profile_id = public.current_profile_id())
  or public.is_school_admin_of(classes.school_id)
  or public.is_staff()
);

drop policy if exists schools_select on public.schools;
create policy schools_select on public.schools for select using (
  public.is_staff()
  or public.is_school_admin_of(schools.id)
  or exists (select 1 from public.supervisor_schools ss where ss.school_id = schools.id and ss.supervisor_profile_id = public.current_profile_id())
  or public.teaches_in_school(schools.id)
);

drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations for select using (
  public.is_staff()
  or exists (select 1 from public.schools s where s.organization_id = organizations.id and public.is_school_admin_of(s.id))
);

drop policy if exists teacher_classes_select on public.teacher_classes;
create policy teacher_classes_select on public.teacher_classes for select using (
  teacher_profile_id = public.current_profile_id()
  or public.is_school_admin_of(public.class_school_id(class_id))
  or public.is_staff()
);

-- The administrator may read the profiles of the school's teachers and students.
drop policy if exists profiles_select_school_admin on public.profiles;
create policy profiles_select_school_admin on public.profiles for select using (
  public.profile_in_admin_school(id)
);

-- ---------------------------------------------------------------------------
-- Teacher ↔ class assignment (platform admin or the school's administrator)
-- ---------------------------------------------------------------------------
create or replace function public.set_teacher_class(p_teacher_profile_id uuid, p_class_id uuid, p_assigned boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_school uuid; v_role text;
begin
  select school_id into v_school from public.classes where id = p_class_id;
  if v_school is null and not public.is_platform_admin() and auth.role() <> 'service_role' then raise exception 'class_not_found'; end if;
  if auth.role() <> 'service_role' and not public.is_platform_admin() and not public.is_school_admin_of(v_school) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select role into v_role from public.profiles where id = p_teacher_profile_id and deactivated_at is null;
  if v_role is distinct from 'teacher' then raise exception 'not_a_teacher'; end if;
  if p_assigned then
    insert into public.teacher_classes(teacher_profile_id, class_id) values (p_teacher_profile_id, p_class_id) on conflict do nothing;
  else
    delete from public.teacher_classes where teacher_profile_id = p_teacher_profile_id and class_id = p_class_id;
  end if;
  return p_assigned;
end $$;
revoke all on function public.set_teacher_class(uuid,uuid,boolean) from public;
grant execute on function public.set_teacher_class(uuid,uuid,boolean) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Several guardians per child: consent is recorded per guardian.
-- ---------------------------------------------------------------------------
drop index if exists public.consent_records_one_active_per_student;
create unique index if not exists consent_records_one_active_per_guardian
  on public.consent_records (student_id, coalesce(guardian_profile_id, '00000000-0000-0000-0000-000000000000'::uuid)) where revoked_at is null;

-- ---------------------------------------------------------------------------
-- Teacher sign-up code per school (checked at signup by the trigger below).
-- ---------------------------------------------------------------------------
create or replace function public.validate_teacher_code(p_code text)
returns table (school_id uuid, school_name text)
language sql stable security definer set search_path = public as $$
  select s.id, s.name from public.schools s
  where s.teacher_code is not null and upper(s.teacher_code) = upper(btrim(coalesce(p_code, '')))
$$;
revoke all on function public.validate_teacher_code(text) from public;
grant execute on function public.validate_teacher_code(text) to anon, authenticated, service_role;

create or replace function public.rotate_teacher_code(p_school_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if auth.role() <> 'service_role' and not public.is_platform_admin() and not public.is_school_admin_of(p_school_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  v_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
  update public.schools set teacher_code = v_code where id = p_school_id;
  return v_code;
end $$;
revoke all on function public.rotate_teacher_code(uuid) from public;
grant execute on function public.rotate_teacher_code(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Sign-up trigger: teacher role only with a valid school teacher code.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requested_role text := coalesce(new.raw_user_meta_data->>'role', 'parent');
  v_role text;
  v_name text := new.raw_user_meta_data->>'display_name';
  v_requested_username text := lower(nullif(trim(new.raw_user_meta_data->>'username'), ''));
  v_username text;
  v_profile_id uuid;
  v_join_code text;
  v_join public.class_join_codes%rowtype;
  v_student_id uuid;
  v_school_id uuid;
  v_grade int;
  v_teacher_code text;
  v_teacher_school uuid;
begin
  v_role := case when v_requested_role in ('student','parent','teacher') then v_requested_role else 'parent' end;
  -- Self-registered teachers must present their school's teacher code (audit 2026-09-06);
  -- without a valid code the account is created as a parent and can be promoted by an admin.
  if v_role = 'teacher' then
    v_teacher_code := nullif(trim(new.raw_user_meta_data->>'teacher_code'), '');
    select s.id into v_teacher_school from public.schools s
    where s.teacher_code is not null and v_teacher_code is not null and upper(s.teacher_code) = upper(v_teacher_code);
    if v_teacher_school is null then v_role := 'parent'; end if;
  end if;
  v_username := case
    when v_requested_username ~ '^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$' then v_requested_username
    else v_role || '-' || substr(md5(new.id::text), 1, 20)
  end;

  insert into public.profiles (
    auth_user_id, role, display_name, username, school_id, email_recovery_enabled
  ) values (
    new.id,
    v_role,
    v_name,
    v_username,
    v_teacher_school,
    new.email is not null
      and lower(new.email) not like '%@accounts.sigmawrite.app'
      and lower(new.email) not like '%@students.sigmawrite.app'
  ) returning id into v_profile_id;

  if v_role = 'student' then
    insert into public.students (profile_id, display_name, date_of_birth)
    values (v_profile_id, v_name, nullif(new.raw_user_meta_data->>'date_of_birth','')::date)
    returning id into v_student_id;

    v_join_code := nullif(trim(new.raw_user_meta_data->>'join_code'), '');
    if v_join_code is not null then
      select * into v_join from public.class_join_codes join_code
      where upper(join_code.code) = upper(v_join_code)
        and join_code.revoked_at is null
        and join_code.expires_at > now()
        and join_code.uses < join_code.max_uses
      for update;
      if not found then raise exception 'invalid_or_expired_join_code' using errcode='22023'; end if;
      select class.school_id, class.grade_level into v_school_id, v_grade
      from public.classes class where class.id = v_join.class_id;
      update public.students set school_id = v_school_id, current_grade = v_grade where id = v_student_id;
      insert into public.enrollments(student_id,class_id,status) values(v_student_id,v_join.class_id,'active');
      update public.class_join_codes set uses = uses + 1 where id = v_join.id;
      if v_join.school_consent_enabled then
        insert into public.consent_records(student_id,consent_type,consent_version,privacy_policy_version)
        values(v_student_id,'school','school-v1','privacy-v1');
      end if;
    end if;
  end if;
  return new;
end;
$$;
