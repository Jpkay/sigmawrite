#!/bin/sh
set -eu
repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
pg_bin=${GRANULAR_PG_BIN:-/opt/homebrew/opt/postgresql@17/bin}
task_pg=$(mktemp -d /tmp/plume-repair-pg.XXXXXX)
trap '"$pg_bin/pg_ctl" -D "$task_pg/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$task_pg"' EXIT
"$pg_bin/initdb" -D "$task_pg/data" -U postgres -A trust >/dev/null
"$pg_bin/pg_ctl" -D "$task_pg/data" -l "$task_pg/log" -o "-p 55454 -h '' -k $task_pg" start >/dev/null
run_psql(){ "$pg_bin/psql" -X -U postgres -h "$task_pg" -p 55454 -d postgres -v ON_ERROR_STOP=1 "$@"; }
run_psql <<SQL
create role anon; create role authenticated; create role service_role bypassrls;
create table students(id uuid primary key);
create function can_view_student(uuid) returns boolean language sql as 'select false';
create function student_learning_is_unlocked(uuid) returns boolean language sql as 'select \$1 <> ''00000000-0000-4000-8000-000000000002''::uuid';
insert into students values('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
\i ${repo_root}/supabase/migrations/20260912220000_guided_repair_completions.sql
SQL
cat > "$task_pg/save.sql" <<'SQL'
set role service_role;
select record_student_repair_completion('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','cause_consequence','sha256:'||repeat('a',64),array[0,1],array[true,false]);
SQL
# Hold the first completion uncommitted while its duplicate is submitted.
{ echo 'begin;'; cat "$task_pg/save.sql"; printf '\\o %s/ready\nselect 1;\n\\o\n' "$task_pg"; echo 'select pg_sleep(2); commit;'; } > "$task_pg/first.sql"
run_psql -f "$task_pg/first.sql" > "$task_pg/first.log" 2>&1 &
first=$!
while [ ! -s "$task_pg/ready" ]; do
 if ! kill -0 "$first" 2>/dev/null; then cat "$task_pg/first.log"; exit 1; fi
 sleep 0.02
done
run_psql -f "$task_pg/save.sql" > "$task_pg/second.log" 2>&1 &
second=$!
wait "$first"; wait "$second"
run_psql <<'SQL'
do $$ begin
 if (select count(*) from student_repair_completions)<>1 then raise exception 'Duplicate completion'; end if;
 begin
  perform record_student_repair_completion('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','cause_consequence','sha256:'||repeat('a',64),array[1,1],array[false,false]);
  raise exception 'Mutation accepted';
 exception when others then if sqlerrm <> 'Submission identity reused with different answers' then raise; end if; end;
 begin
  perform record_student_repair_completion('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003','cause_consequence','sha256:'||repeat('a',64),array[0],array[true]);
  raise exception 'Locked student accepted';
 exception when others then if sqlerrm <> 'Diagnostic required' then raise; end if; end;
 if has_function_privilege('authenticated','record_student_repair_completion(uuid,uuid,text,text,integer[],boolean[])','execute') then raise exception 'Client can call writer'; end if;
 if has_table_privilege('authenticated','student_repair_completions','insert') then raise exception 'Client can write'; end if;
 if (select answers from student_repair_completions limit 1)<>array[0,1] then raise exception 'Payload changed'; end if;
end $$;
set role authenticated;
do $$ begin if exists(select 1 from student_repair_completions) then raise exception 'Other student history visible'; end if; end $$;
SQL
printf 'Repair completion retry, payload conflict, learning guard and role checks passed.\n'
