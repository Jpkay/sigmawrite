#!/bin/sh
set -eu
repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
pg_bin=${GRANULAR_PG_BIN:-/opt/homebrew/opt/postgresql@17/bin}
task_pg=$(mktemp -d /tmp/plume-granular-pg.XXXXXX)
trap '"$pg_bin/pg_ctl" -D "$task_pg/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$task_pg"' EXIT
"$pg_bin/initdb" -D "$task_pg/data" -A trust >/dev/null
"$pg_bin/pg_ctl" -D "$task_pg/data" -l "$task_pg/log" -o "-p 55441 -h 127.0.0.1 -k $task_pg" start >/dev/null
psql -h "$task_pg" -p 55441 -d postgres -v ON_ERROR_STOP=1 <<SQL
create role anon;
create role authenticated;
create role service_role;
create table students(id uuid primary key);
create table taxonomy_releases(id uuid primary key,status text,release_key text);
create table diagnostic_item_bank_releases(id uuid primary key,status text,taxonomy_release_id uuid);
\i ${repo_root}/supabase/migrations/0141_granular_assessment_sessions.sql
\i ${repo_root}/supabase/tests/0141_granular_assessment_sessions_test.sql
create schema auth;
create function auth.role() returns text language sql as 'select current_setting(''request.jwt.claim.role'',true)';
create function owns_student(p uuid) returns boolean language sql as 'select p::text=current_setting(''test.student_id'',true)';
create function student_access_is_authorized(p uuid) returns boolean language sql as 'select coalesce(current_setting(''test.authorized'',true),''false'')=''true''';
create function student_learning_is_unlocked(p uuid) returns boolean language sql as 'select coalesce(current_setting(''test.legacy'',true),''false'')=''true''';
\i ${repo_root}/supabase/migrations/0142_granular_learning_access.sql
\i ${repo_root}/supabase/tests/0142_granular_learning_access_test.sql
SQL
