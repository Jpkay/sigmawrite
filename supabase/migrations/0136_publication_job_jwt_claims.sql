-- Modern PostgREST stores JWT claims as JSON. Use Supabase's compatible role helper.
-- Keep the existing service-only grants, claim locks and idempotency logic.
do $$
declare signature text; definition text;
begin
 foreach signature in array array[
 'public.claim_job_run(text,integer)',
 'public.claim_content_publication(uuid)',
 'public.finish_content_publication(uuid,jsonb)',
 'public.fail_content_publication(uuid,text)'
 ] loop
  select pg_get_functiondef(signature::regprocedure) into definition;
  if strpos(definition,'current_setting(''request.jwt.claim.role'',true)')=0 then raise exception 'unexpected authorization definition: %',signature; end if;
  execute replace(definition,'current_setting(''request.jwt.claim.role'',true)','auth.role()');
 end loop;
end $$;
