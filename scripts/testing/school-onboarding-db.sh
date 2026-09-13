#!/bin/sh
set -eu
repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
pg_bin=${PLUME_SCHOOL_PG_BIN:-/opt/homebrew/opt/postgresql@18/bin}
task_pg=$(mktemp -d /tmp/plume-school-pg.XXXXXX)
cleanup() {
  "$pg_bin/pg_ctl" -D "$task_pg/data" -m immediate stop >/dev/null 2>&1 || true
  # Only the freshly created disposable cluster is removed.
  rm -r "$task_pg"
}
trap cleanup EXIT
"$pg_bin/initdb" -D "$task_pg/data" -U postgres -A trust >/dev/null
"$pg_bin/pg_ctl" -D "$task_pg/data" -l "$task_pg/server.log" -o "-p 55443 -h '' -k $task_pg" start >/dev/null
apply_sql() {
  if ! "$pg_bin/psql" -X -U postgres -h "$task_pg" -p 55443 -d postgres -v ON_ERROR_STOP=1 -f "$1" >"$task_pg/result.log" 2>&1; then
    echo "FAILED: $1" >&2
    tail -45 "$task_pg/result.log" >&2
    exit 1
  fi
}
apply_sql "$repo_root/scripts/testing/sql/supabase-auth-bootstrap.sql"
count=0
for migration in "$repo_root"/supabase/migrations/*.sql; do
  apply_sql "$migration"
  count=$((count + 1))
done
echo "Applied $count migrations to disposable PostgreSQL (private socket only)."
apply_sql "$repo_root/supabase/tests/20260914101000_teacher_assignment_boundaries_test.sql"
echo "Teacher assignment, shared access, revocation, cross-school denial and deactivation assertions passed."
