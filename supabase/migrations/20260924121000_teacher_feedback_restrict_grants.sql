-- Supabase's public-schema default privileges grant new tables to anon and
-- authenticated. Keep this feedback table readable/writable only as intended.
begin;

revoke all on public.teacher_content_feedback from anon, authenticated;
grant select, insert on public.teacher_content_feedback to authenticated;

commit;
