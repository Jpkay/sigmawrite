-- Preserve the independent reviewer boundary established by 0035. Reviewers
-- work only through review assignments/RPCs; direct AI and catalog mutation is
-- reserved for platform administrators.
create or replace function public.is_content_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() = 'platform_admin', false)
$$;

revoke execute on function public.is_content_staff() from anon;
grant execute on function public.is_content_staff() to authenticated, service_role;

comment on function public.is_content_staff() is
  'Platform-admin content mutation helper. Independent content reviewers use assignment-scoped portal policies and RPCs.';
