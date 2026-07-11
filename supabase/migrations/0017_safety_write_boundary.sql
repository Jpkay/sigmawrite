-- Sprint 5 hard boundary: student free text may only be written after the
-- server-side moderation action. Students keep RLS read access, but cannot
-- bypass moderation with direct REST calls.

drop policy if exists summaries_insert on student_summaries;
drop policy if exists summaries_update on student_summaries;
drop policy if exists retrieval_attempts_insert on retrieval_attempts;
drop policy if exists diagnostic_results_insert on diagnostic_results;

comment on table student_summaries is
  'Free-text writes are service-action only after moderation; student/guardian/teacher reads remain RLS-scoped.';
comment on table retrieval_attempts is
  'Free-text answer writes are service-action only after moderation; reads remain RLS-scoped.';
comment on column diagnostic_results.summary_text is
  'Written only by the moderated diagnostic server action.';
