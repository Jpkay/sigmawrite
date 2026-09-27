# Marketing, schools, and admin cleanup

## 2026-09-13 — implementation handoff

- Status: implementation is ready for coordinator integration. No commit, push,
  deployment, or live database mutation was performed in this workstream.
- Acceptance covered: the homepage and schools marketing routes render from a
  complete local import/asset graph; the school inquiry boundary rejects invalid,
  duplicate, non-text, and out-of-range values; optional Turnstile protection
  fails closed when only one key is configured or verification fails; school and
  audit reads require a platform-admin session in the data-access layer; the
  `/admin/schools` page also performs its own platform-admin check; database read
  failures are surfaced instead of appearing as empty data; every exported admin
  mutation in `src/lib/actions/admin.ts` was confirmed to call
  `requireRole(["platform_admin"])`.
- Next.js 16 compatibility: the homepage hero uses the supported `preload` image
  prop instead of deprecated `priority`. The fill image has a positioned parent,
  responsive `sizes`, a present 1600×1067 JPEG asset, and alt text matching the
  pictured formula-covered chalkboard.
- Existing visual direction was preserved. Local browser smoke checks rendered
  the French homepage and schools page with their navigation, hero, CTA, content,
  and inquiry form present; no form was submitted.

## Workstream paths

- `src/app/page.tsx`
- `src/app/schools/actions.ts`
- `src/app/schools/page.tsx`
- `src/app/schools/schools-marketing-page.tsx`
- `src/app/schools/schools.module.css`
- `src/components/kinetic-marketing-home.tsx`
- `src/components/kinetic-marketing-home.module.css`
- `public/plume-student-voices.jpg`
- `src/app/admin/page.tsx`
- `src/app/admin/schools/page.tsx`
- `src/components/dashboard-shell.tsx`
- `src/lib/actions/admin.ts`
- `src/lib/db/admin.ts`
- `supabase/migrations/0102_school_inquiries.sql`
- `supabase/migrations/20260913110000_tighten_school_inquiries.sql`
- `supabase/tests/20260913110000_tighten_school_inquiries_test.sql`
- `docs/diagnostic/workstreams/marketing-cleanup.md`

The focused cleanup itself changed the inquiry action, homepage image component,
admin schools page, dashboard-shell prop contract, admin data-access module, and
the forward school-inquiry hardening migration. The already-applied `0102` file
was restored to its exact pre-review text captured at workstream intake. No Git
ref contains that untracked historical file, so the intake capture is the local
source of truth. The other paths above contain the pre-existing workstream
implementation that was inspected and verified as one integration unit.

## Exact migration dependency

The live migration ledger already contains `0102_school_inquiries.sql`; it must
remain immutable applied history. The new forward-only migration is
`supabase/migrations/20260913110000_tighten_school_inquiries.sql`. It depends on
the `public.school_inquiries` table created by `0102`, not on any unapplied schema.
It adds and validates six named checks for organization, country, contact, e-mail,
and message bounds, grants service-role inserts explicitly, and revokes all direct
table privileges from `anon`.

A service-role, select-only live preflight read all constraint-relevant columns
without logging row contents: `rowCount=0`, with zero violations in every check
category. No live write was made. Main can therefore apply the timestamp migration
after running the focused pgTAP test in its fresh schema. If Turnstile is enabled,
both
`NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` must be configured;
a partial configuration intentionally rejects submissions.

## Verification

- `npx eslint src/app/page.tsx src/app/schools/page.tsx src/app/schools/actions.ts src/app/schools/schools-marketing-page.tsx src/components/kinetic-marketing-home.tsx src/app/admin/page.tsx src/app/admin/schools/page.tsx src/components/dashboard-shell.tsx src/lib/actions/admin.ts src/lib/db/admin.ts` — passed.
- `npm run typecheck` — passed after the owned dashboard-shell contract was made
  compatible with its existing null-child render test.
- `npx vitest run src/components/student-interface-copy.test.ts` — 1 file and 1
  test passed; Vite emitted its existing future native-config-loader warning.
- Non-mutating direct inquiry-action probe with a test-only partial Turnstile
  configuration — empty form: `error`; duplicate field: `error`; populated
  honeypot: synthetic `success`; partial captcha configuration: fail-closed
  `error`. The probe returned before any database or e-mail path.
- `npm run build` — passed with Next.js 16.3.4; 80 static pages generated, `/`
  and `/schools` emitted as static routes, and `/admin` plus `/admin/schools`
  emitted as dynamic routes.
- Live data preflight — read-only query passed: 0 rows and 0 legacy constraint
  violations; no values or credentials were printed.
- `sqlfluff parse --dialect postgres supabase/migrations/20260913110000_tighten_school_inquiries.sql` — passed.
- `sqlfluff parse --dialect postgres supabase/tests/20260913110000_tighten_school_inquiries_test.sql` — passed.
- `supabase test db` focused execution could not run on this workstation because
  the local Docker daemon is unavailable. The focused test contains 11 assertions
  and rolls back its fixture transaction.
- `git diff --check` on the owned paths — passed.

## Remaining gates

There is no known source-code blocker in this workstream. Coordinator-owned gates
remain: run the focused pgTAP test, review and integrate the shared dirty tree,
apply `20260913110000_tighten_school_inquiries.sql`, provide the intended production
e-mail/captcha configuration, deploy, and run public submission plus authenticated
platform-admin verification. A real inquiry was not submitted locally because
that would be an external mutation.
