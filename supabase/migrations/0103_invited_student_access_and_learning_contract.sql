-- An accepted invitation is the access authorization. Students must never be
-- enrolled into a class and then stranded behind an age-based consent screen.
-- Keep consent_records as the immutable authorization/revocation audit trail,
-- while active enrollment remains the live institutional authorization.

begin;

update public.class_join_codes set school_consent_enabled=true
where not school_consent_enabled;
alter table public.class_join_codes alter column school_consent_enabled set default true;
alter table public.class_join_codes drop constraint if exists class_join_codes_invites_authorize_check;
alter table public.class_join_codes add constraint class_join_codes_invites_authorize_check
  check (school_consent_enabled);
comment on column public.class_join_codes.school_consent_enabled is
  'Deprecated compatibility field. Every valid class invitation authorizes student access.';

-- A later global hardening migration revoked every anonymous function grant,
-- including this intentionally public invitation lookup. Restore only the
-- narrow read-only RPC needed before a student has an account.
revoke all on function public.validate_class_join_code(text) from public;
grant execute on function public.validate_class_join_code(text) to anon,authenticated;

create or replace function public.record_enrollment_authorization()
returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if new.status='active' then
    insert into public.consent_records(
      student_id,consent_type,consent_version,privacy_policy_version
    ) values (
      new.student_id,'school','school-invitation-v1','privacy-v1'
    )
    on conflict (student_id) where revoked_at is null do nothing;
  end if;
  return new;
end
$$;

drop trigger if exists enrollment_records_authorization on public.enrollments;
create constraint trigger enrollment_records_authorization
after insert or update on public.enrollments
deferrable initially deferred
for each row execute function public.record_enrollment_authorization();

create or replace function public.revoke_institutional_authorization_without_enrollment()
returns trigger
language plpgsql security definer set search_path=public as $$
declare
  v_student_id uuid:=coalesce(new.student_id,old.student_id);
begin
  if not exists (
    select 1 from public.enrollments enrollment
    where enrollment.student_id=v_student_id and enrollment.status='active'
  ) then
    update public.consent_records set revoked_at=now()
    where student_id=v_student_id
      and consent_type='school'
      and revoked_at is null;
  end if;
  return coalesce(new,old);
end
$$;

drop trigger if exists enrollment_withdraws_institutional_authorization on public.enrollments;
create trigger enrollment_withdraws_institutional_authorization
after update of status or delete on public.enrollments
for each row execute function public.revoke_institutional_authorization_without_enrollment();

insert into public.consent_records(
  student_id,consent_type,consent_version,privacy_policy_version
)
select distinct enrollment.student_id,'school','school-invitation-v1','privacy-v1'
from public.enrollments enrollment
where enrollment.status='active'
  and not exists (
    select 1 from public.consent_records consent
    where consent.student_id=enrollment.student_id
      and consent.revoked_at is null
  )
on conflict (student_id) where revoked_at is null do nothing;

update public.consent_records consent set revoked_at=now()
where consent.consent_type='school'
  and consent.revoked_at is null
  and not exists (
    select 1 from public.enrollments enrollment
    where enrollment.student_id=consent.student_id
      and enrollment.status='active'
  );

create or replace function public.student_access_is_authorized(p_student_id uuid)
returns boolean
language sql stable security definer set search_path=public as $$
  select case
    when coalesce(auth.role(),'') not in ('service_role','authenticated') then false
    when auth.role()='authenticated' and not public.owns_student(p_student_id) then false
    else
      exists (
        select 1 from public.enrollments enrollment
        where enrollment.student_id=p_student_id and enrollment.status='active'
      )
      or exists (
        select 1 from public.consent_records consent
        where consent.student_id=p_student_id
          and consent.revoked_at is null
      )
  end
$$;

revoke all on function public.student_access_is_authorized(uuid) from public,anon;
grant execute on function public.student_access_is_authorized(uuid) to authenticated,service_role;

alter table public.student_learning_paths
  add column if not exists diagnostic_taxonomy_release_id uuid
    references public.taxonomy_releases(id) on delete restrict,
  add column if not exists taxonomy_transition_key text;

update public.student_learning_paths path
set diagnostic_taxonomy_release_id=run.taxonomy_release_id,
    taxonomy_transition_key=case
      when path.taxonomy_release_id=run.taxonomy_release_id then null
      when source.release_key='french-taxonomy-v2'
        and destination.release_key='french-taxonomy-v3'
        then 'french-v2-to-v3-stable-key-v1'
      else path.taxonomy_transition_key
    end
