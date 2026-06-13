-- Reading to Learn — reading assignments (PRD §N "low-prep assignments").
-- A teacher assigns a text (by slug, matching the seed content / future
-- text_versions) to a whole class; enrolled students see it in their queue.

create table assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  teacher_profile_id uuid references profiles(id) on delete set null,
  text_slug text not null,
  title text not null,
  instructions text,
  due_at date,
  created_at timestamptz not null default now()
);

create index on assignments (class_id);

alter table assignments enable row level security;

-- Teachers fully manage assignments for classes they teach.
create policy assignments_teacher_all on assignments
  for all
  using (
    exists (
      select 1 from teacher_classes tc
      where tc.class_id = assignments.class_id
        and tc.teacher_profile_id = public.current_profile_id()
    )
  )
  with check (
    exists (
      select 1 from teacher_classes tc
      where tc.class_id = assignments.class_id
        and tc.teacher_profile_id = public.current_profile_id()
    )
  );

-- Enrolled students read their class's assignments.
create policy assignments_student_read on assignments
  for select
  using (
    exists (
      select 1 from enrollments e
      join students s on s.id = e.student_id
      where e.class_id = assignments.class_id
        and s.profile_id = public.current_profile_id()
    )
  );

-- Staff read all.
create policy assignments_staff_read on assignments
  for select using (public.is_staff());
