-- Security hardening: authorization roles are server-managed and staff access is least-privilege.

-- A signed-in user may edit presentation preferences, never their authorization role or auth binding.
revoke update on table public.profiles from anon, authenticated;
grant update (first_name, last_name, display_name, preferred_language) on table public.profiles to authenticated;

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- Public Auth metadata is attacker-controlled. Only self-service roles may be provisioned
-- by the Auth trigger; trusted service-role workflows promote invited staff afterwards.
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
  v_profile_id uuid;
  v_join_code text;
  v_join public.class_join_codes%rowtype;
  v_student_id uuid;
  v_school_id uuid;
  v_grade int;
begin
  v_role := case when v_requested_role in ('student','parent','teacher') then v_requested_role else 'parent' end;

  insert into public.profiles (auth_user_id, role, display_name)
  values (new.id, v_role, v_name)
  returning id into v_profile_id;

  if v_role = 'student' then
    insert into public.students (profile_id, display_name, date_of_birth)
    values (v_profile_id, v_name, nullif(new.raw_user_meta_data->>'date_of_birth','')::date)
    returning id into v_student_id;

    v_join_code := nullif(trim(new.raw_user_meta_data->>'join_code'), '');
    if v_join_code is not null then
      select * into v_join from public.class_join_codes j
      where upper(j.code) = upper(v_join_code)
        and j.revoked_at is null and j.expires_at > now() and j.uses < j.max_uses
      for update;
      if not found then raise exception 'invalid_or_expired_join_code' using errcode='22023'; end if;
      select c.school_id, c.grade_level into v_school_id, v_grade from public.classes c where c.id=v_join.class_id;
      update public.students set school_id=v_school_id,current_grade=v_grade where id=v_student_id;
      insert into public.enrollments(student_id,class_id,status) values(v_student_id,v_join.class_id,'active');
      update public.class_join_codes set uses=uses+1 where id=v_join.id;
      if v_join.school_consent_enabled then
        insert into public.consent_records(student_id,consent_type,consent_version,privacy_policy_version)
        values(v_student_id,'school','school-v1','privacy-v1');
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- Content reviewers curate content, but must never inherit learner/report access.
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() in ('platform_admin','school_admin'), false)
$$;

-- Content write policies use a dedicated role check.
create or replace function public.is_content_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() in ('platform_admin','content_reviewer'), false)
$$;

-- Remove broad report/enrollment visibility. School-admin scoping requires an explicit
-- organization membership model; until then fail closed rather than leak cross-school data.
drop policy if exists enrollments_select on public.enrollments;
create policy enrollments_select on public.enrollments for select using (
  public.can_view_student(student_id) or public.is_platform_admin()
);
drop policy if exists teacher_reports_select on public.teacher_reports;
create policy teacher_reports_select on public.teacher_reports for select using (
  exists(select 1 from public.teacher_classes tc where tc.class_id=teacher_reports.class_id and tc.teacher_profile_id=public.current_profile_id())
  or public.is_platform_admin()
);

-- Replace legacy broad content policies created in 0002.
do $$
declare t text;
begin
  foreach t in array array['skills','knowledge_domains','knowledge_concepts','vocabulary_items','texts','text_versions','questions','question_choices','text_skills','question_skills','text_vocabulary','prompt_versions','ai_generation_jobs','ai_generated_candidates','ai_scoring_results','ai_moderation_results'] loop
    execute format('drop policy if exists %I on %I', t || '_staff_write', t);
    -- Some catalog tables acquired the target policy name in later migrations.
    -- Drop it as well so this hardening migration works on both a fresh schema
    -- and long-lived environments with the complete pre-0077 history.
    execute format('drop policy if exists %I on %I', t || '_content_write', t);
    execute format('create policy %I on %I for all using (public.is_content_staff()) with check (public.is_content_staff())', t || '_content_write', t);
  end loop;
end $$;

revoke execute on function public.is_content_staff() from anon;
grant execute on function public.is_content_staff() to authenticated, service_role;
