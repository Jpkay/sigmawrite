-- Sprint 4: class join codes, student account provisioning and enforceable consent.

create table class_join_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  class_id uuid not null references classes(id) on delete cascade,
  expires_at timestamptz not null,
  max_uses integer not null default 40 check (max_uses between 1 and 500),
  uses integer not null default 0 check (uses >= 0),
  school_consent_enabled boolean not null default false,
  created_by_profile_id uuid references profiles(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index class_join_codes_code_unique on class_join_codes (upper(code));
create index class_join_codes_class_active_idx on class_join_codes (class_id, expires_at desc)
  where revoked_at is null;

alter table class_join_codes enable row level security;

create or replace function public.teaches_class(p_class_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from teacher_classes
    where class_id = p_class_id and teacher_profile_id = public.current_profile_id()
  )
$$;

create policy class_join_codes_teacher_select on class_join_codes
  for select using (public.teaches_class(class_id) or public.is_platform_admin());
create policy class_join_codes_teacher_insert on class_join_codes
  for insert with check (
    (public.teaches_class(class_id) or public.is_platform_admin())
    and created_by_profile_id = public.current_profile_id()
  );
create policy class_join_codes_teacher_update on class_join_codes
  for update using (public.teaches_class(class_id) or public.is_platform_admin())
  with check (public.teaches_class(class_id) or public.is_platform_admin());

create or replace function public.validate_class_join_code(p_code text)
returns table (class_name text, school_name text, school_consent_enabled boolean)
language sql stable security definer set search_path = public as $$
  select c.name, s.name, j.school_consent_enabled
  from class_join_codes j
  join classes c on c.id = j.class_id
  join schools s on s.id = c.school_id
  where upper(j.code) = upper(trim(p_code))
    and j.revoked_at is null
    and j.expires_at > now()
    and j.uses < j.max_uses
  limit 1
$$;

revoke all on function public.validate_class_join_code(text) from public;
grant execute on function public.validate_class_join_code(text) to anon, authenticated;

-- Only the actual guardian or an age-eligible student can create consent.
drop policy if exists consent_insert on consent_records;
create policy consent_guardian_insert on consent_records
  for insert with check (
    consent_type = 'guardian'
    and guardian_profile_id = public.current_profile_id()
    and public.is_guardian_of(student_id)
  );
create policy consent_student_insert on consent_records
  for insert with check (
    consent_type = 'student_over_15'
    and guardian_profile_id is null
    and public.owns_student(student_id)
    and exists (
      select 1 from students s
      where s.id = student_id and s.date_of_birth <= current_date - interval '15 years'
    )
  );
create policy consent_guardian_update on consent_records
  for update using (
    consent_type = 'guardian'
    and guardian_profile_id = public.current_profile_id()
    and public.is_guardian_of(student_id)
  ) with check (
    consent_type = 'guardian'
    and guardian_profile_id = public.current_profile_id()
    and public.is_guardian_of(student_id)
  );
create policy consent_student_update on consent_records
  for update using (consent_type = 'student_over_15' and public.owns_student(student_id))
  with check (consent_type = 'student_over_15' and public.owns_student(student_id));

create unique index consent_records_one_active_per_student
  on consent_records (student_id) where revoked_at is null;

-- Provision a student from trusted, database-validated join-code metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_profile_id uuid;
  v_student_id uuid;
  v_join_code text;
  v_join class_join_codes%rowtype;
  v_school_id uuid;
  v_grade integer;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'student');
  if v_role not in ('student','parent','teacher','school_admin','platform_admin','content_reviewer') then
    raise exception 'Invalid account role';
  end if;

  insert into public.profiles (auth_user_id, role, display_name)
  values (new.id, v_role, nullif(trim(new.raw_user_meta_data->>'display_name'), ''))
  returning id into v_profile_id;

  if v_role = 'student' then
    insert into public.students (profile_id, display_name, date_of_birth)
    values (
      v_profile_id,
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      nullif(new.raw_user_meta_data->>'date_of_birth', '')::date
    ) returning id into v_student_id;

    v_join_code := nullif(trim(new.raw_user_meta_data->>'join_code'), '');
    if v_join_code is not null then
      select j.* into v_join
      from class_join_codes j
      where upper(j.code) = upper(v_join_code)
        and j.revoked_at is null
        and j.expires_at > now()
        and j.uses < j.max_uses
      for update;
      if not found then raise exception 'Class join code is invalid or expired'; end if;

      select c.school_id, c.grade_level into v_school_id, v_grade
      from classes c where c.id = v_join.class_id;
      update students set school_id = v_school_id, current_grade = v_grade where id = v_student_id;
      insert into enrollments (student_id, class_id, status)
      values (v_student_id, v_join.class_id, 'active');
      update class_join_codes set uses = uses + 1 where id = v_join.id;

      if v_join.school_consent_enabled then
        insert into consent_records
          (student_id, consent_type, consent_version, privacy_policy_version)
        values (v_student_id, 'school', 'school-v1', 'privacy-v1');
      end if;
    end if;
  end if;
  return new;
end;
$$;

comment on column classes.join_code is
  'Deprecated by class_join_codes. Retained read-only until Sprint 19 cleanup.';
