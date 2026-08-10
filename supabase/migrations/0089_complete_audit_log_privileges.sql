revoke all privileges on table public.audit_logs from anon, authenticated;
grant select on table public.audit_logs to authenticated;

revoke all on function public.is_content_staff() from public, anon;
grant execute on function public.is_content_staff() to authenticated, service_role;
