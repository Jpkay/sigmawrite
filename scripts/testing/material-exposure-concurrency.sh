#!/bin/sh
# Called only against the disposable cluster owned by the full-schema harness.
set -eu
pg_bin=$1
task_pg=$2
run_psql() { "$pg_bin/psql" -X -U postgres -h "$task_pg" -p 55442 -d postgres -v ON_ERROR_STOP=1 "$@"; }
run_psql -q -c "insert into students(id) values ('14300000-0000-4000-8000-000000000099')" >/dev/null
cat >"$task_pg/worker-a.sql" <<'SQL'
begin;
set local role service_role;
select * from record_student_material_presentation('14300000-0000-4000-8000-000000000091','14300000-0000-4000-8000-000000000099','concurrent-a',array['word:sha256:'||repeat('c',64)]);
\o :ready_file
select 1;
\o
select pg_sleep(3);
commit;
SQL
cat >"$task_pg/worker-b.sql" <<'SQL'
begin;
set local role service_role;
select * from record_student_material_presentation('14300000-0000-4000-8000-000000000092','14300000-0000-4000-8000-000000000099','concurrent-b',array['word:sha256:'||repeat('c',64)]);
commit;
SQL
run_psql -v ready_file="$task_pg/ready" -f "$task_pg/worker-a.sql" >"$task_pg/worker-a.log" 2>&1 &
worker_a=$!
while [ ! -s "$task_pg/ready" ]; do
 if ! kill -0 "$worker_a" 2>/dev/null; then cat "$task_pg/worker-a.log" >&2; exit 1; fi
 sleep 0.02
done
PGAPPNAME=material-exposure-worker-b run_psql -f "$task_pg/worker-b.sql" >"$task_pg/worker-b.log" 2>&1 &
worker_b=$!
blocked=false
attempt=0
while [ "$attempt" -lt 50 ]; do
 if [ "$(run_psql -At -c "select count(*) from pg_stat_activity where application_name='material-exposure-worker-b' and wait_event_type='Lock'")" = 1 ]; then blocked=true; break; fi
 attempt=$((attempt + 1))
 sleep 0.02
done
if ! wait "$worker_a"; then cat "$task_pg/worker-a.log" >&2; exit 1; fi
if ! wait "$worker_b"; then cat "$task_pg/worker-b.log" >&2; exit 1; fi
if [ "$blocked" != true ]; then echo "Concurrent conflict was not observed" >&2; exit 1; fi
run_psql -q <<'SQL'
set role service_role;
do $$ declare first_count integer; receipt_count integer; begin
 select count(*),count(*) filter(where first_recorded_exposure) into receipt_count,first_count from (
 select * from read_student_material_presentation('14300000-0000-4000-8000-000000000091','14300000-0000-4000-8000-000000000099','concurrent-a')
 union all
 select * from read_student_material_presentation('14300000-0000-4000-8000-000000000092','14300000-0000-4000-8000-000000000099','concurrent-b')
 ) receipts;
 if receipt_count<>2 or first_count<>1 then raise exception 'Concurrent requests both claimed first exposure'; end if;
end $$;
SQL
echo "Observed overlapping requests; exactly one received first-exposure credit."
