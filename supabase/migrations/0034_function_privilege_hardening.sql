-- 0032 restored table access after the CLI's default-privilege revocation. It
-- also restored function execution broadly so RLS helper functions work. Reapply
-- the narrower boundaries declared by the function-owning migrations.

revoke execute on function public.take_rate_limit(text,text,integer,integer)
  from anon, authenticated, service_role;
revoke execute on function public.next_diagnostic_item(uuid,uuid) from anon;
revoke execute on function public.activate_prompt_version(uuid) from anon;
revoke execute on function public.create_teacher_class(text,integer,text) from anon;
revoke execute on function public.set_class_enrollment(uuid,uuid,text) from anon;
revoke execute on function public.record_interest_session(uuid,text,boolean,numeric,integer) from anon;
revoke execute on function public.consume_student_action(text) from anon;
revoke execute on function public.consume_student_llm_budget(uuid,integer) from anon;

-- New RPCs must make their intended audience explicit in their own migration.
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
