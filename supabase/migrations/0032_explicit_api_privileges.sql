-- Supabase CLI 2.109 revokes default API privileges before project migrations.
-- Make the intended PostgREST boundary explicit instead of relying on hosted or
-- CLI defaults. Every public table has RLS enabled; privileges make policies
-- reachable but never bypass them. service_role retains its database BYPASSRLS.

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant execute on functions to anon, authenticated, service_role;

-- This RPC exposes adaptive state and is never an anonymous entry point.
revoke execute on function public.next_diagnostic_item(uuid, uuid) from anon;
