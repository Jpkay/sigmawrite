/** Apply only the reviewed query-performance migration; never push other migrations. */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
const [mode, reviewerEmail] = process.argv.slice(2);
if (!["--check", "--apply"].includes(mode) || !reviewerEmail || process.argv.length !== 4) {
  throw new Error("Use --check or --apply followed by the existing administrator email.");
}
const project = "pwztnrirtrnicywvdbpz";
if (readFileSync("supabase/.temp/project-ref", "utf8").trim() !== project
  || new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname !== `${project}.supabase.co`) {
  throw new Error("Not the reviewed public-pilot project.");
}
const version = "20260914103000";
const name = "review_rls_initplans";
const source = readFileSync(`supabase/migrations/${version}_${name}.sql`, "utf8");
const body = source.replace(/^begin;\s*$/m, "").replace(/^commit;\s*$/m, "");
if (/\b(?:begin|commit|rollback)\s*;/i.test(body)) throw new Error("Unexpected migration transaction boundary.");
const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;
const readPredicate = "(((auth.uid() IS NOT NULL) AND (review_status = ANY (ARRAY['auto_approved'::text, 'human_approved'::text]))) OR is_staff())";
const policies = [
  ["competency_items", "competency_items_read", "SELECT", readPredicate, null],
  ["competency_nodes", "competency_nodes_read", "SELECT", readPredicate, null],
  ["competency_items", "competency_items_staff_write", "ALL", "is_staff()", "is_staff()"],
  ["competency_item_choices", "competency_item_choices_staff_write", "ALL", "is_staff()", "is_staff()"],
  ["diagnostic_item_bank_releases", "diagnostic_bank_staff_write", "ALL", "is_staff()", "is_staff()"],
  ["diagnostic_item_bank_memberships", "diagnostic_bank_membership_staff_write", "ALL", "is_staff()", "is_staff()"],
  ["taxonomy_releases", "taxonomy_releases_staff_write", "ALL", "is_staff()", "is_staff()"],
  ["taxonomy_release_memberships", "taxonomy_release_memberships_staff_write", "ALL", "is_staff()", "is_staff()"],
];
const expected = policies.map(row => `(${row.map(value => value === null ? "null::text" : literal(value)).join(",")})`).join(",");
const sql = `begin;
set local lock_timeout='3s';
set local statement_timeout='8s';
select pg_advisory_xact_lock(hashtext('plume-reviewed-release-migrations'));
create temporary table review_performance_actor(id uuid);
insert into review_performance_actor
select u.id from auth.users u join public.profiles p on p.auth_user_id=u.id
where u.email=${literal(reviewerEmail)} and p.role='platform_admin' and p.deactivated_at is null;
do $guard$ begin
  if (select count(*) from review_performance_actor) <> 1 then raise exception 'active_administrator_required'; end if;
  if exists(select 1 from supabase_migrations.schema_migrations where version=${literal(version)}) then
    raise exception 'migration_already_recorded';
  end if;
  if (select count(*) from (values ${expected}) e(table_name,policy_name,command,read_predicate,write_predicate)
    join pg_policies p on p.schemaname='public' and p.tablename=e.table_name and p.policyname=e.policy_name
      and p.cmd=e.command and p.roles=array['public']::name[] and p.permissive='PERMISSIVE'
      and p.qual=e.read_predicate and p.with_check is not distinct from e.write_predicate) <> 8 then
    raise exception 'policy_drift_requires_review';
  end if;
end $guard$;
${body}
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims',json_build_object('sub',id,'role','authenticated')::text,true) is not null
from review_performance_actor;
set local role authenticated;
do $administrator$ declare pending bigint; started timestamptz:=clock_timestamp(); begin
  assert public.is_staff(), 'administrator_context_missing';
  select count(*) into pending from public.competency_items i
  where i.prompt_version='diagnostic-bank-v2' and i.review_status='needs_human_review'
    and exists(select 1 from public.diagnostic_item_bank_memberships m where m.item_id=i.id);
  assert pending > 0, 'expected_pending_review_items_missing';
  assert clock_timestamp()-started < interval '8 seconds', 'review_query_exceeds_role_timeout';
end $administrator$;
select set_config('request.jwt.claims','{}',true);
do $anonymous$ begin
  assert not coalesce(public.is_staff(),false), 'missing_identity_has_staff_access';
  assert not exists(select 1 from public.competency_items where review_status='needs_human_review'),
    'missing_identity_can_read_unreviewed_items';
end $anonymous$;
reset role;
${mode === "--apply" ? `insert into supabase_migrations.schema_migrations(version,name,statements)
values(${literal(version)},${literal(name)},array[${literal(source)}]);` : ""}
${mode === "--apply" ? "commit" : "rollback"};`;
const result = spawnSync("supabase", ["db", "query", "--linked", sql, "--output", "json"], {
  encoding: "utf8", timeout: 45_000, maxBuffer: 1_000_000,
});
if (result.error || result.status !== 0) {
  throw new Error("Outcome not confirmed. Inspect policy definitions and migration ledger before retrying; remote output suppressed.");
}
console.log(JSON.stringify({ project, version, mode, administratorQueryPassed: true, missingIdentityDenied: true, applied: mode === "--apply" }));
