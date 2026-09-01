begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(7);

select ok(not has_table_privilege('authenticated','public.profiles','UPDATE'),'Authenticated cannot update every profile column');
select ok(has_column_privilege('authenticated','public.profiles','display_name','UPDATE'),'Authenticated may update display name');
select ok(not has_column_privilege('authenticated','public.profiles','role','UPDATE'),'Authenticated cannot update authorization role');
select extensions.ok(pg_get_functiondef('public.handle_new_user()'::regprocedure) like '%v_requested_role in (''student'',''parent'',''teacher'')%','Signup trigger allowlists self-service roles');
select extensions.ok(pg_get_functiondef('public.is_staff()'::regprocedure) not like '%content_reviewer%','Content reviewers are not learner-data staff');
select extensions.ok(pg_get_functiondef('public.is_content_staff()'::regprocedure) not like '%content_reviewer%','Independent reviewers do not inherit direct content mutation');
select function_privs_are('public','is_content_staff',array[]::text[],'anon',array[]::text[],'Anonymous callers cannot execute content role helper');

select * from finish();
rollback;
