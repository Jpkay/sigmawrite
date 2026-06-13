-- Reading to Learn — Row Level Security (PRD §14).
-- Enabled from day one. Service-role (server-only) bypasses RLS for trusted
-- admin/background jobs; the anon/auth client is always policy-constrained.

-- ───────────────────────────── Helper functions ────────────────────────────

create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from profiles where auth_user_id = auth.uid()
$$;

create or replace function public.current_role()
returns text language sql stable security definer set search_path = public as $$
  select role from profiles where auth_user_id = auth.uid()
$$;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role() = 'platform_admin', false)
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role() in ('platform_admin','school_admin','content_reviewer'), false)
$$;

-- Is the current student row owned by the caller?
create or replace function public.owns_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from students s
    where s.id = p_student_id and s.profile_id = public.current_profile_id()
  )
$$;

-- Is the caller a guardian of the student?
create or replace function public.is_guardian_of(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from student_guardians g
    where g.student_id = p_student_id
      and g.guardian_profile_id = public.current_profile_id()
  )
$$;

-- Does the caller teach a class the student is enrolled in?
create or replace function public.teaches_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from enrollments e
    join teacher_classes tc on tc.class_id = e.class_id
    where e.student_id = p_student_id
      and tc.teacher_profile_id = public.current_profile_id()
  )
$$;

-- Can the caller see this student at all (self / guardian / teacher / admin)?
create or replace function public.can_view_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.owns_student(p_student_id)
      or public.is_guardian_of(p_student_id)
      or public.teaches_student(p_student_id)
      or public.is_platform_admin()
$$;

-- ─────────────────────────────── Enable RLS ────────────────────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'organizations','schools','classes','profiles','students','student_guardians',
    'teacher_classes','enrollments','student_interests','skills','knowledge_domains',
    'knowledge_concepts','texts','text_versions','questions','question_choices',
    'text_skills','question_skills','vocabulary_items','text_vocabulary',
    'student_word_mastery','student_reading_estimates','student_skill_estimates',
    'student_domain_estimates','reading_sessions','student_answers','student_summaries',
    'reading_session_events','retrieval_cards','retrieval_schedules','retrieval_attempts',
    'ai_generation_jobs','ai_generated_candidates','ai_scoring_results',
    'ai_moderation_results','prompt_versions','parent_reports','teacher_reports',
    'benchmark_results','consent_records','audit_logs'
  ] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- ───────────────────────────────── Profiles ────────────────────────────────

create policy profiles_select_self on profiles
  for select using (auth_user_id = auth.uid() or public.is_platform_admin());
create policy profiles_update_self on profiles
  for update using (auth_user_id = auth.uid());
create policy profiles_insert_self on profiles
  for insert with check (auth_user_id = auth.uid());

-- ───────────────────────────────── Students ────────────────────────────────

create policy students_select on students
  for select using (public.can_view_student(id));
create policy students_update_self on students
  for update using (public.owns_student(id) or public.is_platform_admin());

-- Linkage tables: visible to the people they concern.
create policy guardians_select on student_guardians
  for select using (
    guardian_profile_id = public.current_profile_id()
    or public.owns_student(student_id)
    or public.is_platform_admin()
  );

create policy teacher_classes_select on teacher_classes
  for select using (teacher_profile_id = public.current_profile_id() or public.is_staff());

create policy enrollments_select on enrollments
  for select using (public.can_view_student(student_id) or public.is_staff());

-- ───────────────────── Student-owned learning records ──────────────────────
-- Students read+write their own; guardians/teachers/admin read-only.

create policy interests_rw on student_interests
  for all using (public.owns_student(student_id))
  with check (public.owns_student(student_id));
create policy interests_view on student_interests
  for select using (public.can_view_student(student_id));

create policy sessions_insert on reading_sessions
  for insert with check (public.owns_student(student_id));
create policy sessions_update on reading_sessions
  for update using (public.owns_student(student_id));
create policy sessions_select on reading_sessions
  for select using (public.can_view_student(student_id));

create policy answers_insert on student_answers
  for insert with check (exists (
    select 1 from reading_sessions s
    where s.id = session_id and public.owns_student(s.student_id)
  ));
