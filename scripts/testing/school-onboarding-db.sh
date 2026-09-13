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
apply_sql "$repo_root/scripts/testing/sql/pgtap-lite.sql"
count=0
for migration in "$repo_root"/supabase/migrations/*.sql; do
  apply_sql "$migration"
  count=$((count + 1))
done
echo "Applied $count migrations to disposable PostgreSQL (private socket only)."
sed '/^create extension if not exists pgtap/d' "$repo_root/supabase/tests/20260914100000_school_self_service_test.sql" >"$task_pg/school-test.sql"
apply_sql "$task_pg/school-test.sql"
echo "School creation, management and authorization assertions passed."
apply_sql "$repo_root/supabase/tests/20260914101000_teacher_assignment_boundaries_test.sql"
echo "Teacher assignment, shared access, revocation, cross-school denial and deactivation assertions passed."
sed '/^create extension if not exists pgtap/d' "$repo_root/supabase/tests/20260914102000_school_invitations_test.sql" >"$task_pg/invitation-test.sql"
apply_sql "$task_pg/invitation-test.sql"
echo "Invitation rotation, expiry and role-boundary assertions passed."
sed '/^create extension if not exists pgtap/d' "$repo_root/supabase/tests/20260914103000_review_rls_initplans_test.sql" >"$task_pg/review-rls-test.sql"
apply_sql "$task_pg/review-rls-test.sql"
echo "Review query performance and unchanged authorization assertions passed."
