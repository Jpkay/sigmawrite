-- Minimal platform primitives for local migration testing, not application mocks.
-- This does not emulate GoTrue sign-in, PostgREST, storage or JWT verification.
create role anon;
create role authenticated;
create role service_role bypassrls;
create schema auth;
create table auth.users (
 id uuid primary key, email text, raw_user_meta_data jsonb default '{}',
 raw_app_meta_data jsonb default '{}', created_at timestamptz default now(),
 updated_at timestamptz default now()
);
create function auth.jwt() returns jsonb language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb
$$;
create function auth.uid() returns uuid language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),auth.jwt()->>'sub')::uuid
$$;
create function auth.role() returns text language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claim.role',true),''),auth.jwt()->>'role')
$$;
grant usage on schema public,auth to anon,authenticated,service_role;
grant execute on all functions in schema auth to anon,authenticated,service_role;
alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
alter default privileges in schema public grant all on sequences to anon,authenticated,service_role;
alter default privileges in schema public grant all on functions to anon,authenticated,service_role;
