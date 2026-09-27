create table if not exists public.school_inquiries (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null,
  organization_type text not null check (organization_type in ('school','school_group','tutoring_center','nonprofit','other')),
  country text not null,
  contact_name text not null,
  contact_role text not null,
  contact_email text not null,
  student_count integer not null check (student_count between 1 and 100000),
  teacher_count integer check (teacher_count between 1 and 10000),
  desired_start text not null check (desired_start in ('asap','next_term','next_school_year','exploring')),
  primary_need text not null check (primary_need in ('grammar_writing','french_second_language','literacy','exam_prep','other')),
  message text,
  preferred_language text not null default 'fr' check (preferred_language in ('fr','en')),
  status text not null default 'new' check (status in ('new','contacted','qualified','proposal_sent','won','closed')),
  source text not null default 'marketing_site',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.school_inquiries enable row level security;

create policy school_inquiries_admin_read on public.school_inquiries
  for select to authenticated using (public.is_platform_admin());

create policy school_inquiries_admin_update on public.school_inquiries
  for update to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

grant select, update on public.school_inquiries to authenticated;

create index if not exists school_inquiries_status_created_idx
  on public.school_inquiries(status, created_at desc);
