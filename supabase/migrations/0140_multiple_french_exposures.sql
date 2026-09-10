begin;

alter table public.learner_profiles
  add column exposures text[] not null default '{}'::text[]
  check (
    cardinality(exposures) <= 5
    and array_position(exposures, null) is null
    and exposures <@ array['home','school','class_only','immersion','self_study']::text[]
  );

update public.learner_profiles set exposures = array[exposure]
where exposure is not null;

-- Keep the existing RPC available to older clients. The new RPC saves all
-- selections in the same transaction as the rest of onboarding.
create function public.complete_student_onboarding_with_exposures(
  p_student_id uuid,
  p_grade integer,
  p_french_background text,
  p_interests text[],
  p_student_type text,
  p_home_language text,
  p_exposures text[],
  p_goal_type text,
  p_target_framework text,
  p_target_level text,
  p_target_grade numeric,
  p_scope jsonb
) returns integer
language plpgsql security definer set search_path=public as $$
declare
  v_grade integer;
  v_exposures text[];
begin
  if auth.role()<>'service_role' and not public.owns_student(p_student_id) then
    raise exception 'forbidden' using errcode='42501';
  end if;
  if p_exposures is null or cardinality(p_exposures)>5
    or array_position(p_exposures,null) is not null
    or not (p_exposures <@ array['home','school','class_only','immersion','self_study']::text[])
  then raise exception 'invalid_exposures' using errcode='22023'; end if;

  select coalesce(array_agg(value order by first_position), '{}'::text[])
  into v_exposures
  from (
    select value, min(position) first_position
    from unnest(p_exposures) with ordinality as selected(value, position)
    group by value
  ) selections;

  v_grade := public.complete_student_onboarding(
    p_student_id,p_grade,p_french_background,p_interests,p_student_type,
    p_home_language,v_exposures[1],p_goal_type,p_target_framework,
    p_target_level,p_target_grade,p_scope
  );
  update public.learner_profiles
  set exposures=v_exposures
  where student_id=p_student_id;
  return v_grade;
end
$$;

revoke all on function public.complete_student_onboarding_with_exposures(
  uuid,integer,text,text[],text,text,text[],text,text,text,numeric,jsonb
) from public,anon;
grant execute on function public.complete_student_onboarding_with_exposures(
  uuid,integer,text,text[],text,text,text[],text,text,text,numeric,jsonb
) to authenticated,service_role;

commit;
