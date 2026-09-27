begin;
set local search_path=public,extensions;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into public.school_inquiries (
  id,
  organization_name,
  organization_type,
  country,
  contact_name,
  contact_role,
  contact_email,
  student_count,
  desired_start,
  primary_need
) values (
  'b9130000-0000-4000-8000-000000000001',
  'École de vérification',
  'school',
  'Rwanda',
  'Alex Exemple',
  'Direction',
  'alex@example.org',
  120,
  'exploring',
  'literacy'
);

select lives_ok(
  $q$update public.school_inquiries set message='Déploiement pilote.' where id='b9130000-0000-4000-8000-000000000001'$q$,
  'A valid existing inquiry remains writable'
);
select throws_ok(
  $q$update public.school_inquiries set organization_name=' ' where id='b9130000-0000-4000-8000-000000000001'$q$,
  '23514',
  null,
  'Blank organization names are rejected'
);
select throws_ok(
  $q$update public.school_inquiries set organization_name=repeat('x',161) where id='b9130000-0000-4000-8000-000000000001'$q$,
  '23514',
  null,
  'Overlong organization names are rejected'
);
select throws_ok(
  $q$update public.school_inquiries set country='R' where id='b9130000-0000-4000-8000-000000000001'$q$,
  '23514',
  null,
  'Short country names are rejected'
);
select throws_ok(
  $q$update public.school_inquiries set contact_name='A' where id='b9130000-0000-4000-8000-000000000001'$q$,
  '23514',
  null,
  'Short contact names are rejected'
);
select throws_ok(
  $q$update public.school_inquiries set contact_role=repeat('x',121) where id='b9130000-0000-4000-8000-000000000001'$q$,
  '23514',
  null,
  'Overlong contact roles are rejected'
);
select throws_ok(
  $q$update public.school_inquiries set contact_email='not-an-email' where id='b9130000-0000-4000-8000-000000000001'$q$,
  '23514',
  null,
  'Malformed contact e-mail addresses are rejected'
);
select throws_ok(
  $q$update public.school_inquiries set message=repeat('x',2001) where id='b9130000-0000-4000-8000-000000000001'$q$,
  '23514',
  null,
  'Overlong inquiry messages are rejected'
);
select is(
  (
    select count(*)::integer
    from pg_catalog.pg_constraint
    where conrelid='public.school_inquiries'::regclass
      and conname in (
        'school_inquiries_organization_name_length_check',
        'school_inquiries_country_length_check',
        'school_inquiries_contact_name_length_check',
        'school_inquiries_contact_role_length_check',
        'school_inquiries_contact_email_shape_check',
        'school_inquiries_message_length_check'
      )
      and convalidated
  ),
  6,
  'All six forward constraints are validated'
);
select ok(
  has_table_privilege('service_role','public.school_inquiries','INSERT'),
  'The server-only service role can insert inquiries'
);
select ok(
  not has_table_privilege('anon','public.school_inquiries','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'),
  'The anonymous role has no direct table privilege'
);

select * from finish();
rollback;
