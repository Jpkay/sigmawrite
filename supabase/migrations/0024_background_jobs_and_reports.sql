-- Sprint 12: durable job logs, immutable report delivery and student notices.

create table if not exists public.job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  status text not null default 'running' check (status in ('running','completed','failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  processed_count integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);
alter table public.job_runs enable row level security;
create policy job_runs_admin_read on public.job_runs for select using (public.is_platform_admin());

alter table public.parent_reports
  add column if not exists language text not null default 'fr',
  add column if not exists delivery_status text not null default 'pending',
  add column if not exists recipient_email text;

create table if not exists public.student_notifications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  kind text not null,
  message_fr text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.student_notifications enable row level security;
create policy student_notifications_select on public.student_notifications for select using (public.can_view_student(student_id));
create policy student_notifications_update on public.student_notifications for update using (public.owns_student(student_id)) with check (public.owns_student(student_id));
create index if not exists job_runs_started_idx on public.job_runs (started_at desc);
create index if not exists student_notifications_student_idx on public.student_notifications (student_id, created_at desc);

create or replace function public.protect_parent_report_snapshot()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.student_id is distinct from old.student_id
    or new.report_period_start is distinct from old.report_period_start
    or new.report_period_end is distinct from old.report_period_end
    or new.report_payload is distinct from old.report_payload
    or new.language is distinct from old.language then
    raise exception 'parent report snapshots are immutable';
  end if;
  return new;
end $$;
drop trigger if exists protect_parent_report_snapshot_trigger on public.parent_reports;
create trigger protect_parent_report_snapshot_trigger before update on public.parent_reports
for each row execute function public.protect_parent_report_snapshot();
