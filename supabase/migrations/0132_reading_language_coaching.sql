begin;
create table public.reading_language_coaching (
  attempt_id uuid primary key references public.competency_attempts(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  automatic_result jsonb,
  requested_result jsonb,
  created_at timestamptz not null default now()
);
alter table public.reading_language_coaching enable row level security;
revoke all on public.reading_language_coaching from anon, authenticated;
grant all on public.reading_language_coaching to service_role;
create index reading_language_coaching_student_idx on public.reading_language_coaching(student_id);
-- Stable cadence across sessions, excluding retries on the same exercise.
create function public.reading_coaching_ordinal(p_student_id uuid, p_attempt_id uuid)
returns bigint language sql stable set search_path=public as $$
 with first_successes as (
   select distinct on (a.practice_session_id,a.exercise_position) a.id,a.attempted_at
   from competency_attempts a join competency_items i on i.id=a.item_id
   where a.student_id=p_student_id and a.context='practice' and a.is_correct=true
     and a.practice_session_id is not null and i.validator_config ? 'readingRubric'
   order by a.practice_session_id,a.exercise_position,a.attempted_at,a.id
 ), numbered as (
   select id,row_number() over(order by attempted_at,id) as ordinal from first_successes
 ) select ordinal from numbered where id=p_attempt_id;
$$;
revoke all on function public.reading_coaching_ordinal(uuid,uuid) from public,anon,authenticated;
grant execute on function public.reading_coaching_ordinal(uuid,uuid) to service_role;
commit;
