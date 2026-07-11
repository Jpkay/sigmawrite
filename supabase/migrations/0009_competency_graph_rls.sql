-- French mastery platform — RLS for the knowledge graph (Roadmap Phase 7, A8).
-- Same model as 0002: graph reference data is readable by authenticated users
-- (approved content + staff), writable by staff only; per-student records follow
-- owns_student / can_view_student. Server actions use the service role, which
-- bypasses RLS for trusted writes (estimate updates, diagnosis, generation).

-- ─────────────────────────────── Enable RLS ────────────────────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'competency_nodes','competency_edges','framework_mappings','misconceptions',
    'competency_items','competency_item_choices','student_competency_estimates',
    'competency_attempts','learner_profiles','learning_goals'
  ] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- ─────────────────────── Graph reference data (read) ────────────────────────
-- Nodes and items follow the approved-content principle (mirrors text_versions);
-- edges / mappings / misconceptions are structural metadata readable by any
-- authenticated user (they are just id pairs and tags).

create policy competency_nodes_read on competency_nodes
  for select using (
    review_status in ('auto_approved','human_approved') or public.is_staff()
  );
create policy competency_items_read on competency_items
  for select using (
    review_status in ('auto_approved','human_approved') or public.is_staff()
  );
create policy competency_item_choices_read on competency_item_choices
  for select using (auth.uid() is not null);
create policy competency_edges_read on competency_edges
  for select using (auth.uid() is not null);
create policy framework_mappings_read on framework_mappings
  for select using (auth.uid() is not null);
create policy misconceptions_read on misconceptions
  for select using (auth.uid() is not null);

-- Staff-only write access to all graph reference tables.
do $$
declare t text;
begin
  foreach t in array array[
    'competency_nodes','competency_edges','framework_mappings','misconceptions',
    'competency_items','competency_item_choices'
  ] loop
    execute format(
      'create policy %I on %I for all using (public.is_staff()) with check (public.is_staff())',
      t || '_staff_write', t
    );
  end loop;
end $$;

-- ───────────────────── Per-student learning records ────────────────────────

-- Estimates: read-only to viewers (self / guardian / teacher / admin); writes
-- happen server-side via the service role.
create policy competency_estimates_select on student_competency_estimates
  for select using (public.can_view_student(student_id));

-- Attempts: students write their own; viewers read.
create policy competency_attempts_insert on competency_attempts
  for insert with check (public.owns_student(student_id));
create policy competency_attempts_select on competency_attempts
  for select using (public.can_view_student(student_id));

-- Learner profile: student owns; viewers read.
create policy learner_profiles_rw on learner_profiles
  for all using (public.owns_student(student_id))
  with check (public.owns_student(student_id));
create policy learner_profiles_view on learner_profiles
  for select using (public.can_view_student(student_id));

-- Goals: student owns; viewers read.
create policy learning_goals_rw on learning_goals
  for all using (public.owns_student(student_id))
  with check (public.owns_student(student_id));
create policy learning_goals_view on learning_goals
  for select using (public.can_view_student(student_id));