from public.diagnostic_runs run
join public.taxonomy_releases source on source.id=run.taxonomy_release_id
join public.taxonomy_releases destination on true
where path.source_diagnostic_run_id=run.id
  and destination.id=path.taxonomy_release_id;

alter table public.student_learning_paths
  alter column diagnostic_taxonomy_release_id set not null;
alter table public.student_learning_paths drop constraint if exists student_learning_paths_taxonomy_transition_check;
alter table public.student_learning_paths add constraint student_learning_paths_taxonomy_transition_check check (
  (taxonomy_release_id=diagnostic_taxonomy_release_id and taxonomy_transition_key is null)
  or taxonomy_transition_key='french-v2-to-v3-stable-key-v1'
);

create or replace function public.pin_learning_path_taxonomy_transition()
returns trigger
language plpgsql security definer set search_path=public as $$
declare
  v_source_key text;
  v_destination_key text;
begin
  if new.diagnostic_taxonomy_release_id is null then
    select run.taxonomy_release_id into new.diagnostic_taxonomy_release_id
    from public.diagnostic_runs run where run.id=new.source_diagnostic_run_id;
  end if;
  if new.taxonomy_release_id<>new.diagnostic_taxonomy_release_id
    and new.taxonomy_transition_key is null
  then
    select release_key into v_source_key from public.taxonomy_releases
    where id=new.diagnostic_taxonomy_release_id;
    select release_key into v_destination_key from public.taxonomy_releases
    where id=new.taxonomy_release_id;
    if v_source_key='french-taxonomy-v2' and v_destination_key='french-taxonomy-v3' then
      new.taxonomy_transition_key:='french-v2-to-v3-stable-key-v1';
    end if;
  end if;
  return new;
end
$$;

drop trigger if exists learning_path_pins_taxonomy_transition on public.student_learning_paths;
create trigger learning_path_pins_taxonomy_transition
before insert or update of source_diagnostic_run_id,taxonomy_release_id,diagnostic_taxonomy_release_id,taxonomy_transition_key
on public.student_learning_paths
for each row execute function public.pin_learning_path_taxonomy_transition();

create or replace function public.student_learning_is_unlocked(
  p_student_id uuid
) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when coalesce(auth.role(),'') not in ('service_role','authenticated')
      then false
    when auth.role()='authenticated'
      and not public.owns_student(p_student_id)
      then false
    when not public.student_access_is_authorized(p_student_id)
      then false
    else exists (
      select 1
      from public.diagnostic_runs run
      join public.taxonomy_releases taxonomy
        on taxonomy.id=run.taxonomy_release_id
      join public.diagnostic_item_bank_releases bank
        on bank.id=run.item_bank_release_id
        and bank.taxonomy_release_id=taxonomy.id
      join public.learning_goals goal
        on goal.id=run.learning_goal_id
        and goal.student_id=run.student_id
        and goal.status='active'
      where run.student_id=p_student_id
        and run.status='completed'
        and run.completed_at is not null
        and run.current_section is null
        and run.protocol_version='graph-sections-v2'
        and run.total_min_probes=32
        and run.total_max_probes=80
        and run.probe_count between 32 and 80
        and taxonomy.release_key='french-taxonomy-v2'
        and taxonomy.version='2.0.0'
        and taxonomy.status='published'
        and taxonomy.manifest_checksum=
          'sha256:809df529f0934fc8b68dcf23d00a18238a9c01490f4a985b4fa4246751a1fc4b'
        and taxonomy.validation_report @> '{"valid":true}'::jsonb
        and bank.bank_key='french-diagnostic-bank-v2'
        and bank.version='2.0.0'
        and bank.status='published'
        and nullif(btrim(bank.manifest_checksum),'') is not null
        and bank.manifest->>'checksum'=bank.manifest_checksum
        and bank.validation_report @> '{"valid":true}'::jsonb
        and (
          select count(*)=4 and coalesce(bool_and(
            section.status='completed'
            and section.min_probes=8
            and section.max_probes=20
            and section.min_distinct_nodes=6
            and section.probe_count between 8 and 20
            and section.distinct_nodes_tested>=6
            and section.completed_at is not null
          ),false)
          from public.diagnostic_run_sections section
          where section.run_id=run.id
        )
        and exists (
          select 1 from public.diagnostic_results result
          where result.diagnostic_run_id=run.id
            and result.student_id=run.student_id
            and result.completed_at=run.completed_at
        )
        and exists (
          select 1 from public.student_reading_estimates estimate
          where estimate.diagnostic_run_id=run.id
            and estimate.student_id=run.student_id
            and estimate.estimate_type='adaptive_diagnostic'
            and estimate.evidence_count=run.probe_count
        )
        and exists (
          select 1
          from public.student_learning_paths path
          join public.taxonomy_releases path_taxonomy
            on path_taxonomy.id=path.taxonomy_release_id
          where path.source_diagnostic_run_id=run.id
            and path.student_id=run.student_id
            and path.learning_goal_id=run.learning_goal_id
            and path.diagnostic_taxonomy_release_id=run.taxonomy_release_id
            and path.status in ('active','completed')
            and (
              path.taxonomy_release_id=run.taxonomy_release_id
              or (
                path.taxonomy_transition_key='french-v2-to-v3-stable-key-v1'
                and path_taxonomy.release_key='french-taxonomy-v3'
                and path_taxonomy.version='3.0.0'
                and path_taxonomy.status='published'
                and path_taxonomy.manifest_checksum=
                  'sha256:ef2b63974c580b3070c879125b23567cdf6be703c344d0365b998d1f0f14e880'
                and path_taxonomy.validation_report @> '{"valid":true}'::jsonb
                and not exists (
                  select 1
                  from public.student_learning_path_steps step
                  where step.path_id=path.id
                    and not exists (
                      select 1
                      from public.taxonomy_release_memberships membership
                      where membership.release_id=path.taxonomy_release_id
                        and membership.record_type='competency_node'
                        and membership.record_id=step.node_id
                    )
                )
              )
            )
        )
    )
  end
