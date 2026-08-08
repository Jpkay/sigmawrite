begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(2);

select unlike(
  pg_get_functiondef('public.is_content_staff()'::regprocedure),
  '%content_reviewer%',
  'Independent content reviewers are excluded from direct content mutation'
);
select like(
  obj_description('public.is_content_staff()'::regprocedure, 'pg_proc'),
  '%assignment-scoped%',
  'The content helper documents the assignment-scoped reviewer boundary'
);

select * from finish();
rollback;
