#!/bin/sh
# Uses only the full-schema harness's disposable Unix-socket cluster.
set -eu
pg_bin=$1
task_pg=$2
run_psql() { "$pg_bin/psql" -X -U postgres -h "$task_pg" -p 55442 -d postgres -v ON_ERROR_STOP=1 "$@"; }
# Reuse synthetic publication fixtures, committing only their setup.
sed '/^set local role authenticated;/,$d' scripts/testing/sql/granular-full-schema-test.sql > "$task_pg/successor-setup.sql"
echo 'commit;' >> "$task_pg/successor-setup.sql"
run_psql -f "$task_pg/successor-setup.sql" > "$task_pg/successor-setup.log" 2>&1
run_psql -q <<'SQL'
insert into granular_assessment_releases(release_key,taxonomy_release_id,bank_release_id,status,content_checksum,bundle)
select 'concurrent-target',taxonomy_release_id,bank_release_id,'published',content_checksum,bundle
from granular_assessment_releases where release_key='granular-db-test';
insert into students(id) values('15000000-0000-4000-8000-000000000001'),('15000000-0000-4000-8000-000000000002'),('15000000-0000-4000-8000-000000000003');
insert into granular_assessment_sessions(id,student_id,release_id,state)
select s.id,s.id,r.id,'{"revision":0,"phase":"learning","paused":true,"completionReason":"time_budget","release":{"checksum":"old"},"observations":[]}'::jsonb
from students s cross join granular_assessment_releases r
where s.id in ('15000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000002','15000000-0000-4000-8000-000000000003') and r.release_key='granular-db-test';
create function test_upgrade(id uuid) returns uuid language plpgsql as $$
declare source granular_assessment_sessions%rowtype; target granular_assessment_releases%rowtype; state jsonb;
begin
 select * into strict source from granular_assessment_sessions where granular_assessment_sessions.id=$1;
 select * into strict target from granular_assessment_releases where release_key='concurrent-target';
 state:=source.state||jsonb_build_object('revision',0,'lastPulseAt',null,
 'release',jsonb_build_object('taxonomyId',target.taxonomy_release_id,'bankId',target.bank_release_id,'checksum','new'),
 'learningPredecessor',jsonb_build_object('sessionId',source.id,'releaseId',source.release_id,'revision',0));
 return create_granular_learning_successor(source.student_id,source.id,0,target.id,'test',state);
end $$;
SQL
# Each case observes an actual database lock wait before allowing commit.
for scenario in duplicate upgrade_first save_first; do
 case "$scenario" in
 duplicate) id=15000000-0000-4000-8000-000000000001; first="select test_upgrade('$id');"; second="$first"; expected='' ;;
 upgrade_first) id=15000000-0000-4000-8000-000000000002; first="select test_upgrade('$id');"; second="update granular_assessment_sessions set revision=1,state=state||'{\"revision\":1}' where id='$id';"; expected='Learning session has a successor' ;;
 save_first) id=15000000-0000-4000-8000-000000000003; first="update granular_assessment_sessions set revision=1,state=state||'{\"revision\":1}' where id='$id';"; second="select test_upgrade('$id');"; expected='Learning predecessor revision changed' ;;
 esac
 cat > "$task_pg/successor-a.sql" <<SQL
begin;
$first
\o :ready_file
select 1;
\o
select pg_sleep(3);
commit;
SQL
 run_psql -v ready_file="$task_pg/ready-$scenario" -f "$task_pg/successor-a.sql" > "$task_pg/successor-a.log" 2>&1 &
 worker_a=$!
 while [ ! -s "$task_pg/ready-$scenario" ]; do
  if ! kill -0 "$worker_a" 2>/dev/null; then cat "$task_pg/successor-a.log"; exit 1; fi
  sleep 0.02
 done
 PGAPPNAME=successor-worker-b run_psql -c "$second" > "$task_pg/successor-b.log" 2>&1 &
 worker_b=$!
 blocked=false
 attempt=0
 while [ "$attempt" -lt 50 ]; do
  if [ "$(run_psql -At -c "select count(*) from pg_stat_activity where application_name='successor-worker-b' and wait_event_type='Lock'")" = 1 ]; then blocked=true; break; fi
  attempt=$((attempt + 1)); sleep 0.02
 done
 wait "$worker_a" || { cat "$task_pg/successor-a.log"; exit 1; }
 if wait "$worker_b"; then
  if [ -n "$expected" ]; then echo "Expected conflict missing: $scenario"; exit 1; fi
 else
  if [ -z "$expected" ] || ! rg -q "$expected" "$task_pg/successor-b.log"; then cat "$task_pg/successor-b.log"; exit 1; fi
 fi
 if [ "$blocked" != true ]; then echo "Did not observe overlapping $scenario requests"; exit 1; fi
 echo "Observed and verified concurrent learning $scenario."
done
run_psql -q <<'SQL'
do $$ begin
 if (select count(*) from granular_learning_successors)<>2 then raise exception 'Unexpected successor count'; end if;
 if (select revision from granular_assessment_sessions where id='15000000-0000-4000-8000-000000000003')<>1 then raise exception 'Concurrent save lost'; end if;
 if exists(select 1 from granular_learning_successors where source_session_id='15000000-0000-4000-8000-000000000003') then raise exception 'Stale upgrade survived'; end if;
 if exists(select 1 from granular_assessment_sessions where id in ('15000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000002') and revision<>0) then raise exception 'Original history mutated'; end if;
end $$;
SQL
