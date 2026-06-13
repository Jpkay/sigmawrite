-- Reading to Learn — persist the student's working learning state.
-- The app's student store (onboarding, diagnostic, sessions, skill estimates,
-- retrieval cards, vocab) is written here as a single per-student JSON document,
-- RLS-protected and readable by linked guardians/teachers via can_view_student.
-- (Normalised projections into the dedicated evidence tables remain a later
-- optimisation; the document is the student's source of truth for now.)

alter table students add column if not exists app_state jsonb;
