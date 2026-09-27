/**
 * Guarded, rollback-only verification of the deployed school onboarding SQL.
 * This proves database contracts only; it does not verify browser UI behavior.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const EXPECTED_PROJECT_REF = "pwztnrirtrnicywvdbpz";
const EXPECTED_MIGRATIONS = [
  ["20260914100000", "school_self_service"],
  ["20260914101000", "teacher_assignment_boundaries"],
  ["20260914102000", "school_invitations"],
] as const;
const CONFIRMATION = `--confirm-public-pilot=${EXPECTED_PROJECT_REF}`;
const CANDIDATE_PREFLIGHT = `--candidate-preflight=${EXPECTED_PROJECT_REF}`;
const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function usage() {
  return `Usage: npx tsx scripts/verify-school-onboarding-hosted.mts ${CONFIRMATION}\n       npx tsx scripts/verify-school-onboarding-hosted.mts ${CANDIDATE_PREFLIGHT}\n       npx tsx scripts/verify-school-onboarding-hosted.mts --check`;
}

/** Remove exactly one outer transaction without touching nested SQL blocks. */
function stripOuterTransaction(source: string, label: string) {
  const lines = source.replace(/^\uFEFF/, "").split(/\r?\n/);
  const significant = lines
    .map((line, index) => ({ index, text: line.trim() }))
    .filter(({ text }) => text && !text.startsWith("--"));
  const first = significant[0];
  const last = significant.at(-1);
  if (!first || !/^begin\s*;$/i.test(first.text) || !last || !/^rollback\s*;$/i.test(last.text)) {
    throw new Error(`${label} must have one explicit outer BEGIN/ROLLBACK transaction.`);
  }
  return lines.filter((_, index) => index !== first.index && index !== last.index).join("\n");
}

function readRawTest(relativePath: string) {
  const source = readFileSync(join(repositoryRoot, relativePath), "utf8");
  if (/create\s+extension[^;]*pgtap|select\s+(?:plan|ok|is|lives_ok|throws_ok|finish)\s*\(/i.test(source)) {
    throw new Error(`${relativePath} is no longer a raw assertion test.`);
  }
  return stripOuterTransaction(source, relativePath);
}

/** Reuse the current invitation fixtures while replacing its pgTAP assertions. */
function invitationFixtures() {
  const relativePath = "supabase/tests/20260914102000_school_invitations_test.sql";
  const source = readFileSync(join(repositoryRoot, relativePath), "utf8");
  const startMarker = "insert into public.schools(id,name,teacher_code) values";
  const endMarker = "select throws_ok(";
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`${relativePath} invitation fixture boundary changed; review before hosted verification.`);
  }
  const fixtures = source.slice(start, end);
  for (const required of [
    "14200000-0000-4000-8000-000000000001",
    "test.invite_teacher_one",
    "SW-FOREIGN-OLD",
  ]) {
    if (!fixtures.includes(required)) throw new Error(`${relativePath} is missing reviewed fixture ${required}.`);
  }
  return fixtures;
}

/** Reuse the pgTAP-free auth-trigger tail maintained by the invitation test. */
function invitationNativeTail() {
  const relativePath = "supabase/tests/20260914102000_school_invitations_test.sql";
  const source = readFileSync(join(repositoryRoot, relativePath), "utf8");
  const startMarker = "-- Exercise the real 0126 auth-user trigger contract.";
  const endMarker = "select * from finish();";
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`${relativePath} native invitation boundary changed; review before hosted verification.`);
  }
  const tail = source.slice(start, end);
  if (/select\s+(?:plan|ok|is|lives_ok|throws_ok|finish)\s*\(/i.test(tail)) {
    throw new Error(`${relativePath} native invitation tail now depends on pgTAP.`);
  }
  return tail;
}

