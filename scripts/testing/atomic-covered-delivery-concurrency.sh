#!/bin/sh
set -eu
pg_bin=$1
task_pg=$2
run_psql() { "$pg_bin/psql" -X -U postgres -h "$task_pg" -p 55449 -d postgres -v ON_ERROR_STOP=1 "$@"; }
run_psql -q <<'SQL'
update material_capture_contracts set enabled=true where contract_key='plume-material-capture-v1';
insert into students(id) values ('16200000-0000-4000-8000-000000000099');
SQL
cat >"$task_pg/atomic-coverage-a.sql" <<'SQL'
begin;
set local role service_role;
select invalidate_student_material_coverage('16200000-0000-4000-8000-000000000099','concurrent untracked delivery');
\o :ready_file
select 1;
\o
select pg_sleep(3);
commit;
SQL
cat >"$task_pg/atomic-coverage-b.sql" <<'SQL'
begin;
set local role service_role;
select record_covered_student_material_delivery(
 '16200000-0000-4000-8000-000000000099','test:concurrent-batch','sha256:'||repeat('d',64),array['Concurrent batch.'],
 jsonb_build_array(jsonb_build_object('presentationId','16200000-0000-4000-8000-000000000091','sourceChecksum','sha256:'||repeat('d',64),'materialKeys',jsonb_build_array('word:sha256:'||repeat('c',64)))),
 'plume-material-capture-v1');
commit;
SQL
run_psql -v ready_file="$task_pg/atomic-ready" -f "$task_pg/atomic-coverage-a.sql" >"$task_pg/atomic-coverage-a.log" 2>&1 &
worker_a=$!
while [ ! -s "$task_pg/atomic-ready" ]; do
 if ! kill -0 "$worker_a" 2>/dev/null; then cat "$task_pg/atomic-coverage-a.log" >&2; exit 1; fi
 sleep 0.02
done
PGAPPNAME=atomic-coverage-worker-b run_psql -f "$task_pg/atomic-coverage-b.sql" >"$task_pg/atomic-coverage-b.log" 2>&1 &
worker_b=$!
blocked=false
attempt=0
while [ "$attempt" -lt 50 ]; do
 if [ "$(run_psql -At -c "select count(*) from pg_stat_activity where application_name='atomic-coverage-worker-b' and wait_event_type='Lock'")" = 1 ]; then blocked=true; break; fi
 attempt=$((attempt + 1))
 sleep 0.02
done
if ! wait "$worker_a"; then cat "$task_pg/atomic-coverage-a.log" >&2; exit 1; fi
if ! wait "$worker_b"; then cat "$task_pg/atomic-coverage-b.log" >&2; exit 1; fi
if [ "$blocked" != true ]; then echo 'Coverage row lock was not observed' >&2; exit 1; fi
run_psql -q <<'SQL'
set role service_role;
do $$ begin
 if student_material_history_complete('16200000-0000-4000-8000-000000000099','16200000-0000-4000-8000-000000000091') then raise exception 'Concurrent untracked delivery was lost'; end if;
end $$;
SQL
echo 'Observed concurrent invalidation lock; atomic batch receipt remained unverified.'
