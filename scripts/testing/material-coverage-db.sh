#!/bin/sh
set -eu
repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
pg_bin=${GRANULAR_PG_BIN:-/opt/homebrew/opt/postgresql@17/bin}
task_pg=$(mktemp -d /tmp/plume-coverage-pg.XXXXXX)
trap '"$pg_bin/pg_ctl" -D "$task_pg/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$task_pg"' EXIT
"$pg_bin/initdb" -D "$task_pg/data" -U postgres -A trust >/dev/null
"$pg_bin/pg_ctl" -D "$task_pg/data" -l "$task_pg/log" -o "-p 55449 -h '' -k $task_pg" start >/dev/null
"$pg_bin/psql" -X -U postgres -h "$task_pg" -p 55449 -d postgres -v ON_ERROR_STOP=1 <<SQL
create role anon;
create role authenticated;
create role service_role bypassrls;
create table students(id uuid primary key);
\i ${repo_root}/supabase/migrations/0143_student_material_exposure.sql
\i ${repo_root}/supabase/migrations/20260912024000_audio_material_exposure.sql
\i ${repo_root}/supabase/migrations/20260912080000_material_coverage_receipts.sql
\i ${repo_root}/supabase/migrations/20260912083000_material_delivery_journal.sql
\i ${repo_root}/scripts/testing/sql/material-coverage-test.sql
\i ${repo_root}/scripts/testing/sql/material-delivery-journal-test.sql
SQL
sh "$repo_root/scripts/testing/material-coverage-concurrency.sh" "$pg_bin" "$task_pg"
