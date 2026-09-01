# Supabase

Database is the source of truth (PRD §13). This directory holds the schema as
plain SQL migrations so it stays version-controlled and portable.

## Environments

| Environment | Purpose | Configuration | Data policy |
|---|---|---|---|
| Local | Development and migration checks | `supabase/config.toml` | Disposable; `supabase db reset` is expected |
| Staging | Pilot verification and demo accounts | Project `sigmawrite-staging`, ref `pwztnrirtrnicywvdbpz` | Synthetic/demo data only |
| Production | Live pilot data | Hosting secrets; project `tkasvcccucpsbjywgdyl` | Never run demo seeds or ad-hoc migrations |

Staging is a dedicated project in `jkayobotsi@gmail.com's Org`. Do not point
`.env.staging` at production. `scripts/seed-demo.mts` enforces that the project
ref matches the hosted URL before it writes.

## Files

- `migrations/0001_init.sql` — full schema (PRD §21) + `pgvector`.
- `migrations/0002_rls.sql` — Row Level Security policies + helper functions (PRD §14).
- `migrations/0013_relational_learning_evidence.sql` — immutable seed content,
  relational learning-state projection, write policies, and the legacy
  `app_state` write lock.
- `migrations/0014_persistent_content_workflow.sql` — shared candidate review
  metadata, immutable approval links, content-reviewer RLS, and indexed
  scoring/moderation results.
- `migrations/0015_student_lifecycle_and_consent.sql` — expiring class join
  codes, atomic Auth-trigger provisioning/enrollment, school/guardian/student
  consent policies, and consent revocation support.
- `migrations/0016_student_safety_rate_limits.sql` — atomic auth/action windows
  and per-student daily AI budgets with no client-writable counter tables.
- `migrations/0017_safety_write_boundary.sql` — removes direct student
  free-text writes so moderation cannot be bypassed through REST.
- `migrations/0035_human_content_review_portal.sql` — reviewer access,
  immutable passage snapshots, independent assignments and rubric submissions,
  normalized question feedback, editorial resolutions, notifications, and
  exact six-passage benchmark governance.
- `seed.sql` — reference data: knowledge domains, foundation skills, starter concepts.
- `config.toml` — local/CI ports, Postgres version, migration and seed settings.

## Applying

**Option A — Supabase CLI (recommended for local dev):**

```bash
supabase start         # local Postgres + Studio
supabase db reset      # applies migrations/*.sql then seed.sql
```

For the migration-only check used in CI:

```bash
supabase db start
```

**Option B — remote project:**

Link the intended non-production project, preview, and apply migrations plus
reference seed:

```bash
supabase link --project-ref "$SUPABASE_PROJECT_REF"
supabase db push --dry-run --include-all --include-seed
supabase db push --include-all --include-seed
```

After applying, set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

The review invitation screen also uses `NEXT_PUBLIC_APP_URL` to construct Auth
redirects. Configure Supabase Auth SMTP (or a verified provider) for delivered
invitations. Without SMTP, the admin screen produces a manual invite token; no
service-role credential is returned to the browser.

## Provisioning staging

The dedicated project was created in the requested organization after its
billing hold was resolved:

```bash
supabase projects create sigmawrite-staging \
  --org-id "$SUPABASE_ORG_ID" \
  --db-password "$SUPABASE_DB_PASSWORD" \
  --region eu-central-1
cp .env.staging.example .env.staging
```

The project ref is `pwztnrirtrnicywvdbpz`. Its database password, anon key, and
service-role key are stored in this development machine's macOS Keychain under
`sigmawrite-staging-project-db-password`,
`sigmawrite-staging-project-anon-key`, and
`sigmawrite-staging-project-service-role-key`; they are not stored in Git.

The project is linked locally and received migrations `0001–0017` in order plus
`seed.sql` through `supabase db push --include-all --include-seed`. The temporary
fallback branch `pfuqmieowknqpuhqxuyo` was deleted after the dedicated project
passed verification.

## Reproducible demo

The demo seed creates or updates the same organization, school, class, four
auth accounts, guardian/enrollment links, consent, interests, and relational
learning evidence on every run:

```bash
npm run seed:demo
```

By default the command reads `.env.staging`. Use a different ignored env file
only when intentional:

```bash
DEMO_ENV_FILE=.env.my-preview npm run seed:demo
```

The default demo password is `Demo-2026-Strong!`; set `DEMO_ACCOUNT_PASSWORD` in the
ignored env file to rotate it. The script does not print service keys or the
password.

## CI

`.github/workflows/ci.yml` has an application job (`npm ci` → typecheck → lint
→ tests) and an independent migration job. The latter starts a fresh local
Postgres with the pinned Supabase CLI, applies every migration in filename
order, then applies `seed.sql`. A migration that only works against an already
modified database therefore fails before merge.

## Notes

- RLS is enabled on every table from the first migration. The anon/auth client
  is always policy-constrained; the service-role key (server-only) bypasses RLS
  and must never reach the browser.
- A new auth user needs a matching `profiles` row (created during signup/consent
  flow). Until that row exists with a `role`, protected routes redirect to login.
- `content_reviewer` is intentionally narrower than general staff: RLS permits
  only the reviewer’s active assignment snapshots and their own review records.
  AI workflow, catalog, publication, resolution, and benchmark mutations require
  `platform_admin`.
