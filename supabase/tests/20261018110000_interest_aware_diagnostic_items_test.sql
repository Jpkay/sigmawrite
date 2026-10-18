begin;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(4);

select has_function('public', 'next_section_diagnostic_item', array['uuid', 'uuid', 'text'], 'The section diagnostic picker still exists');
select ok(
  pg_get_functiondef('public.next_section_diagnostic_item(uuid,uuid,text)'::regprocedure) like '%student_interests%interestKeys%',
  'Interest-tagged items are preferred among equivalent candidates'
);
select ok(
  pg_get_functiondef('public.next_section_diagnostic_item(uuid,uuid,text)'::regprocedure) like '%floor(abs(membership.difficulty-%',
  'The interest preference only applies inside one difficulty bucket'
);
select ok(
  has_function_privilege('authenticated', 'public.next_section_diagnostic_item(uuid,uuid,text)', 'execute'),
  'Students keep execute access to the picker'
);

select * from finish();
rollback;
