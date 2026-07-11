-- Sprint 17: resumable sessions and private daily-goal streaks.

alter table public.reading_sessions
  add column if not exists current_phase text not null default 'read' check (current_phase in ('read','questions','summary','retrieval'));

create table if not exists public.student_daily_activity (
  student_id uuid not null references public.students(id) on delete cascade,
  activity_date date not null,
  reading_sessions integer not null default 0,
  practice_steps integer not null default 0,
  retrieval_reviews integer not null default 0,
  goal_completed boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (student_id, activity_date)
);
alter table public.student_daily_activity enable row level security;
create policy student_daily_activity_select on public.student_daily_activity for select using (public.can_view_student(student_id));
create index if not exists reading_sessions_resume_idx on public.reading_sessions (student_id, started_at desc) where completed_at is null;