$$;

revoke all on function public.student_learning_is_unlocked(uuid) from public,anon;
grant execute on function public.student_learning_is_unlocked(uuid) to authenticated,service_role;

create or replace function public.complete_student_onboarding(
  p_student_id uuid,
  p_grade integer,
  p_french_background text,
  p_interests text[],
  p_student_type text,
  p_home_language text,
  p_exposure text,
  p_goal_type text,
  p_target_framework text,
  p_target_level text,
  p_target_grade numeric,
  p_scope jsonb
) returns integer
language plpgsql security definer set search_path=public as $$
declare
  v_grade integer;
begin
  if auth.role()<>'service_role' and not public.owns_student(p_student_id) then
    raise exception 'forbidden' using errcode='42501';
  end if;
  if p_grade not between 5 and 12 then
    raise exception 'unsupported_grade' using errcode='22023';
  end if;
  if coalesce(cardinality(p_interests),0)<3 then
    raise exception 'three_interests_required' using errcode='22023';
  end if;
  if p_student_type not in (
    'french_first_language','french_second_language','heritage',
    'bilingual','allophone','immersion'
  ) then raise exception 'invalid_student_type' using errcode='22023'; end if;
  if p_target_framework not in ('native_grade','cefr') then
    raise exception 'invalid_target_framework' using errcode='22023';
  end if;
  if p_target_framework='cefr' and p_target_level not in ('A1','A2','B1','B2','C1','C2') then
    raise exception 'explicit_cefr_target_required' using errcode='22023';
  end if;

  select coalesce(student.current_grade,p_grade) into v_grade
  from public.students student
  where student.id=p_student_id
  for update;
  if v_grade is null then raise exception 'student_not_found' using errcode='P0002'; end if;

  delete from public.student_interests where student_id=p_student_id;
  insert into public.student_interests(student_id,interest_key,declared_strength)
  select p_student_id,interest_key,1
  from (select distinct unnest(p_interests) interest_key) selected
  where nullif(btrim(interest_key),'') is not null;

  insert into public.learner_profiles(
    student_id,student_type,home_language,exposure,updated_at
  ) values (
    p_student_id,p_student_type,nullif(btrim(p_home_language),''),p_exposure,now()
  ) on conflict(student_id) do update set
    student_type=excluded.student_type,
    home_language=excluded.home_language,
    exposure=excluded.exposure,
    updated_at=excluded.updated_at;

  update public.learning_goals set status='paused'
  where student_id=p_student_id and status='active';
  insert into public.learning_goals(
    student_id,goal_type,target_framework,target_level,target_grade,scope,status
  ) values (
    p_student_id,p_goal_type,p_target_framework,p_target_level,p_target_grade,
    p_scope,'active'
  );

  update public.students set
    current_grade=v_grade,
    french_background=p_french_background,
    onboarding_completed_at=now()
  where id=p_student_id;

  return v_grade;
end
$$;

revoke all on function public.complete_student_onboarding(
  uuid,integer,text,text[],text,text,text,text,text,text,numeric,jsonb
) from public,anon;
grant execute on function public.complete_student_onboarding(
  uuid,integer,text,text[],text,text,text,text,text,text,numeric,jsonb
) to authenticated,service_role;

commit;
