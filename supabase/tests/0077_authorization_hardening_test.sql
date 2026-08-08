begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(7);

select ok(not has_table_privilege('authenticated','public.profiles','UPDATE'),'Authenticated cannot update every profile column');
select ok(has_column_privilege('authenticated','public.profiles','display_name','UPDATE'),'Authenticated may update display name');
select ok(not has_column_privilege('authenticated','public.profiles','role','UPDATE'),'Authenticated cannot update authorization role');
select like(pg_get_functiondef('public.handle_new_user()'::regprocedure),'%v_requested_role in (''student'',''parent'',''teacher'')%','Signup trigger allowlists self-service roles');
select unlike(pg_get_functiondef('public.is_staff()'::regprocedure),'%content_reviewer%','Content reviewers are not learner-data staff');
select unlike(pg_get_functiondef('public.is_content_staff()'::regprocedure),'%content_reviewer%','Independent reviewers do not inherit direct content mutation');
select function_privs_are('public','is_content_staff',array[]::text[],'anon',array[]::text[],'Anonymous callers cannot execute content role helper');

select * from finish();
rollback;
