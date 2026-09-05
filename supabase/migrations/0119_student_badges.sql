-- Badges tied to mastery milestones, never to time spent (roadmap 6.8).
create table public.student_badges (
  student_id uuid not null references public.students(id) on delete cascade,
  badge_key text not null,
  awarded_at timestamptz not null default now(),
  seen_at timestamptz,
  primary key (student_id, badge_key)
);
alter table public.student_badges enable row level security;
create policy student_badges_read on public.student_badges for select using (public.can_view_student(student_id));
grant select on public.student_badges to authenticated;
comment on table public.student_badges is 'At most a dozen badge keys defined in src/lib/badges.ts; awarded by the service layer when the milestone is verifiable.';
