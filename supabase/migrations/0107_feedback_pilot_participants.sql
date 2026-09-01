-- Distinguish disposable internal test accounts from real students who have
-- voluntarily joined the feedback pilot. Their provisional diagnostic access
-- remains isolated by the controls introduced in migration 0070.

begin;

-- Forward-fix older hosted databases where a broad historical table grant may
-- have left anonymous SELECT behind migration 0093's narrower revocations.
revoke all on public.competency_item_review_assignments from anon,authenticated;
grant select on public.competency_item_review_assignments to authenticated;

alter table public.diagnostic_pilot_enrollments
  add column cohort_kind text not null default 'internal_test'
    check (cohort_kind in ('internal_test','feedback_participant')),
  add column feedback_agreement_source text
    check (feedback_agreement_source in ('student','guardian')),
  add column feedback_agreement_version text,
  add column feedback_agreed_at timestamptz;

alter table public.diagnostic_pilot_enrollments
  add constraint diagnostic_pilot_feedback_agreement_check check (
    (
      cohort_kind='internal_test'
      and feedback_agreement_source is null
      and feedback_agreement_version is null
      and feedback_agreed_at is null
    ) or (
      cohort_kind='feedback_participant'
      and feedback_agreement_source is not null
      and feedback_agreement_version='feedback-pilot-v1'
      and feedback_agreed_at is not null
    )
  );

create or replace function public.feedback_agreement_source_is_eligible(
  p_student_id uuid,
  p_source text
) returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select coalesce((
    select case p_source
      when 'guardian' then true
      when 'student' then student.date_of_birth is not null
        and student.date_of_birth <= (current_date - interval '15 years')::date
      else false
    end
    from public.students student
    where student.id=p_student_id
  ),false)
$$;

revoke all on function public.feedback_agreement_source_is_eligible(uuid,text)
  from public,anon,authenticated;
grant execute on function public.feedback_agreement_source_is_eligible(uuid,text)
  to service_role;

create or replace function public.validate_diagnostic_pilot_enrollment()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists (
    select 1 from public.profiles profile
    where profile.id=new.enrolled_by and profile.role='platform_admin'
  ) then raise exception 'diagnostic_pilot_admin_required'; end if;
  if not exists (
    select 1
    from public.diagnostic_item_bank_releases bank
    join public.taxonomy_releases taxonomy on taxonomy.id=bank.taxonomy_release_id
    where bank.id=new.bank_release_id
      and taxonomy.id=new.taxonomy_release_id
      and bank.status in ('draft','validating')
      and taxonomy.status in ('validating','published')
  ) then raise exception 'diagnostic_pilot_release_ineligible'; end if;
  if exists (
    select 1 from public.diagnostic_runs run
    join public.diagnostic_item_bank_releases bank on bank.id=run.item_bank_release_id
    where run.student_id=new.student_id and run.status='completed'
      and bank.status='published'
  ) then raise exception 'diagnostic_pilot_test_accounts_only'; end if;
  if new.cohort_kind='feedback_participant' then
    if new.feedback_agreed_at>now() then
      raise exception 'feedback_agreement_date_invalid';
    end if;
    if not public.feedback_agreement_source_is_eligible(
      new.student_id,new.feedback_agreement_source
    ) then
      raise exception 'feedback_agreement_source_ineligible';
    end if;
  end if;
  return new;
end
$$;

comment on column public.diagnostic_pilot_enrollments.cohort_kind is
  'Internal test accounts are distinct from students with an explicitly recorded feedback-pilot agreement.';
comment on column public.diagnostic_pilot_enrollments.feedback_agreement_source is
  'Who agreed to voluntary feedback participation; this does not control ordinary invited-student access.';

commit;
