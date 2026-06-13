# Supabase

Database is the source of truth (PRD §13). This directory holds the schema as
plain SQL migrations so it stays version-controlled and portable — no live
project is required to develop the rest of the app.

## Files

- `migrations/0001_init.sql` — full schema (PRD §21) + `pgvector`.
- `migrations/0002_rls.sql` — Row Level Security policies + helper functions (PRD §14).
- `seed.sql` — reference data: knowledge domains, foundation skills, starter concepts.

## Applying

**Option A — Supabase CLI (recommended for local dev):**

```bash
supabase init          # once, if not already initialised
supabase start         # local Postgres + Studio
supabase db reset      # applies migrations/*.sql then seed.sql
```

**Option B — remote project:**

Run the migration files in order against your project (SQL editor or
`supabase db push`), then run `seed.sql`.

After applying, set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

## Notes

- RLS is enabled on every table from the first migration. The anon/auth client
  is always policy-constrained; the service-role key (server-only) bypasses RLS
  and must never reach the browser.
- A new auth user needs a matching `profiles` row (created during signup/consent
  flow). Until that row exists with a `role`, protected routes redirect to login.
