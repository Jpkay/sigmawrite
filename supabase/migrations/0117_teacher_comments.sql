-- Teacher comments on a student's writing, visible to the student (roadmap 5.4).
-- Written through a service-only path after moderation; students read their
-- own, guardians and teachers read through the usual student view helper.
create table public.teacher_comments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_profile_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('summary','production','dictation','general')),
  target_id uuid,
  body_fr text not null check (char_length(body_fr) between 1 and 1000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index teacher_comments_student_idx on public.teacher_comments (student_id, created_at desc);
alter table public.teacher_comments enable row level security;
create policy teacher_comments_read on public.teacher_comments for select using (public.can_view_student(student_id));
grant select on public.teacher_comments to authenticated;

comment on table public.teacher_comments is
  'Short teacher feedback on a student text. Insert only via the service role after moderation and audit.';