function quoted(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function buildHostedSql(candidatePreflight = false) {
  const schoolTest = readRawTest("supabase/tests/20260914100000_school_self_service_test.sql")
    .replaceAll("@example.invalid", "@school-self-service.example.invalid");
  const assignmentTest = readRawTest("supabase/tests/20260914101000_teacher_assignment_boundaries_test.sql")
    .replaceAll("@example.invalid", "@teacher-assignment.example.invalid");
  const invitationFixtureSql = invitationFixtures()
    .replaceAll("@example.invalid", "@school-invitation.example.invalid");
  const invitationNativeSql = invitationNativeTail()
    .replaceAll("@example.invalid", "@school-invitation.example.invalid");
  const migrationRows = EXPECTED_MIGRATIONS
    .map(([version, name]) => `(${quoted(version)},${quoted(name)})`)
    .join(",");

  return `begin;
set local lock_timeout = '10s';
set local statement_timeout = '120s';
set local search_path = public;
select pg_advisory_xact_lock(hashtext('plume-school-hosted-smoke'));
create temporary table hosted_school_verification_suites(name text primary key);

${candidatePreflight ? `
-- Rehearse the exact pending release and all assertions atomically. Even the
-- migration ledger entries disappear at the final ROLLBACK.
do $pending$ begin
  if exists(select 1 from supabase_migrations.schema_migrations
    where version in (${EXPECTED_MIGRATIONS.map(([version]) => quoted(version)).join(",")})) then
    raise exception 'candidate_migration_already_applied';
  end if;
end $pending$;
${EXPECTED_MIGRATIONS.map(([version, name]) => {
  const migration = readFileSync(join(repositoryRoot, `supabase/migrations/${version}_${name}.sql`), "utf8");
  return `${migration}\ninsert into supabase_migrations.schema_migrations(version,name,statements) values (${quoted(version)},${quoted(name)},array[${quoted(migration)}]);`;
}).join("\n")}
` : ""}

do $ledger$ begin
  if (
    select count(*)
    from (values ${migrationRows}) expected(version,name)
    join supabase_migrations.schema_migrations applied
      on applied.version=expected.version and applied.name=expected.name
  ) <> ${EXPECTED_MIGRATIONS.length} then
    raise exception 'expected_school_onboarding_migrations_missing';
  end if;
end $ledger$;

-- Fixed-prefix preflight makes every synthetic UUID collision fail before the
-- first fixture insert. It also protects broad fixture update predicates from
-- ever matching pre-existing rows.
do $fixtures$ begin
  if exists(select 1 from public.organizations where id::text like '91400000-%')
    or exists(select 1 from public.schools where id::text like any(array['91400000-%','14100000-%','14200000-%']))
    or exists(select 1 from public.classes where id::text like any(array['91400000-%','14100000-%','14200000-%']))
    or exists(select 1 from public.students where id::text like '14100000-%')
    or exists(select 1 from auth.users where id::text like any(array['91400000-%','14100000-%','14200000-%']))
    or exists(select 1 from public.profiles where auth_user_id::text like any(array['91400000-%','14100000-%','14200000-%']))
    or exists(select 1 from public.schools where upper(teacher_code)='TEACH-ACTIVE')
    or exists(select 1 from public.class_join_codes where code=any(array[
      'SW-FOREIGN-OLD','SW-SECOND-ACTIVE','SW-REVOKED-STUDENT','SW-EXPIRED-STUDENT','SW-FULL-STUDENT'
    ])) then
    raise exception 'synthetic_fixture_collision';
  end if;
end $fixtures$;

reset role;
${schoolTest}
reset role;
insert into hosted_school_verification_suites values ('school_self_service');
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claim.role','',true);
select set_config('request.jwt.claims','{}',true);

${assignmentTest}
reset role;
insert into hosted_school_verification_suites values ('teacher_assignment_boundaries');
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claim.role','',true);
select set_config('request.jwt.claims','{}',true);

set local role postgres;
set local search_path = public;
do $invitation_contract$ begin
  assert to_regprocedure('public.can_manage_class_invitations(uuid)') is not null;
  assert to_regprocedure('public.rotate_class_join_code(uuid,integer,integer)') is not null;
  assert not has_function_privilege('anon','public.rotate_class_join_code(uuid,integer,integer)','EXECUTE');
  assert has_function_privilege('authenticated','public.rotate_class_join_code(uuid,integer,integer)','EXECUTE');
  assert upper(pg_get_functiondef('public.rotate_class_join_code(uuid,integer,integer)'::regprocedure)) like '%FOR UPDATE%';
  assert exists (
    select 1 from pg_trigger trigger
    join pg_class relation on relation.oid=trigger.tgrelid
    join pg_namespace namespace on namespace.oid=relation.relnamespace
    where namespace.nspname='auth' and relation.relname='users'
      and trigger.tgname='validate_teacher_signup_code_before_insert' and not trigger.tgisinternal
  );
end $invitation_contract$;

${invitationFixtureSql}

do $teacher_signup$ begin
  begin
    insert into auth.users(id,email,raw_user_meta_data)
    values('14200000-0000-4000-8000-000000000007','invalid@school-invitation.example.invalid','{"role":"teacher","teacher_code":"REVOKED"}');
    raise exception 'invalid teacher code accepted';
  exception when invalid_parameter_value then assert sqlerrm='teacher_code_invalid'; end;
  assert not exists(select 1 from public.profiles where auth_user_id='14200000-0000-4000-8000-000000000007');
  insert into auth.users(id,email,raw_user_meta_data)
  values('14200000-0000-4000-8000-000000000008','valid@school-invitation.example.invalid','{"role":"teacher","teacher_code":"teach-active"}');
  assert exists(
    select 1 from public.profiles
    where auth_user_id='14200000-0000-4000-8000-000000000008'
      and role='teacher' and school_id='14200000-0000-0000-0000-000000000001'
  );
end $teacher_signup$;

select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','14200000-0000-4000-8000-000000000003',true);
set local role authenticated;
do $teacher_one$ begin
  assert public.can_manage_class_invitations('14200000-0000-0000-0000-000000000011');
  assert not public.can_manage_class_invitations('14200000-0000-0000-0000-000000000012');
  perform public.rotate_class_join_code('14200000-0000-0000-0000-000000000011',14,40);
  assert exists(
    select 1 from public.class_join_codes
    where class_id='14200000-0000-0000-0000-000000000011' and revoked_at is null
      and code ~ '^SW-[0-9A-F]{32}$' and char_length(code)=35 and max_uses=40
  );
end $teacher_one$;

select set_config('request.jwt.claim.sub','14200000-0000-4000-8000-000000000004',true);
do $teacher_two$ begin
  perform public.rotate_class_join_code('14200000-0000-0000-0000-000000000011',30,80);
  assert (select count(*) from public.class_join_codes where class_id='14200000-0000-0000-0000-000000000011' and revoked_at is null)=1;
  assert (select count(*) from public.class_join_codes where class_id='14200000-0000-0000-0000-000000000011' and revoked_at is not null)=1;
end $teacher_two$;

select set_config('request.jwt.claim.sub','14200000-0000-4000-8000-000000000001',true);
do $school_admin$ begin
  perform public.rotate_class_join_code('14200000-0000-0000-0000-000000000011',7,25);
  assert (select count(*) from public.class_join_codes where revoked_at is null)=1;
end $school_admin$;

do $scope_denials$ begin
  perform set_config('request.jwt.claim.sub','14200000-0000-4000-8000-000000000002',true);
  begin
    perform public.rotate_class_join_code('14200000-0000-0000-0000-000000000011',14,40);
    raise exception 'foreign school administrator rotated code';
  exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
  perform set_config('request.jwt.claim.sub','14200000-0000-4000-8000-000000000005',true);
  begin
    perform public.rotate_class_join_code('14200000-0000-0000-0000-000000000011',14,40);
    raise exception 'unassigned teacher rotated code';
  exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
  perform set_config('request.jwt.claim.sub','14200000-0000-4000-8000-000000000006',true);
  begin
    perform public.rotate_class_join_code('14200000-0000-0000-0000-000000000011',14,40);
    raise exception 'foreign teacher rotated code';
  exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
end $scope_denials$;

reset role;
update public.profiles set deactivated_at=now() where id=current_setting('test.invite_teacher_two')::uuid;
select set_config('request.jwt.claim.sub','14200000-0000-4000-8000-000000000004',true);
set local role authenticated;
do $deactivated_teacher$ begin
  assert not public.can_manage_class_invitations('14200000-0000-0000-0000-000000000011');
  begin
    perform public.rotate_class_join_code('14200000-0000-0000-0000-000000000011',14,40);
    raise exception 'deactivated teacher rotated code';
  exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
end $deactivated_teacher$;

select set_config('request.jwt.claim.sub','14200000-0000-4000-8000-000000000001',true);
do $bounded_limits$ begin
  begin
    perform public.rotate_class_join_code('14200000-0000-0000-0000-000000000011',0,40);
    raise exception 'invalid lifetime accepted';
  exception when invalid_parameter_value then assert sqlerrm='invalid_invite_limits'; end;
  begin
    perform public.rotate_class_join_code('14200000-0000-0000-0000-000000000011',14,501);
    raise exception 'invalid use count accepted';
  exception when invalid_parameter_value then assert sqlerrm='invalid_invite_limits'; end;
  assert (select count(*) from public.class_join_codes where class_id='14200000-0000-0000-0000-000000000011' and revoked_at is null)=1;
end $bounded_limits$;

select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claim.role','',true);
do $missing_identity$ begin
  assert not public.can_manage_class_invitations('14200000-0000-0000-0000-000000000011');
  begin
    perform public.rotate_class_join_code('14200000-0000-0000-0000-000000000011',14,40);
    raise exception 'missing identity rotated code';
  exception when insufficient_privilege then assert sqlerrm='forbidden'; end;
end $missing_identity$;

reset role;
do $direct_boundary$ begin
  begin
    insert into public.class_join_codes(code,class_id,expires_at,max_uses)
    values('SW-SECOND-ACTIVE','14200000-0000-0000-0000-000000000011',now()+interval '1 day',5);
    raise exception 'duplicate active invitation accepted';
  exception when unique_violation then null; end;
  assert (select count(*) from public.class_join_codes where class_id='14200000-0000-0000-0000-000000000011' and revoked_at is null)=1;
  assert has_table_privilege('authenticated','public.class_join_codes','SELECT');
  assert not has_table_privilege('authenticated','public.class_join_codes','INSERT');
  assert not has_table_privilege('authenticated','public.class_join_codes','UPDATE');
  assert not has_table_privilege('authenticated','public.class_join_codes','DELETE');
end $direct_boundary$;

${invitationNativeSql}

insert into hosted_school_verification_suites values ('school_invitations');
do $complete$ begin
  assert (select count(*) from hosted_school_verification_suites)=3;
end $complete$;
rollback;`;
}

function runSilently(command: string, args: string[], label: string) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    maxBuffer: 1_000_000,
    timeout: 180_000,
  });
  if (result.error || result.status !== 0) throw new Error(`${label} failed; command output was suppressed.`);
}

