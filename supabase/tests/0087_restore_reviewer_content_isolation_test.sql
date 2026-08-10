begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(2);

select extensions.ok(
  pg_get_functiondef('public.is_content_staff()'::regprocedure)
    not like '%content_reviewer%',
  'Independent content reviewers are excluded from direct content mutation'
);
select extensions.ok(
  obj_description('public.is_content_staff()'::regprocedure, 'pg_proc')
    like '%assignment-scoped%',
  'The content helper documents the assignment-scoped reviewer boundary'
);

select * from finish();
rollback;
