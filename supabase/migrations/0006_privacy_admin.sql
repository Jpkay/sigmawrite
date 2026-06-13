-- Reading to Learn — Phase 6 privacy + admin (PRD §10, §O).

-- A guardian (or the student) can record consent for a student they can view.
create policy consent_insert on consent_records
  for insert with check (public.can_view_student(student_id));

-- Staff (school/platform admin, content reviewer) can read the org/school tree.
create policy organizations_select on organizations
  for select using (public.is_staff());
create policy schools_select on schools
  for select using (public.is_staff());
