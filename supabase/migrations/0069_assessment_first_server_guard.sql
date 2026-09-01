-- UI routing is not an authorization boundary. Learning mutations also verify
-- that the student has completed the exact graph diagnostic v2 contract.

begin;

create or replace function public.student_learning_is_unlocked(
  p_student_id uuid
) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when coalesce(auth.role(),'') not in ('service_role','authenticated')
      then false
    when auth.role()='authenticated'
      and not public.owns_student(p_student_id)
      then false
    else exists (
      select 1
      from public.diagnostic_runs run
      join public.taxonomy_releases taxonomy
        on taxonomy.id=run.taxonomy_release_id
      join public.diagnostic_item_bank_releases bank
        on bank.id=run.item_bank_release_id
        and bank.taxonomy_release_id=taxonomy.id
      join public.learning_goals goal
        on goal.id=run.learning_goal_id
        and goal.student_id=run.student_id
        and goal.status='active'
      where run.student_id=p_student_id
        and run.status='completed'
        and run.completed_at is not null
        and run.current_section is null
        and run.protocol_version='graph-sections-v2'
        and run.total_min_probes=32
        and run.total_max_probes=80
        and run.probe_count between 32 and 80
        and taxonomy.release_key='french-taxonomy-v2'
        and taxonomy.version='2.0.0'
        and taxonomy.status='published'
        and taxonomy.manifest_checksum=
          'sha256:809df529f0934fc8b68dcf23d00a18238a9c01490f4a985b4fa4246751a1fc4b'
        and taxonomy.validation_report @> '{"valid":true}'::jsonb
        and bank.bank_key='french-diagnostic-bank-v2'
        and bank.version='2.0.0'
        and bank.status='published'
        and nullif(btrim(bank.manifest_checksum),'') is not null
        and bank.manifest->>'checksum'=bank.manifest_checksum
        and bank.validation_report @> '{"valid":true}'::jsonb
        and (
          select count(*)=4 and coalesce(bool_and(
            section.status='completed'
            and section.min_probes=8
            and section.max_probes=20
            and section.min_distinct_nodes=6
            and section.probe_count between 8 and 20
            and section.distinct_nodes_tested>=6
            and section.completed_at is not null
          ),false)
          from public.diagnostic_run_sections section
          where section.run_id=run.id
        )
        -- These rows are written only by successful server-side finalization.
        -- Requiring them prevents a student from forging `status=completed` on
        -- the otherwise student-writable diagnostic run row.
        and exists (
          select 1 from public.diagnostic_results result
          where result.diagnostic_run_id=run.id
            and result.student_id=run.student_id
            and result.completed_at=run.completed_at
        )
        and exists (
          select 1 from public.student_reading_estimates estimate
          where estimate.diagnostic_run_id=run.id
            and estimate.student_id=run.student_id
            and estimate.estimate_type='adaptive_diagnostic'
            and estimate.evidence_count=run.probe_count
        )
        and exists (
          select 1 from public.student_learning_paths path
          where path.source_diagnostic_run_id=run.id
            and path.student_id=run.student_id
            and path.learning_goal_id=run.learning_goal_id
            and path.taxonomy_release_id=run.taxonomy_release_id
            and path.status in ('active','completed')
        )
    )
  end
$$;

revoke all on function public.student_learning_is_unlocked(uuid)
  from public,anon;
grant execute on function public.student_learning_is_unlocked(uuid)
  to authenticated,service_role;

-- Server Actions are not the only API boundary: authenticated clients also
-- receive table privileges through PostgREST. Rebuild every student-owned
-- post-assessment write policy around the same fail-closed predicate. The
-- onboarding/profile/goal and diagnostic-run policies deliberately remain
-- unchanged so a new learner can still reach and complete the assessment.
drop policy if exists sessions_insert on public.reading_sessions;
create policy sessions_insert on public.reading_sessions for insert
with check (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
);
drop policy if exists sessions_update on public.reading_sessions;
create policy sessions_update on public.reading_sessions for update
using (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
)
with check (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
);

