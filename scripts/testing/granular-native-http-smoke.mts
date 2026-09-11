/** Real Supabase Auth + PostgREST against disposable native Postgres. No Docker,
 * hosted credentials, application dotenv files, or external email delivery. */
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createServer } from "node:http";
import { strict as assert } from "node:assert";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "node:url";

const dependencies = resolve(process.argv[2] ?? "");
if (!process.argv[2] || !dependencies.startsWith("/tmp/plume-native-deps.")) throw Error("Pass the isolated verified native dependency directory");
if (process.argv.slice(3).some(argument => !["--app-schema", "--service-journey", "--browser"].includes(argument))) throw Error("Unknown native smoke argument");
const withJourney = process.argv.includes("--service-journey");
const withBrowser = process.argv.includes("--browser");
if (withJourney && withBrowser) throw Error("Run browser and service scenarios separately");
const withApplication = process.argv.includes("--app-schema") || withJourney || withBrowser;
const repo = fileURLToPath(new URL("../../", import.meta.url));
const pg = "/opt/homebrew/opt/postgresql@18/bin", directory = mkdtempSync("/tmp/plume-native-http.");
const children: ChildProcess[] = [], errors = new Map<string, string>();
const ports = { auth: 56325, rest: 56326, api: 56321, database: 55443 };
const secret = randomBytes(48).toString("base64url");
const environment = { PATH: process.env.PATH ?? "/usr/bin:/bin", HOME: directory, TMPDIR: directory, LANG: "C", LC_ALL: "C" };
const token = (role: string) => {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const body = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ role, iss: "supabase", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 })}`;
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
};
function run(binary: string, args: string[], input?: string, variables: Record<string, string> = {}, cwd = directory) {
  const result = spawnSync(binary, args, { env: { ...environment, ...variables }, cwd, input, encoding: "utf8", timeout: 60_000 });
  if (result.status !== 0) throw Error(`${binary.split("/").at(-1)} failed: ${result.stderr || result.error?.message}${binary.endsWith("pg_ctl") && existsSync(join(directory, "postgres.log")) ? readFileSync(join(directory, "postgres.log"), "utf8").slice(-2000) : ""}`);
  return result.stdout;
}
function sql(input: string) {
  return run(join(pg, "psql"), ["-X", "-U", "postgres", "-h", directory, "-p", String(ports.database), "-d", "postgres", "-v", "ON_ERROR_STOP=1"], input);
}
function service(name: string, binary: string, args: string[], variables: Record<string, string>, cwd = directory) {
  const child = spawn(binary, args, { env: { ...environment, ...variables }, cwd, stdio: ["ignore", "pipe", "pipe"] });
  children.push(child);
  for (const stream of [child.stdout, child.stderr]) stream!.on("data", chunk => errors.set(name, ((errors.get(name) ?? "") + chunk).slice(-6000)));
  child.on("error", error => errors.set(name, error.message));
  return child;
}
async function ready(url: string, child: ChildProcess, name: string) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null || child.signalCode !== null) throw Error(`${name} exited: ${errors.get(name)}`);
    try { if ((await fetch(url, { signal: AbortSignal.timeout(2000) })).ok) return; } catch { /* Startup in progress. */ }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw Error(`${name} did not become healthy: ${errors.get(name)}`);
}
const proxy = createServer(async (request, response) => {
  const auth = request.url?.startsWith("/auth/v1/");
  const rest = request.url?.startsWith("/rest/v1/");
  if (!auth && !rest) { response.writeHead(404).end(); return; }
  const target = `http://127.0.0.1:${auth ? ports.auth : ports.rest}${request.url!.replace(auth ? "/auth/v1" : "/rest/v1", "")}`;
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) if (value && !["host", "connection", "content-length"].includes(key)) headers.set(key, Array.isArray(value) ? value.join(",") : value);
    const upstream = await fetch(target, { method: request.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined, signal: AbortSignal.timeout(10_000) });
    response.writeHead(upstream.status, Object.fromEntries([...upstream.headers].filter(([key]) => !["transfer-encoding", "content-encoding", "content-length"].includes(key))));
    response.end(Buffer.from(await upstream.arrayBuffer()));
  } catch { response.writeHead(502).end("Local upstream unavailable"); }
});