create policy answers_select on student_answers
  for select using (exists (
    select 1 from reading_sessions s
    where s.id = session_id and public.can_view_student(s.student_id)
  ));

create policy summaries_insert on student_summaries
  for insert with check (exists (
    select 1 from reading_sessions s
    where s.id = session_id and public.owns_student(s.student_id)
  ));
create policy summaries_select on student_summaries
  for select using (exists (
    select 1 from reading_sessions s
    where s.id = session_id and public.can_view_student(s.student_id)
  ));

create policy events_insert on reading_session_events
  for insert with check (public.owns_student(student_id));
create policy events_select on reading_session_events
  for select using (public.can_view_student(student_id));

create policy word_mastery_rw on student_word_mastery
  for all using (public.owns_student(student_id))
  with check (public.owns_student(student_id));
create policy word_mastery_view on student_word_mastery
  for select using (public.can_view_student(student_id));

create policy retrieval_cards_select on retrieval_cards
  for select using (public.can_view_student(student_id));
create policy retrieval_attempts_insert on retrieval_attempts
  for insert with check (public.owns_student(student_id));
create policy retrieval_attempts_select on retrieval_attempts
  for select using (public.can_view_student(student_id));
create policy retrieval_schedules_select on retrieval_schedules
  for select using (exists (
    select 1 from retrieval_cards c
    where c.id = retrieval_card_id and public.can_view_student(c.student_id)
  ));

-- Estimates and reports are read-only to viewers; writes happen server-side.
create policy reading_est_select on student_reading_estimates
  for select using (public.can_view_student(student_id));
create policy skill_est_select on student_skill_estimates
  for select using (public.can_view_student(student_id));
create policy domain_est_select on student_domain_estimates
  for select using (public.can_view_student(student_id));
create policy parent_reports_select on parent_reports
  for select using (public.can_view_student(student_id));
create policy benchmark_select on benchmark_results
  for select using (public.can_view_student(student_id));

create policy teacher_reports_select on teacher_reports
  for select using (exists (
    select 1 from teacher_classes tc
    where tc.class_id = teacher_reports.class_id
      and tc.teacher_profile_id = public.current_profile_id()
  ) or public.is_staff());

-- Consent: guardian or the student themselves can read their consent rows.
create policy consent_select on consent_records
  for select using (public.can_view_student(student_id));

-- ─────────────────── Shared content & reference data ───────────────────────
-- Approved content is readable by any authenticated user; writes are staff-only.

create policy skills_read on skills for select using (auth.uid() is not null);
create policy domains_read on knowledge_domains for select using (auth.uid() is not null);
create policy concepts_read on knowledge_concepts for select using (auth.uid() is not null);
create policy vocab_read on vocabulary_items for select using (auth.uid() is not null);

create policy texts_read on texts
  for select using (status = 'active' or public.is_staff());
create policy text_versions_read on text_versions
  for select using (review_status in ('human_approved','benchmark_locked') or public.is_staff());
create policy questions_read on questions
  for select using (auth.uid() is not null);
create policy question_choices_read on question_choices
  for select using (auth.uid() is not null);
create policy text_skills_read on text_skills for select using (auth.uid() is not null);
create policy question_skills_read on question_skills for select using (auth.uid() is not null);
create policy text_vocab_read on text_vocabulary for select using (auth.uid() is not null);

-- Staff-only write access to content & reference tables.
do $$
declare t text;
begin
  foreach t in array array[
    'skills','knowledge_domains','knowledge_concepts','vocabulary_items',
    'texts','text_versions','questions','question_choices','text_skills',
    'question_skills','text_vocabulary','prompt_versions','ai_generation_jobs',
    'ai_generated_candidates','ai_scoring_results','ai_moderation_results'
  ] loop
    execute format(
      'create policy %I on %I for all using (public.is_staff()) with check (public.is_staff())',
      t || '_staff_write', t
    );
  end loop;
end $$;

-- Audit logs: insert by anyone authenticated (server actions log actions),
-- read by platform admins only.
create policy audit_insert on audit_logs
  for insert with check (auth.uid() is not null);
create policy audit_select on audit_logs
  for select using (public.is_platform_admin());
