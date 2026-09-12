begin;
-- Renaming the old function in 0142 preserved its OID in existing RLS
-- policies. Those policies must bind to the combined old/new diagnostic
-- predicate. Keep every ownership condition, role and policy operation.
do $$
declare
 p record;
 policy_using text;
 policy_check text;
 changes text;
begin
 for p in
  select * from pg_policies
  where schemaname='public'
    and (coalesce(qual,'') like '%student_legacy_learning_is_unlocked(%'
      or coalesce(with_check,'') like '%student_legacy_learning_is_unlocked(%')
 loop
  if (p.tablename,p.policyname) not in (
   ('reading_sessions','sessions_insert'),('reading_sessions','sessions_update'),
   ('student_answers','answers_insert'),('student_answers','answers_update'),
   ('reading_session_events','events_insert'),
   ('student_skill_estimates','skill_est_insert'),('student_skill_estimates','skill_est_update'),
   ('retrieval_cards','retrieval_cards_insert'),('retrieval_cards','retrieval_cards_update'),
   ('student_reading_estimates','reading_est_insert'),
   ('competency_attempts','competency_attempts_insert'),
   ('retrieval_schedules','retrieval_schedules_insert'),('retrieval_schedules','retrieval_schedules_update'),
   ('student_package_progress','package_progress_student_write'),
   ('learning_retrieval_schedules','learning_retrieval_student_write'),
   ('quiz_sessions','quiz_session_write'),('quiz_responses','quiz_response_write'),
   ('student_word_mastery','word_mastery_rw')
  ) then
   raise exception 'Unreviewed legacy learning policy: %.%',p.tablename,p.policyname;
  end if;
  policy_using := replace(p.qual,'student_legacy_learning_is_unlocked(','student_learning_is_unlocked(');
  policy_check := replace(p.with_check,'student_legacy_learning_is_unlocked(','student_learning_is_unlocked(');
  changes := case when policy_using is null then '' else format(' using (%s)',policy_using) end
    || case when policy_check is null then '' else format(' with check (%s)',policy_check) end;
  execute format('alter policy %I on %I.%I%s',p.policyname,p.schemaname,p.tablename,changes);
 end loop;
end $$;
commit;
