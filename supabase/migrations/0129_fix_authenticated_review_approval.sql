begin;

-- The approval trigger calls a private normalizer. Run the trigger with its
-- owner's rights, like the existing choice trigger, without exposing the
-- normalizer or granting users any additional table-write permissions.
alter function public.guard_reviewed_diagnostic_prompt_uniqueness() security definer;
alter function public.guard_reviewed_diagnostic_prompt_uniqueness() set search_path=public;
revoke all on function public.guard_reviewed_diagnostic_prompt_uniqueness() from public,anon,authenticated;

commit;