try {
  mkdirSync(join(directory, "logs"));
  run(join(pg, "initdb"), ["-D", join(directory, "data"), "-U", "postgres", "-A", "trust", "--locale=C", "--encoding=UTF8"]);
  run(join(pg, "pg_ctl"), ["-D", join(directory, "data"), "-l", join(directory, "postgres.log"), "-o", `-p ${ports.database} -h '' -k ${directory}`, "start"]);
  sql(`create role anon; create role authenticated; create role service_role bypassrls;
    create role authenticator login noinherit; grant anon, authenticated, service_role to authenticator;
    create role supabase_auth_admin login; create schema auth authorization supabase_auth_admin;
    alter role supabase_auth_admin set search_path=auth,extensions,public;
    create schema extensions; create extension if not exists pgcrypto with schema extensions;
    grant usage on schema public,extensions to supabase_auth_admin;
    grant create on database postgres to supabase_auth_admin;`);
  const databaseUrl = (user: string) => `postgresql://${user}@/postgres?host=${encodeURIComponent(directory)}&port=${ports.database}&sslmode=disable`;
  const authEnvironment = {
    GOTRUE_DB_DRIVER: "postgres", DATABASE_URL: databaseUrl("supabase_auth_admin"), DB_NAMESPACE: "auth",
    GOTRUE_SITE_URL: "http://127.0.0.1:56300", API_EXTERNAL_URL: `http://127.0.0.1:${ports.api}/auth/v1`,
    GOTRUE_API_HOST: "127.0.0.1", PORT: String(ports.auth), GOTRUE_JWT_SECRET: secret,
    GOTRUE_JWT_AUD: "authenticated", GOTRUE_JWT_DEFAULT_GROUP_NAME: "authenticated", GOTRUE_JWT_ADMIN_ROLES: "service_role",
    GOTRUE_EXTERNAL_EMAIL_ENABLED: "true", GOTRUE_MAILER_AUTOCONFIRM: "true", GOTRUE_DISABLE_SIGNUP: "false",
    GOTRUE_SECURITY_REFRESH_TOKEN_ROTATION_ENABLED: "true", GOTRUE_LOG_LEVEL: "warn",
  };
  run(join(dependencies, "auth-runtime/auth"), ["migrate"], undefined, authEnvironment, join(dependencies, "auth-runtime"));
  const auth = service("auth", join(dependencies, "auth-runtime/auth"), ["serve"], authEnvironment, join(dependencies, "auth-runtime"));
  await ready(`http://127.0.0.1:${ports.auth}/health`, auth, "auth");
  sql(`grant usage on schema public,auth,extensions to anon,authenticated,service_role;
    grant execute on all functions in schema auth to anon,authenticated,service_role;
    alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
    alter default privileges in schema public grant all on sequences to anon,authenticated,service_role;
    alter default privileges in schema public grant all on functions to anon,authenticated,service_role;`);
  if (withApplication) {
    const migrations = readdirSync(join(repo, "supabase/migrations")).filter(name => name.endsWith(".sql")).sort();
    for (const migration of migrations) {
      try { sql(readFileSync(join(repo, "supabase/migrations", migration), "utf8")); }
      catch (error) { throw Error(`Application migration ${migration}: ${String(error)}`); }
    }
    console.log(`Applied ${migrations.length} application migrations on the real Auth schema.`);
    if (withJourney || withBrowser) {
      const { buildSyntheticIntegrationBundle } = await import("../../src/lib/diagnostic/granular/testing/synthetic-bundle");
      const { checksum } = await import("../../src/lib/taxonomy/validate");
      const artifact = JSON.parse(readFileSync(join(repo, "generated/french-taxonomy-v3.json"), "utf8"));
      const bundle = buildSyntheticIntegrationBundle(artifact, { taxonomyId: "00000000-0000-4000-8000-000000005001", bankId: "00000000-0000-4000-8000-000000005002" });
      const payload = JSON.stringify({ taxonomy: artifact.taxonomy, taxonomyChecksum: artifact.manifest.contentChecksum, bundle, bundleChecksum: checksum(bundle), releaseKey: withBrowser ? "french-granular-diagnostic-v1" : "full-graph-synthetic-test" }).replaceAll("'", "''");
      sql(`\\set fixture_seed_only true\ncreate temporary table full_graph_fixture(payload jsonb);\ninsert into full_graph_fixture values ('${payload}');\n${readFileSync(join(repo, "scripts/testing/sql/granular-full-graph-test.sql"), "utf8")}`);
      console.log("Seeded the complete French graph and synthetic integration-only release through publication guards.");
    }
  }
  sql(`
    create table public.native_http_ownership(id uuid primary key default extensions.gen_random_uuid(), student_id uuid not null references auth.users(id), body text not null);
    alter table public.native_http_ownership enable row level security;
    create policy own_row on public.native_http_ownership for all to authenticated using (student_id=auth.uid()) with check (student_id=auth.uid());
    grant all on public.native_http_ownership to authenticated,service_role;`);
  const rest = service("rest", join(dependencies, "rest-runtime/postgrest"), [], {
    PGRST_DB_URI: databaseUrl("authenticator"), PGRST_DB_SCHEMAS: "public", PGRST_DB_ANON_ROLE: "anon",
    PGRST_JWT_SECRET: secret, PGRST_SERVER_HOST: "127.0.0.1", PGRST_SERVER_PORT: String(ports.rest), PGRST_LOG_LEVEL: "warn",
  });
  await ready(`http://127.0.0.1:${ports.rest}/`, rest, "rest");
  await new Promise<void>((resolve, reject) => { proxy.once("error", reject); proxy.listen(ports.api, "127.0.0.1", resolve); });
  const api = `http://127.0.0.1:${ports.api}`, anon = token("anon"), options = { auth: { persistSession: false, autoRefreshToken: false } };
  const first = createClient(api, anon, options), second = createClient(api, anon, options);
  const password = `Local-only-${randomBytes(16).toString("hex")}`;
  const studentOptions = { data: { role: "student", display_name: "Local integration student" } };
  const firstSignup = await first.auth.signUp({ email: "first@native-test.invalid", password, options: studentOptions });
  if (firstSignup.error) throw Error(`First sign-up: ${firstSignup.error.message}`);
  const secondSignup = await second.auth.signUp({ email: "second@native-test.invalid", password, options: studentOptions });
  if (secondSignup.error) throw Error(`Second sign-up: ${secondSignup.error.message}`);
  const firstId = firstSignup.data.user!.id, secondId = secondSignup.data.user!.id;
  assert.ok(firstSignup.data.session && secondSignup.data.session);
  const signedIn = await first.auth.signInWithPassword({ email: "first@native-test.invalid", password });
  assert.equal(signedIn.error, null);
  assert.equal((await first.auth.getUser()).data.user?.id, firstId);
  if (withApplication) {
    const studentIds: string[] = [];
    for (const [client, authId] of [[first, firstId], [second, secondId]] as const) {
      const profile = await client.from("profiles").select("id,auth_user_id,role").single();
      assert.equal(profile.error, null, "Signup profile must be readable through authenticated HTTP");
      assert.equal(profile.data?.auth_user_id, authId);
      assert.equal(profile.data?.role, "student");
      const student = await client.from("students").select("id,profile_id").single();
      assert.equal(student.error, null, "Signup must provision exactly one visible student");
      assert.equal(student.data?.profile_id, profile.data?.id);
      studentIds.push(student.data!.id);
    }
    assert.notEqual(studentIds[0], studentIds[1]);
    const otherStudent = await second.from("students").select("id").eq("id", studentIds[0]);
    assert.equal(otherStudent.error, null);
    assert.deepEqual(otherStudent.data, []);
    console.log("Application student signup triggers and profile/student HTTP isolation passed.");
    if (withJourney || withBrowser) {
      sql(`insert into consent_records(student_id,consent_type,consent_version,privacy_policy_version) values('${studentIds[0]}'::uuid,'guardian','local-test','local-test');`);
      if (withBrowser) sql(`insert into consent_records(student_id,consent_type,consent_version,privacy_policy_version) values('${studentIds[1]}'::uuid,'guardian','local-test','local-test');`);
    }
    if (withJourney) {
      const { runNativeServiceJourney } = await import("../../src/lib/diagnostic/granular/testing/native-service-journey");
      await runNativeServiceJourney(createClient(api, token("service_role"), options), first, second, studentIds[0]);
    }
    if (withBrowser) {
      const { copyLocalTestWorkspace } = await import("../../src/lib/diagnostic/granular/testing/local-environment");
      const workspace = join(directory, "application");
      await copyLocalTestWorkspace(repo, workspace);
      // Inject only the existing service clock parameter in the disposable copy.
      // Real auth, grading, persistence, evidence rules and time limits stay intact.
      const clockFile = join(directory, "assessment-clock");
      let assessmentTime = Date.now();
      writeFileSync(clockFile, String(assessmentTime), { mode: 0o600 });
      const actionFile = join(workspace, "src/lib/actions/granular-diagnostic.ts");
      let actionSource = readFileSync(actionFile, "utf8");
      for (const serviceName of ["runAssessmentCommand", "runLearningCheckCommand"]) {
        const original = `${serviceName}(store,studentId,input)`;
        assert.equal(actionSource.split(original).length, 2, "Clock injection must match exactly one trusted service call");
        actionSource = actionSource.replace(original, `${serviceName}(store,studentId,input,()=>Number(readFileSync(${JSON.stringify(clockFile)},"utf8")))`);
      }
      actionSource = actionSource.replace('"use server";', '"use server";\nimport {readFileSync} from "node:fs";');
      writeFileSync(actionFile, actionSource);
      const next = service("next", process.execPath, [join(repo, "node_modules/next/dist/bin/next"), "dev", "--webpack", "--hostname", "127.0.0.1", "--port", "56300"], {
        NODE_ENV: "development", NEXT_TELEMETRY_DISABLED: "1", NEXT_PUBLIC_SUPABASE_URL: api,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: anon, SUPABASE_SERVICE_ROLE_KEY: token("service_role"),
        GRANULAR_DIAGNOSTIC_ENABLED: "true", NEXT_PUBLIC_APP_URL: "http://127.0.0.1:56300",
      }, workspace);
      await ready("http://127.0.0.1:56300/login", next, "next");
      const { runNativeBrowserJourney } = await import("../../src/lib/diagnostic/granular/testing/native-browser-journey");
      try {
        await runNativeBrowserJourney(password, milliseconds => { assessmentTime += milliseconds; writeFileSync(clockFile, String(assessmentTime)); }, async () => {
          const result = await createClient(api, token("service_role"), options).from("granular_assessment_sessions").select("state").eq("student_id", studentIds[0]).single();
          assert.equal(result.error, null);
          return result.data!.state;
        });
        const saved = await createClient(api, token("service_role"), options).from("granular_assessment_sessions").select("state").eq("student_id", studentIds[0]).single();
        assert.equal(saved.error, null);
        assert.equal(saved.data?.state.phase, "learning");
        assert.equal(saved.data?.state.completionReason, "time_budget");
        assert.equal(saved.data?.state.activeSeconds, 2100);
        assert.equal(saved.data?.state.refinements.length, 1, "Independent check must persist evidence");
        assert.equal(saved.data?.state.refinements[0].correct, true, "Correct answer and supporting passage must both pass");
        assert.equal(saved.data?.state.completedTeachingIds.length, 1, "Successful check must retain completed teaching");
      }
      catch (error) { throw Error(`${String(error)}\nNext server output: ${errors.get("next")}`); }
    }
  }
  assert.equal((await first.from("native_http_ownership").insert({ student_id: firstId, body: "first-only" })).error, null);
  assert.equal((await second.from("native_http_ownership").insert({ student_id: secondId, body: "second-only" })).error, null);
  assert.deepEqual((await first.from("native_http_ownership").select("body")).data, [{ body: "first-only" }]);
  assert.deepEqual((await second.from("native_http_ownership").select("body")).data, [{ body: "second-only" }]);
  assert.ok((await second.from("native_http_ownership").insert({ student_id: firstId, body: "forbidden" })).error);
  assert.deepEqual((await second.from("native_http_ownership").update({ body: "forbidden" }).eq("student_id", firstId).select("body")).data, []);
  assert.equal((await first.auth.refreshSession()).error, null);
  assert.deepEqual((await first.from("native_http_ownership").select("body")).data, [{ body: "first-only" }]);
  const admin = createClient(api, token("service_role"), options);
  assert.equal((await admin.from("native_http_ownership").select("body")).data?.length, 2);
  assert.equal((await first.auth.signOut()).error, null);
  const anonymous = createClient(api, anon, options);
  const anonymousRows = await anonymous.from("native_http_ownership").select("body");
  assert.ok(anonymousRows.error || anonymousRows.data?.length === 0, "Anonymous requests must never receive student rows");
  console.log(`Native Supabase HTTP smoke passed${withApplication ? " with the full application schema" : ""}: official Auth sign-up/password login/getUser/refresh/logout, PostgREST JWT validation, two-user RLS isolation and service role. ${withBrowser ? "Synthetic browser journey and persisted learning evidence verified; no pedagogical or production-readiness claim." : "No browser journey claim."}`);
} finally {
  proxy.closeAllConnections(); proxy.close();
  await Promise.all(children.map(child => new Promise<void>(resolve => {
    if (child.exitCode !== null || child.signalCode !== null) return resolve();
    child.once("exit", () => resolve()); child.kill("SIGTERM");
    const timer = setTimeout(() => child.kill("SIGKILL"), 3000); timer.unref();
  })));
  spawnSync(join(pg, "pg_ctl"), ["-D", join(directory, "data"), "-m", "immediate", "stop"], { env: environment, stdio: "ignore", timeout: 10_000 });
  // Never retain local JWTs, account state or server logs after the run.
  rmSync(directory, { recursive: true, force: true });
}
