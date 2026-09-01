-- Idempotent background work and durable job claiming.

create unique index if not exists job_runs_one_running_per_name
  on public.job_runs(job_name) where status='running';

create unique index if not exists parent_reports_delivery_business_key
  on public.parent_reports(student_id,report_period_start,report_period_end,coalesce(recipient_email,''));

alter table public.student_notifications add column if not exists dedupe_key text;
create unique index if not exists student_notifications_dedupe_key
  on public.student_notifications(student_id,dedupe_key);

alter table public.deletion_requests drop constraint if exists deletion_requests_status_check;
alter table public.deletion_requests add constraint deletion_requests_status_check
  check(status in ('pending','processing','cancelled','completed','failed'));

create or replace function public.claim_due_deletion_requests(p_limit integer default 25)
returns setof public.deletion_requests
language plpgsql security definer set search_path=public as $$
begin
  if current_setting('request.jwt.claim.role',true) is distinct from 'service_role' then
    raise exception 'service role required' using errcode='42501';
  end if;
  return query
  with claimed as (
    select id from public.deletion_requests
    where status='pending' and scheduled_for<=now()
    order by scheduled_for
    for update skip locked limit greatest(1,least(p_limit,100))
  )
  update public.deletion_requests d set status='processing',error_message=null
  from claimed where d.id=claimed.id returning d.*;
end;$$;
revoke all on function public.claim_due_deletion_requests(integer) from public,anon,authenticated;
grant execute on function public.claim_due_deletion_requests(integer) to service_role;
