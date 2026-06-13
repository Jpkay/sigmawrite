-- Reading to Learn — support parent/teacher dashboards (PRD §M, §N).
-- profiles are self-only under RLS, so a viewer can't read a student's name via
-- the profile. Denormalise the display name onto students (which guardians/
-- teachers CAN read via can_view_student), and let teachers read their classes.

alter table students add column if not exists display_name text;

-- Trigger now also stamps the student's display name.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_name text;
  v_profile_id uuid;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'student');
  v_name := new.raw_user_meta_data->>'display_name';

  insert into public.profiles (auth_user_id, role, display_name)
  values (new.id, v_role, v_name)
  returning id into v_profile_id;

  if v_role = 'student' then
    insert into public.students (profile_id, display_name) values (v_profile_id, v_name);
  end if;

  return new;
end;
$$;

-- Backfill existing students from their profile.
update students s
set display_name = p.display_name
from profiles p
where p.id = s.profile_id and s.display_name is null;

-- Teachers can read the classes they teach (and staff can read all).
create policy classes_select on classes
  for select using (
    exists (
      select 1 from teacher_classes tc
      where tc.class_id = id and tc.teacher_profile_id = public.current_profile_id()
    )
    or public.is_staff()
  );