function verifyInDisposablePostgres(sql: string, candidatePreflight = false) {
  const pgBin = process.env.PLUME_SCHOOL_PG_BIN ?? "/opt/homebrew/opt/postgresql@18/bin";
  for (const executable of ["initdb", "pg_ctl", "psql"]) {
    if (!existsSync(join(pgBin, executable))) {
      throw new Error(`Disposable PostgreSQL executable missing: ${join(pgBin, executable)}`);
    }
  }

  const temporaryDirectory = mkdtempSync(join(tmpdir(), "plume-school-hosted-check-"));
  const dataDirectory = join(temporaryDirectory, "data");
  const sqlPath = join(temporaryDirectory, "verification.sql");
  const port = String(55_000 + (process.pid % 1_000));
  const psql = ["-X", "-U", "postgres", "-h", temporaryDirectory, "-p", port, "-d", "postgres", "-v", "ON_ERROR_STOP=1"];
  let started = false;

  try {
    runSilently(join(pgBin, "initdb"), ["-D", dataDirectory, "-U", "postgres", "-A", "trust"], "Disposable initdb");
    runSilently(
      join(pgBin, "pg_ctl"),
      ["-D", dataDirectory, "-l", join(temporaryDirectory, "server.log"), "-o", `-p ${port} -h '' -k ${temporaryDirectory}`, "start"],
      "Disposable PostgreSQL start",
    );
    started = true;
    runSilently(join(pgBin, "psql"), [...psql, "-f", join(repositoryRoot, "scripts/testing/sql/supabase-auth-bootstrap.sql")], "Auth bootstrap");

    const migrations = readdirSync(join(repositoryRoot, "supabase/migrations"))
      .filter((name) => name.endsWith(".sql"))
      .sort();
    for (const migration of migrations) {
      if (candidatePreflight && EXPECTED_MIGRATIONS.some(([version, name]) => migration === `${version}_${name}.sql`)) continue;
      runSilently(join(pgBin, "psql"), [...psql, "-f", join(repositoryRoot, "supabase/migrations", migration)], `Migration ${migration}`);
    }

    const ledgerRows = EXPECTED_MIGRATIONS
      .map(([version, name]) => `(${quoted(version)},${quoted(name)},array[]::text[])`)
      .join(",");
    runSilently(join(pgBin, "psql"), [...psql, "-c", `
      create schema if not exists supabase_migrations;
      create table supabase_migrations.schema_migrations(version text primary key,name text not null,statements text[]);
      ${candidatePreflight ? "" : `insert into supabase_migrations.schema_migrations(version,name,statements) values ${ledgerRows};`}
    `], "Synthetic migration ledger setup");

    writeFileSync(sqlPath, sql, { encoding: "utf8", mode: 0o600 });
    runSilently(join(pgBin, "psql"), [...psql, "-f", sqlPath], "Composed rollback verification");
    runSilently(join(pgBin, "psql"), [...psql, "-c", `
      do $$ begin
        assert (select count(*) from supabase_migrations.schema_migrations)=${candidatePreflight ? 0 : EXPECTED_MIGRATIONS.length};
        ${candidatePreflight ? "assert to_regprocedure('public.create_school_with_organization(text,uuid,text,text,text,text)') is null;" : ""}
        assert not exists(select 1 from public.organizations where id::text like '91400000-%');
        assert not exists(select 1 from public.schools where id::text like any(array['91400000-%','14100000-%','14200000-%']));
        assert not exists(select 1 from auth.users where id::text like any(array['91400000-%','14100000-%','14200000-%']));
      end $$;
    `], "Rollback residue check");
  } finally {
    if (started) {
      spawnSync(join(pgBin, "pg_ctl"), ["-D", dataDirectory, "-m", "immediate", "stop"], { stdio: "ignore" });
    }
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function main() {
  const argument = process.argv[2];
  if (argument === "--help" || argument === "-h") {
    console.log(usage());
    return;
  }
  if (argument === "--check") {
    for (const candidatePreflight of [false, true]) {
      const sql = buildHostedSql(candidatePreflight);
      if (!sql.startsWith("begin;") || !sql.trimEnd().endsWith("rollback;") || /\bcommit\b/i.test(sql) || /create\s+extension[^;]*pgtap/i.test(sql)) {
        throw new Error("Hosted SQL composition is not one pgTAP-free rollback transaction.");
      }
      verifyInDisposablePostgres(sql, candidatePreflight);
    }
    console.log(JSON.stringify({ localDisposableSqlSuitesPassed: 6, candidateMigrationRollbackVerified: true, remoteExecuted: false }));
    return;
  }
  if (argument !== CONFIRMATION && argument !== CANDIDATE_PREFLIGHT) throw new Error(`Explicit public-pilot production confirmation required. ${usage()}`);
  const candidatePreflight = argument === CANDIDATE_PREFLIGHT;

  config({ path: join(repositoryRoot, ".env.local"), quiet: true });
  let linkedProject = "";
  try {
    linkedProject = readFileSync(join(repositoryRoot, "supabase/.temp/project-ref"), "utf8").trim();
  } catch {
    throw new Error("No linked Supabase project found; refusing hosted verification.");
  }
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (linkedProject !== EXPECTED_PROJECT_REF || !configuredUrl) {
    throw new Error("Linked project or configured Supabase URL is not the reviewed public-pilot production target.");
  }
  let configuredHost = "";
  try {
    configuredHost = new URL(configuredUrl).hostname;
  } catch {
    throw new Error("Configured Supabase URL is invalid; refusing hosted verification.");
  }
  if (configuredHost !== `${EXPECTED_PROJECT_REF}.supabase.co`) {
    throw new Error("Configured Supabase URL does not match the linked public-pilot production project.");
  }

  const temporaryDirectory = mkdtempSync(join(tmpdir(), "plume-school-hosted-"));
  const sqlPath = join(temporaryDirectory, "verification.sql");
  try {
    const sql = buildHostedSql(candidatePreflight);
    if (!sql.startsWith("begin;") || !sql.trimEnd().endsWith("rollback;") || /\bcommit\b/i.test(sql)) {
      throw new Error("Hosted verification must be one rollback-only transaction.");
    }
    writeFileSync(sqlPath, sql, { encoding: "utf8", mode: 0o600 });
    const result = spawnSync(
      "supabase",
      ["db", "query", "--linked", "--file", sqlPath, "--output-format", "json", "--log-level", "error"],
      { cwd: repositoryRoot, encoding: "utf8", maxBuffer: 1_000_000, timeout: 180_000 },
    );
    if (result.error || result.status !== 0) {
      throw new Error("Hosted verification outcome not confirmed; remote output was suppressed. The submitted SQL contains no COMMIT.");
    }
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }

  console.log(JSON.stringify({
    projectRef: EXPECTED_PROJECT_REF,
    candidatePreflight,
    migrationsPersisted: false,
    migrationLedgerEntriesVerified: EXPECTED_MIGRATIONS.length,
    rollbackOnlySqlSuitesPassed: 3,
    browserUiVerified: false,
  }));
}

main();
