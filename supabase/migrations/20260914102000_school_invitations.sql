-- Bounded, school-scoped class invitations.
-- Rotation is one database transaction so concurrent assigned teachers cannot
-- leave two usable codes or revoke the last code without creating its successor.

create or replace function public.can_manage_class_invitations(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(exists (
    select 1
    from public.classes class
    where class.id = p_class_id
      and (
        (
          coalesce(public.app_role() = 'teacher', false)
          and public.teacher_belongs_to_school(public.current_profile_id(), class.school_id)
          and exists (
            select 1
            from public.teacher_classes assignment
            where assignment.class_id = class.id
              and assignment.teacher_profile_id = public.current_profile_id()
          )
        )
        or (
          coalesce(public.app_role() = 'school_admin', false)
          and coalesce(public.is_school_admin_of(class.school_id), false)
        )
        or coalesce(public.is_platform_admin(), false)
      )
  ), false)
$$;

revoke all on function public.can_manage_class_invitations(uuid) from public, anon;
grant execute on function public.can_manage_class_invitations(uuid) to authenticated, service_role;

-- Never choose a winner silently if historical concurrent rotations left more
-- than one unrevoked row. Production preflight found none; any future conflict
-- stops this migration for explicit owner review.
do $$
begin
  if exists (
    select 1 from public.class_join_codes
    where revoked_at is null
    group by class_id
    having count(*) > 1
  ) then
    raise exception 'duplicate_unrevoked_class_join_codes' using errcode = '23505';
  end if;
end
$$;

create unique index if not exists class_join_codes_one_unrevoked_per_class
  on public.class_join_codes(class_id)
  where revoked_at is null;

drop policy if exists class_join_codes_teacher_select on public.class_join_codes;
drop policy if exists class_join_codes_teacher_insert on public.class_join_codes;
drop policy if exists class_join_codes_teacher_update on public.class_join_codes;
drop policy if exists class_join_codes_manager_select on public.class_join_codes;
create policy class_join_codes_manager_select on public.class_join_codes
  for select using (public.can_manage_class_invitations(class_id));

-- Mutations go through the atomic RPC. The security-definer owner retains the
-- table privileges required by the function; clients retain scoped SELECT only.
revoke insert, update, delete on public.class_join_codes from anon, authenticated;

create or replace function public.rotate_class_join_code(
  p_class_id uuid,
  p_expires_in_days integer,
  p_max_uses integer
)
returns table (
  id uuid,
  code text,
  class_id uuid,
  expires_at timestamptz,
  max_uses integer,
  uses integer,
  school_consent_enabled boolean
)
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_actor_profile_id uuid;
  v_code text;
  v_attempt integer;
begin
  if p_expires_in_days is null or p_expires_in_days < 1 or p_expires_in_days > 90
    or p_max_uses is null or p_max_uses < 1 or p_max_uses > 500 then
    raise exception 'invalid_invite_limits' using errcode = '22023';
  end if;

  -- This row lock serializes every rotation for a class, including rotations by
  -- different assigned teachers and the school's administrator.
  perform 1 from public.classes class where class.id = p_class_id for update;
  if not found then raise exception 'class_not_found' using errcode = 'P0002'; end if;

  if not (
    coalesce(auth.role() = 'service_role', false)
    or public.can_manage_class_invitations(p_class_id)
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_actor_profile_id := public.current_profile_id();
  update public.class_join_codes join_code
  set revoked_at = now()
  where join_code.class_id = p_class_id and join_code.revoked_at is null;

  for v_attempt in 1..5 loop
    v_code := 'SW-' || upper(encode(gen_random_bytes(16), 'hex'));
    begin
      return query
      insert into public.class_join_codes as join_code (
        code,
        class_id,
        expires_at,
        max_uses,
        uses,
        school_consent_enabled,
        created_by_profile_id
      ) values (
        v_code,
        p_class_id,
        now() + make_interval(days => p_expires_in_days),
        p_max_uses,
        0,
        true,
        v_actor_profile_id
      )
      returning
        join_code.id,
        join_code.code,
        join_code.class_id,
        join_code.expires_at,
        join_code.max_uses,
        join_code.uses,
        join_code.school_consent_enabled;
      return;
    exception when unique_violation then
      if v_attempt = 5 then
        raise exception 'invite_code_generation_failed' using errcode = 'P0001';
      end if;
    end;
  end loop;
end
$$;

revoke all on function public.rotate_class_join_code(uuid, integer, integer) from public, anon;
grant execute on function public.rotate_class_join_code(uuid, integer, integer) to authenticated, service_role;

comment on function public.rotate_class_join_code(uuid, integer, integer) is
  'Atomically replaces one class invitation after active role, assignment, and school-scope checks.';

-- Public teacher signup fails closed when a code is missing or was rotated.
-- Managed teacher provisioning requests the parent trigger role and performs a
-- separate service-authorized promotion, so this check cannot block that path.
create or replace function public.validate_teacher_signup_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_code text;
begin
  if coalesce(new.raw_user_meta_data->>'role', 'parent') = 'teacher' then
    v_teacher_code := nullif(btrim(new.raw_user_meta_data->>'teacher_code'), '');
    if not exists (
      select 1 from public.schools school
      where school.teacher_code is not null
        and v_teacher_code is not null
        and upper(school.teacher_code) = upper(v_teacher_code)
    ) then
      raise exception 'teacher_code_invalid' using errcode = '22023';
    end if;
  end if;
  return new;
end
$$;

revoke all on function public.validate_teacher_signup_code() from public, anon, authenticated;
drop trigger if exists validate_teacher_signup_code_before_insert on auth.users;
create trigger validate_teacher_signup_code_before_insert
  before insert on auth.users
  for each row execute function public.validate_teacher_signup_code();
