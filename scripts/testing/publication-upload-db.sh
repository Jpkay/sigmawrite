#!/bin/sh
set -eu
repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
pg_bin=${GRANULAR_PG_BIN:-/opt/homebrew/opt/postgresql@17/bin}
task_pg=$(mktemp -d /tmp/plume-upload-pg.XXXXXX)
trap '"$pg_bin/pg_ctl" -D "$task_pg/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$task_pg"' EXIT
"$pg_bin/initdb" -D "$task_pg/data" -U postgres -A trust >/dev/null
"$pg_bin/pg_ctl" -D "$task_pg/data" -l "$task_pg/log" -o "-p 55453 -h '' -k $task_pg" start >/dev/null
"$pg_bin/psql" -X -U postgres -h "$task_pg" -p 55453 -d postgres -v ON_ERROR_STOP=1 <<SQL
create role anon;
create role authenticated;
create role service_role bypassrls;
create table granular_assessment_releases(id uuid primary key);
create table publication_calls(payload jsonb);
create function publish_granular_parallel_release(text,jsonb,text,jsonb,uuid) returns uuid language plpgsql as \$\$
begin
 if \$2->>'accept' is distinct from 'true' then raise exception 'Existing publisher rejected bundle'; end if;
 insert into publication_calls values(\$2);
 insert into granular_assessment_releases values('11111111-1111-4111-8111-111111111111') on conflict do nothing;
 return '11111111-1111-4111-8111-111111111111';
end \$\$;
\i ${repo_root}/supabase/migrations/20260912190000_granular_publication_uploads.sql
\i ${repo_root}/scripts/testing/sql/publication-upload-test.sql
SQL
