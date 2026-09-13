/** Explicit two-migration integration gate, not a general pending-migration push. */
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {config} from 'dotenv';
config({path: '.env.local', quiet: true});
if (process.argv[2] !== '--apply') throw Error('Requires --apply after native full-schema tests and live read-only preflight');
const project = readFileSync('supabase/.temp/project-ref', 'utf8').trim();
if (new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname !== `${project}.supabase.co`) throw Error('Linked database mismatch');
const names = ['20260913110000_tighten_school_inquiries', '20260913111000_passage_automation_fail_closed'];
const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;
const migrations = names.map(name => ({name, version: name.split('_')[0], sql: readFileSync(`supabase/migrations/${name}.sql`, 'utf8')}));
const sql = `begin;
set local lock_timeout='10s';
set local statement_timeout='60s';
select pg_advisory_xact_lock(hashtext('plume-reviewed-release-migrations'));
create temporary table release_policy_before on commit drop as select to_jsonb(p) payload from public.passage_automation_policy p;
do $guard$ begin
 if exists(select 1 from supabase_migrations.schema_migrations where version in (${migrations.map(m => literal(m.version)).join(',')})) then
  raise exception 'Migration already recorded: inspect exact state before retry';
 end if;
 if (select count(*) from supabase_migrations.schema_migrations where version in ('0102','0134','0135','0136','0137','0138','0139'))<>7 then
  raise exception 'Missing historical prerequisite';
 end if;
end $guard$;
${migrations.map(m => `${m.sql}\ninsert into supabase_migrations.schema_migrations(version,name,statements) values (${literal(m.version)},${literal(m.name.slice(m.version.length + 1))},array[${literal(m.sql)}]);`).join('\n')}
do $verify$ begin
 if not exists(select 1 from public.passage_automation_policy p where enabled and public.passage_automation_policy_is_valid(p)) then
  raise exception 'Existing live policy does not pass the forward guard';
 end if;
 if (select payload from release_policy_before) is distinct from (select to_jsonb(p) from public.passage_automation_policy p) then
  raise exception 'Policy changed unexpectedly';
 end if;
end $verify$;
commit;
select jsonb_build_object('versions',jsonb_build_array(${migrations.map(m => literal(m.version)).join(',')}),'policyUnchanged',true,'policyValid',true) applied;`;
try {
  const result = execFileSync('supabase', ['db', 'query', '--linked', sql, '--output', 'json'], {encoding: 'utf8', maxBuffer: 1000000});
  console.log(result);
} catch {
  throw Error('Migration outcome not confirmed. Inspect ledger and exact policy state before any retry; do not blindly reapply.');
}
