-- Class dictée challenge (roadmap 7.3): an assignment may target a dictée.
alter table public.assignments drop constraint if exists assignments_target_type_check;
alter table public.assignments add constraint assignments_target_type_check
  check (target_type in ('text','competency_node','catch_up_step','dictation'));
alter table public.assignments add column if not exists target_dictation_id uuid references public.dictations(id) on delete set null;

-- Class-level results for a dictée assignment: distribution only, per-student rows stay behind RLS.
create or replace function public.dictation_assignment_results(p_assignment_id uuid)
returns table (members integer, attempted integer, average_score numeric, clean integer)
language sql stable security definer set search_path = public as $$
  with a as (select class_id, target_dictation_id, created_at from public.assignments where id = p_assignment_id),
  best as (
    select d.student_id, max(d.score) as score, bool_or(jsonb_array_length(d.errors) = 0) as clean
    from public.dictation_attempts d join a on d.dictation_id = a.target_dictation_id
    join public.enrollments e on e.student_id = d.student_id and e.class_id = a.class_id and e.status = 'active'
    where d.submitted_at is not null and d.submitted_at >= a.created_at
    group by d.student_id
  )
  select
    (select count(*) from public.enrollments e join a on e.class_id = a.class_id where e.status = 'active')::int,
    (select count(*) from best)::int,
    (select round(avg(score), 2) from best),
    (select count(*) filter (where clean) from best)::int
  where public.teaches_class((select class_id from a)) or public.is_staff() or auth.role() = 'service_role'
$$;
revoke all on function public.dictation_assignment_results(uuid) from public;
grant execute on function public.dictation_assignment_results(uuid) to authenticated, service_role;
