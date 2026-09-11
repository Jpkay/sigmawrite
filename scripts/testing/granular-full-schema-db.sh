#!/bin/sh
set -eu
repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
pg_bin=${GRANULAR_FULL_PG_BIN:-/opt/homebrew/opt/postgresql@18/bin}
task_pg=$(mktemp -d /tmp/plume-full-schema-pg.XXXXXX)
trap '"$pg_bin/pg_ctl" -D "$task_pg/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$task_pg"' EXIT
"$pg_bin/initdb" -D "$task_pg/data" -U postgres -A trust >/dev/null
# Private Unix socket only; do not expose the trust-authenticated cluster via TCP.
"$pg_bin/pg_ctl" -D "$task_pg/data" -l "$task_pg/server.log" -o "-p 55442 -h '' -k $task_pg" start >/dev/null
apply_sql() {
 if ! "$pg_bin/psql" -X -U postgres -h "$task_pg" -p 55442 -d postgres -v ON_ERROR_STOP=1 -f "$1" >"$task_pg/migration.log" 2>&1; then
  echo "FAILED: $1" >&2
  tail -45 "$task_pg/migration.log" >&2
  exit 1
 fi
}
cd "$repo_root"
./node_modules/.bin/tsx scripts/testing/build-granular-persistence-fixture.mts "$task_pg/journey.sql"
apply_sql "$repo_root/scripts/testing/sql/supabase-auth-bootstrap.sql"
count=0
for migration in "$repo_root"/supabase/migrations/*.sql; do
 apply_sql "$migration"
 count=$((count + 1))
done
echo "Applied $count application migrations to a fresh full-schema database."
if ! "$pg_bin/psql" -X -U postgres -h "$task_pg" -p 55442 -d postgres -v ON_ERROR_STOP=1 -f "$task_pg/journey.sql" -f "$repo_root/scripts/testing/sql/granular-full-schema-test.sql" >"$task_pg/journey.log" 2>&1; then
 tail -45 "$task_pg/journey.log" >&2
 exit 1
fi
echo "Full-schema granular persistence and access checks passed."
if ! "$pg_bin/psql" -X -U postgres -h "$task_pg" -p 55442 -d postgres -v ON_ERROR_STOP=1 -f "$task_pg/full-graph.sql" -f "$repo_root/scripts/testing/sql/granular-full-graph-test.sql" >"$task_pg/full-graph.log" 2>&1; then
 tail -45 "$task_pg/full-graph.log" >&2
 exit 1
fi
echo "Complete French graph, synthetic bank and real engine-state persistence checks passed."

apply_sql "$repo_root/scripts/testing/sql/material-exposure-test.sql"
echo "Material exposure identity and access checks passed."
apply_sql "$repo_root/scripts/testing/sql/practice-lesson-material-test.sql"
echo "Practice lesson annotation invalidation checks passed."
sh "$repo_root/scripts/testing/material-exposure-concurrency.sh" "$pg_bin" "$task_pg"
sh "$repo_root/scripts/testing/learning-successor-concurrency.sh" "$pg_bin" "$task_pg"
