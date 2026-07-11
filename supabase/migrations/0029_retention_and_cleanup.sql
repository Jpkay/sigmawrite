-- Sprint 19: automated deletion queue, retention support and final app_state removal.

drop trigger if exists students_app_state_read_only on public.students;
drop function if exists public.prevent_authenticated_app_state_write();
alter table public.students drop column if exists app_state;

create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete set null,
  student_auth_user_id uuid not null,
  requested_by_profile_id uuid references public.profiles(id) on delete set null,
  requested_at timestamptz not null default now(),
  scheduled_for timestamptz not null default (now()+interval '30 days'),
  status text not null default 'pending' check (status in ('pending','cancelled','completed','failed')),
  completed_at timestamptz,
  error_message text
);
alter table public.deletion_requests enable row level security;
create policy deletion_requests_parent_read on public.deletion_requests for select using (requested_by_profile_id=public.current_profile_id() or public.is_platform_admin());
create policy deletion_requests_parent_insert on public.deletion_requests for insert with check (requested_by_profile_id=public.current_profile_id() and public.is_guardian_of(student_id));
create index if not exists deletion_requests_due_idx on public.deletion_requests (scheduled_for) where status='pending';

comment on table public.deletion_requests is 'Thirty-day grace queue; deleting the Auth user cascades all student-owned relational evidence.';
