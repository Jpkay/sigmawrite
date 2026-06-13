-- Reading to Learn — provision a profile (and student row) on signup.
-- Supabase fires this when a new auth.users row is created; role + display
-- name come from the signUp metadata (see src/app/signup).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_profile_id uuid;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'student');

  insert into public.profiles (auth_user_id, role, display_name)
  values (new.id, v_role, new.raw_user_meta_data->>'display_name')
  returning id into v_profile_id;

  -- Students get a learning record immediately so onboarding can attach to it.
  if v_role = 'student' then
    insert into public.students (profile_id) values (v_profile_id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
