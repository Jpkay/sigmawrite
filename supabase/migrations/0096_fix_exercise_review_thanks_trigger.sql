-- The shared acknowledgement trigger must not dereference passage-only fields
-- when it runs for a competency-item assignment.

begin;

create or replace function public.notify_reviewer_thanks()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_review_version_id uuid:=nullif(to_jsonb(new)->>'review_version_id','')::uuid;
begin
  if old.status is distinct from 'submitted' and new.status='submitted' then
    insert into public.review_notifications(
      recipient_profile_id,
      notification_type,
      title,
      body,
      review_version_id
    ) values(
      new.reviewer_profile_id,
      'review_thanks',
      'Merci pour votre revue',
      'Votre regard aide Plume à protéger la qualité du français appris par les enfants. Chaque avis compte réellement.',
      v_review_version_id
    );
  end if;
  return new;
end
$$;

comment on function public.notify_reviewer_thanks() is
  'Creates an in-app acknowledgement for passage or exercise completion without assuming table-specific fields.';

commit;
