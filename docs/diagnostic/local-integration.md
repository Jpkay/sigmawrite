# Isolated authenticated integration environment

The real Next.js → Supabase Auth → PostgREST → database journey remains unverified.
Browser fixtures and the separate full-schema SQL harness do not establish this
integration. The local Docker endpoint currently times out or returns HTTP 500;
no global Docker restart was attempted because other projects may use it.

## Preparation

Run `npx tsx scripts/testing/prepare-granular-local-stack.mts` to copy the current
source into a new temporary directory, write a uniquely named local Supabase
project, and record its status in `granular-local-stack.json`.

Add `--start` to check the local Docker service and start only that isolated
Supabase project. Startup output is captured because it can contain local keys.
The runner verifies that the CLI reports exactly the dedicated loopback endpoints
before creating a mode-0600 `.env.local` inside the temporary workspace. It does
not copy the source project's environment files, Supabase `.temp` link state,
external symlinks, deployment settings or private key files. The only deliberate
symlink is the installed `node_modules` directory.

Ports: application 56300, API 56321, database 56322 and migration shadow 56320.
Hosted endpoints, the existing project's 553xx ports, URL decorations and inherited
Docker/Node environment overrides are rejected. External monitoring and AI keys
are not inherited. The existing project's services are not stopped or reused.

## Remaining integration work

The disposable native-PostgreSQL harness generates 80 actual engine states and
persists each revision through the application schema. It checks mixed answers
and a skip, overnight pause/resume, the 35-minute handoff, a fresh independent
check, exact state round trips, learning access and stale-write rejection.
Run `sh scripts/testing/granular-full-schema-db.sh`.

In addition to the smaller constraint fixtures, it now imports all 181 approved
competencies, 257 evidence definitions, graph edges and the complete synthetic
question bank into relational tables. It publishes the test taxonomy/bank/bundle
through normal database guards, verifies stored prompts, answer keys, validator
metadata, reviewer identity and choices against the bundle, and persists the
journey against this complete release. Existing migration-seeded nodes are
reconciled inside the rollback transaction. The source graph is unchanged.

This is not authenticated HTTP: auth users are seeded through the native test
bootstrap. The synthetic review identities are test data, not real approvals.
Generated inputs and the disposable database are removed on exit.

An in-memory fixture builder now exists at
`src/lib/diagnostic/granular/testing/synthetic-bundle.ts`. It covers all 181
approved competencies and 257 evidence targets and passes the normal release
store validators, including sufficient disjoint question pools. Its explicitly
synthetic prompts and review fields are integration data, not approved teaching
content. The builder itself creates no files or database records; the disposable
database runner may serialize it only into its private temporary directory.

The prepared stack disables automatic seed scripts. It still needs an explicit,
local-only fixture seeder for authenticated synthetic students, required consent,
and a valid graph-bound diagnostic/activity release. Test-only publication records
must never be copied to a real release or treated as pedagogical approvals.

Then run Next from the isolated directory on port 56300 with `--webpack` and test
onboarding, assessment, skips, interruption/resume, results, teaching, guided
practice, a fresh independent check and the changed pathway. Include a second
student to verify isolation, plus network retries and conflicting revisions.
Neither successful container startup nor successful fixture publication should be
reported as a passing authenticated journey.

The manifest records preparation/startup status separately from `fixturesSeeded`
and `authenticatedJourneyTested`. Both remain false until those steps are actually
performed and verified. Stop only the uniquely named test stack when finished.

## Native Auth and PostgREST alternative

`scripts/testing/granular-native-http-smoke.mts` uses an owned disposable PostgreSQL
18 cluster on a private Unix socket, official Auth v2.197.0 on loopback 56325,
PostgREST v14.18 on loopback 56326 and a local Supabase-path proxy on 56321.
It does not load project dotenv files or contact a hosted database. Ports must be
free; do not stop unrelated services to acquire them.

Place the official macOS ARM archives and extracted runtimes in a private directory
named `/tmp/plume-native-deps.*`. Auth must have its `auth` binary and `migrations`
directory under `auth-runtime`; PostgREST must be `rest-runtime/postgrest`.
Pinned archive SHA256 values:

- Auth `auth-v2.197.0-darwin-arm64.tar.gz`: `3fb7998e7061e2c14f3f9555b1d94d447358c965395728e0d81eac82e0e5868b`
- PostgREST `postgrest-v14.18-macos-aarch64.tar.xz`: `e38374c68b927c565b62eebfd32f7b3ce4fe8801cac41c21565a1ce7dbac85b6`

Run `npx tsx scripts/testing/granular-native-http-smoke.mts <dependency-directory>
--app-schema` for migrations, signup triggers, profile/student HTTP ownership,
password login, refresh, logout and two-user row isolation.

The `--service-journey` mode additionally seeds the synthetic full graph through
normal database publication guards and exercises the production store and service
functions over HTTP. Run with `node --conditions=react-server --import tsx
scripts/testing/granular-native-http-smoke.mts <dependency-directory>
--service-journey` to use Node's server-only module condition. The assessment clock
is accelerated; content is synthetic. This mode is distinct from a Next.js browser
or server-action test and cannot establish pedagogical validity or production
readiness. The database and child services are removed in the runner's finalizer.

The `--browser` mode starts the actual Next.js application on loopback 56300 from
an isolated current-source copy. The copy excludes dotenv files, linked project
state and external symlinks. It logs in through the real login page, exercises
assessment server actions, pauses/reloads/resumes, reaches results, completes a
recommended lesson and practice, and checks the same skill independently.

For this bounded test, only the disposable copy of the granular action file
receives an injected `now` callback through the service's existing clock parameter.
The callback reads a private local clock file controlled by the harness. No clock
hook is added to production source. Authentication, grading, graph rules,
persistence and the 2,100-second stopping policy are unchanged. The runner checks
saved active time, completion reason, completed lesson and independent refinement
after the browser scenario. The database still holds explicitly synthetic content;
this cannot establish pedagogical validity or replace broader profile calibration.

Command: `node --conditions=react-server --import tsx
scripts/testing/granular-native-http-smoke.mts <dependency-directory> --browser`.
Run browser and service scenarios separately; each owns and cleans its own stack.
The scenario screenshot is `/tmp/granular-native-next-question.png` (the final
results view when the full scenario succeeds). No account cookies are exported.

The browser scenario also forwards concurrent duplicate answer submissions to the
real server, loses their responses, and retries through the UI. It compares saved
observations to prove no duplicate evidence. At the end, a second authorized student
logs in with a separate cookie context and replays the captured first-student action;
its rejection must leave the owner's state unchanged. Both students have local
consent, so ownership is tested independently of the invitation/consent gate.
