-- Fix-up for 0126: the enrollment trigger (0103) records institutional consent
-- with `on conflict (student_id) where revoked_at is null`, which needed the
-- per-student index that 0126 replaced by a per-guardian one. Keep one active
-- institutional consent per student and one active consent per guardian.

create unique index if not exists consent_records_one_active_school_per_student
  on public.consent_records (student_id) where revoked_at is null and consent_type = 'school';

create or replace function public.record_enrollment_authorization()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'active' then
    insert into public.consent_records(student_id, consent_type, consent_version, privacy_policy_version)
    values (new.student_id, 'school', 'school-invitation-v1', 'privacy-v1')
    on conflict (student_id) where revoked_at is null and consent_type = 'school' do nothing;
  end if;
  return new;
end $$;