drop policy if exists answers_insert on public.student_answers;
create policy answers_insert on public.student_answers for insert
with check (exists (
  select 1 from public.reading_sessions session
  where session.id=session_id
    and public.owns_student(session.student_id)
    and public.student_learning_is_unlocked(session.student_id)
));
drop policy if exists answers_update on public.student_answers;
create policy answers_update on public.student_answers for update
using (exists (
  select 1 from public.reading_sessions session
  where session.id=session_id
    and public.owns_student(session.student_id)
    and public.student_learning_is_unlocked(session.student_id)
))
with check (exists (
  select 1 from public.reading_sessions session
  where session.id=session_id
    and public.owns_student(session.student_id)
    and public.student_learning_is_unlocked(session.student_id)
));

drop policy if exists events_insert on public.reading_session_events;
create policy events_insert on public.reading_session_events for insert
with check (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
);
drop policy if exists word_mastery_rw on public.student_word_mastery;
create policy word_mastery_rw on public.student_word_mastery for all
using (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
)
with check (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
);

drop policy if exists reading_est_insert on public.student_reading_estimates;
create policy reading_est_insert on public.student_reading_estimates for insert
with check (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
);
drop policy if exists skill_est_insert on public.student_skill_estimates;
create policy skill_est_insert on public.student_skill_estimates for insert
with check (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
);
drop policy if exists skill_est_update on public.student_skill_estimates;
create policy skill_est_update on public.student_skill_estimates for update
using (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
)
with check (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
);

drop policy if exists retrieval_cards_insert on public.retrieval_cards;
create policy retrieval_cards_insert on public.retrieval_cards for insert
with check (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
);
drop policy if exists retrieval_cards_update on public.retrieval_cards;
create policy retrieval_cards_update on public.retrieval_cards for update
using (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
)
with check (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
);
drop policy if exists retrieval_schedules_insert on public.retrieval_schedules;
create policy retrieval_schedules_insert on public.retrieval_schedules
for insert with check (exists (
  select 1 from public.retrieval_cards card
  where card.id=retrieval_card_id
    and public.owns_student(card.student_id)
    and public.student_learning_is_unlocked(card.student_id)
));
drop policy if exists retrieval_schedules_update on public.retrieval_schedules;
create policy retrieval_schedules_update on public.retrieval_schedules
for update using (exists (
  select 1 from public.retrieval_cards card
  where card.id=retrieval_card_id
    and public.owns_student(card.student_id)
    and public.student_learning_is_unlocked(card.student_id)
))
with check (exists (
  select 1 from public.retrieval_cards card
  where card.id=retrieval_card_id
    and public.owns_student(card.student_id)
    and public.student_learning_is_unlocked(card.student_id)
));

drop policy if exists competency_attempts_insert
  on public.competency_attempts;
create policy competency_attempts_insert on public.competency_attempts
for insert with check (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
);

drop policy if exists package_progress_student_write
  on public.student_package_progress;
create policy package_progress_student_write
on public.student_package_progress for all
using (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
)
with check (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
);
drop policy if exists learning_retrieval_student_write
  on public.learning_retrieval_schedules;
create policy learning_retrieval_student_write
on public.learning_retrieval_schedules for all
using (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
)
with check (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
);
drop policy if exists quiz_session_write on public.quiz_sessions;
create policy quiz_session_write on public.quiz_sessions for all
using (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
)
with check (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
);
drop policy if exists quiz_response_write on public.quiz_responses;
create policy quiz_response_write on public.quiz_responses for insert
with check (
  public.owns_student(student_id)
  and public.student_learning_is_unlocked(student_id)
);

-- These SECURITY DEFINER writers bypass table RLS. Current application code
-- uses record_interest_session through the service client, while the other two
-- have no authenticated application caller. Keep all three service-only rather
-- than exposing an alternate pre-assessment mutation path.
revoke all on function public.record_interest_session(
  uuid,text,boolean,numeric,integer
) from public,anon,authenticated;
grant execute on function public.record_interest_session(
  uuid,text,boolean,numeric,integer
) to service_role;
revoke all on function public.schedule_package_retrieval(
  uuid,uuid,timestamptz
) from public,anon,authenticated;
grant execute on function public.schedule_package_retrieval(
  uuid,uuid,timestamptz
) to service_role;
revoke all on function public.start_generated_content_session(uuid,uuid)
  from public,anon,authenticated;
grant execute on function public.start_generated_content_session(uuid,uuid)
  to service_role;

comment on function public.student_learning_is_unlocked(uuid) is
  'Fail-closed assessment-first gate pinned to a fully finalized, published French graph diagnostic v2 run for the active goal.';

commit;
