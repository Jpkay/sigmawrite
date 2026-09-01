-- Managed credentials, username login, first-login password rotation, and
-- privacy-scoped supervisor access.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('student','parent','teacher','supervisor','school_admin','platform_admin','content_reviewer'));

alter table public.profiles
  add column if not exists username text,
  add column if not exists must_change_password boolean not null default false,
  add column if not exists email_recovery_enabled boolean not null default false,
  add column if not exists provisioned_by_profile_id uuid references public.profiles(id) on delete set null;

update public.profiles
set username = role || '-' || substr(md5(id::text), 1, 20)
where username is null;

update public.profiles profile
set email_recovery_enabled = true
from auth.users auth_user
where auth_user.id = profile.auth_user_id
  and auth_user.email is not null
  and lower(auth_user.email) not like '%@accounts.sigmawrite.app'
  and lower(auth_user.email) not like '%@students.sigmawrite.app';

alter table public.profiles alter column username set not null;
alter table public.profiles add constraint profiles_username_format_check
  check (username = lower(username) and username ~ '^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$');
create unique index profiles_username_lower_unique on public.profiles (lower(username));

create table public.teacher_students (
  teacher_profile_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  assigned_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (teacher_profile_id, student_id)
);

create table public.supervisor_schools (
  supervisor_profile_id uuid not null references public.profiles(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  assigned_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (supervisor_profile_id, school_id)
);

create table public.supervisor_classes (
  supervisor_profile_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  assigned_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (supervisor_profile_id, class_id)
);

create table public.supervisor_students (
  supervisor_profile_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  assigned_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (supervisor_profile_id, student_id)
);

create index teacher_students_student_idx on public.teacher_students (student_id);
create index supervisor_schools_school_idx on public.supervisor_schools (school_id);
create index supervisor_classes_class_idx on public.supervisor_classes (class_id);
create index supervisor_students_student_idx on public.supervisor_students (student_id);

alter table public.teacher_students enable row level security;
alter table public.supervisor_schools enable row level security;
alter table public.supervisor_classes enable row level security;
alter table public.supervisor_students enable row level security;

create or replace function public.teaches_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.teacher_students direct_assignment
    where direct_assignment.student_id = p_student_id
      and direct_assignment.teacher_profile_id = public.current_profile_id()
  ) or exists (
    select 1
    from public.enrollments enrollment
    join public.teacher_classes teacher_class on teacher_class.class_id = enrollment.class_id
    where enrollment.student_id = p_student_id
      and enrollment.status = 'active'
      and teacher_class.teacher_profile_id = public.current_profile_id()
  )
$$;

create or replace function public.supervises_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.app_role() = 'supervisor' and (
    exists (
      select 1 from public.supervisor_students direct_assignment
      where direct_assignment.student_id = p_student_id
        and direct_assignment.supervisor_profile_id = public.current_profile_id()
    )
    or exists (
      select 1
      from public.enrollments enrollment
      join public.supervisor_classes supervisor_class on supervisor_class.class_id = enrollment.class_id
      where enrollment.student_id = p_student_id
        and enrollment.status = 'active'
        and supervisor_class.supervisor_profile_id = public.current_profile_id()
    )
    or exists (
      select 1
      from public.students student
      join public.supervisor_schools supervisor_school on supervisor_school.school_id = student.school_id
      where student.id = p_student_id
        and supervisor_school.supervisor_profile_id = public.current_profile_id()
    )
  )
$$;

create or replace function public.can_view_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.owns_student(p_student_id)
      or public.is_guardian_of(p_student_id)
      or public.teaches_student(p_student_id)
      or public.supervises_student(p_student_id)
      or public.is_platform_admin()
$$;

revoke all on function public.supervises_student(uuid) from public, anon;
grant execute on function public.supervises_student(uuid) to authenticated, service_role;

create policy teacher_students_select on public.teacher_students for select using (
  teacher_profile_id = public.current_profile_id()
  or public.supervises_student(student_id)
  or public.is_platform_admin()
);
create policy supervisor_schools_select on public.supervisor_schools for select using (
  supervisor_profile_id = public.current_profile_id() or public.is_platform_admin()
);
create policy supervisor_classes_select on public.supervisor_classes for select using (
  supervisor_profile_id = public.current_profile_id() or public.is_platform_admin()
);
create policy supervisor_students_select on public.supervisor_students for select using (
  supervisor_profile_id = public.current_profile_id() or public.is_platform_admin()
);

drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes for select using (
  exists (
    select 1 from public.teacher_classes teacher_class
    where teacher_class.class_id = id
      and teacher_class.teacher_profile_id = public.current_profile_id()
  )
  or exists (
    select 1 from public.supervisor_classes supervisor_class
    where supervisor_class.class_id = id
      and supervisor_class.supervisor_profile_id = public.current_profile_id()
  )
  or exists (
    select 1 from public.supervisor_schools supervisor_school
    where supervisor_school.school_id = classes.school_id
      and supervisor_school.supervisor_profile_id = public.current_profile_id()
  )
  or public.is_staff()
);

drop policy if exists schools_select on public.schools;
create policy schools_select on public.schools for select using (
  public.is_staff()
  or exists (
    select 1 from public.supervisor_schools supervisor_school
    where supervisor_school.school_id = schools.id
      and supervisor_school.supervisor_profile_id = public.current_profile_id()
  )
);

drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations for select using (
  public.is_staff()
  or exists (
    select 1
    from public.schools school
    join public.supervisor_schools supervisor_school on supervisor_school.school_id = school.id
    where school.organization_id = organizations.id
      and supervisor_school.supervisor_profile_id = public.current_profile_id()
  )
);

-- Self-service users get a safe generated username. Trusted provisioning
-- workflows replace it with the requested username after the Auth trigger.
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
begin
  v_role := case when v_requested_role in ('student','parent','teacher') then v_requested_role else 'parent' end;
  v_username := case
    when v_requested_username ~ '^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$' then v_requested_username
    else v_role || '-' || substr(md5(new.id::text), 1, 20)
  end;

  insert into public.profiles (
    auth_user_id, role, display_name, username, email_recovery_enabled
  ) values (
    new.id,
    v_role,
    v_name,
    v_username,
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

grant select on public.teacher_students, public.supervisor_schools,
  public.supervisor_classes, public.supervisor_students to authenticated;
