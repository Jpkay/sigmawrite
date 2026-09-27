begin;
create function public.student_granular_learning_ready(p_student_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
 select case
  when coalesce(auth.role(),'') not in ('service_role','authenticated') then false
  when auth.role()='authenticated' and not public.owns_student(p_student_id) then false
  when not public.student_access_is_authorized(p_student_id) then false
  else exists(
   select 1 from granular_assessment_sessions s
   join granular_assessment_releases r on r.id=s.release_id and r.status='published'
   join taxonomy_releases t on t.id=r.taxonomy_release_id and t.status='published' and t.release_key='french-taxonomy-v3'
   join diagnostic_item_bank_releases b on b.id=r.bank_release_id and b.status='published' and b.taxonomy_release_id=t.id
   where s.student_id=p_student_id and s.state->>'phase'='learning'
    and s.state->>'completionReason' in ('time_budget','evidence_complete','later_evidence_required')
  ) end;
$$;
revoke all on function public.student_granular_learning_ready(uuid) from public,anon;
grant execute on function public.student_granular_learning_ready(uuid) to authenticated,service_role;
alter function public.student_learning_is_unlocked(uuid) rename to student_legacy_learning_is_unlocked;
create function public.student_learning_is_unlocked(p_student_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
 select public.student_granular_learning_ready(p_student_id) or public.student_legacy_learning_is_unlocked(p_student_id);
$$;
revoke all on function public.student_learning_is_unlocked(uuid) from public,anon;
grant execute on function public.student_learning_is_unlocked(uuid) to authenticated,service_role;
commit;
