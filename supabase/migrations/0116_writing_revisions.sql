-- Up to three revision passes per summary (roadmap 5.2). Mastery evidence
-- still comes from the final draft only (application layer).
alter table public.writing_evaluations drop constraint if exists writing_evaluations_revision_number_check;
alter table public.writing_evaluations add constraint writing_evaluations_revision_number_check
  check (revision_number between 0 and 3);
