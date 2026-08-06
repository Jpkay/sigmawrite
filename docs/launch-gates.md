# Launch gates

Application engineering is complete through Sprint 20. The items below require
a human decision, a protected third-party credential, or real pilot participants;
automation must not pretend to satisfy them.

## Human content sign-off

1. In `/admin/reviews/reviewers`, invite the two real educators. The principal
   admin account is prepared as the first reviewer. Staging QA identities exist
   only for technical smoke tests and do not satisfy this gate.
2. In `/admin/reviews/assign`, assign the 60 pilot passages to all three reviewers.
3. Each reviewer acknowledges `/review/instructions` and submits an independent
   rubric through `/review`; do not share ratings before submission.
4. Resolve completed passages in `/admin/reviews`, publish at least 60 passages,
   then select exactly six diverse passages in `/admin/benchmarks` and lock them.

Do not bulk-promote `needs_human_review` rows in SQL. The review trail is a
product requirement, not clerical metadata.

## Protected service configuration

Configure these separately in staging and production, then run the checks in
the linked documents:

- PostHog client/server keys and host — verify the funnel in
  [`observability.md`](./observability.md).
- Sentry DSN/auth token/release — trigger one controlled client and server error.
- Resend API key plus a verified sender — send the weekly report to the friendly
  family and confirm the immutable report link opens.
- Supabase Google provider credentials and redirect allow-list — verify adult
  OAuth and magic-link login; confirm a student cannot use the adult callback.
- Vercel tokens/project ids for both GitHub environments — exercise the
  documented staging deployment, smoke test, and protected production promote.

## Human rehearsal

With a friendly-user teacher, parent and student family, execute the four-week
protocol in [`pilot/four-week-protocol.md`](./pilot/four-week-protocol.md).
Production rehearsal must cover class creation, join/consent, diagnostic, three
days of practice/reading/retrieval, weekly email, parent evidence and teacher
export without manual SQL. Log P0/P1 findings and close them before a school is
invited.

## Required hosted authentication controls

In both staging and production, configure Supabase Auth itself—not merely the browser UX—with email confirmation, a 12-character password minimum, leaked-password protection where available, native password/OTP rate limits, CAPTCHA/Turnstile on public signup and recovery, and an exact redirect allow-list. Direct Auth endpoints remain public by design, so the application `consume_auth_attempt` helper is only defense-in-depth and must never be described as the security boundary. Exercise parallel failures and recovery before promotion.

## Repository evidence (not hosted proof)

The application, SQL contracts, browser projects and launch-verification commands are committed and run in CI. Current command evidence belongs in [`execution-report-2026-08-06.md`](./execution-report-2026-08-06.md); do not preserve mutable test/content counts here. The fail-closed content audit is `npm run launch:audit-content` and requires at least 60 governed passages, 180 submitted assignments, exactly six benchmarks, a published diagnostic/taxonomy release, and a licensed lexical release with at least 2,000 lemmas and 95% held-out coverage.

Historical hosted smoke observations and QA identities are not present-tense production evidence. Re-run migration, RLS, load, deletion, mobile/offline, reviewer-isolation and telemetry checks against the exact release candidate and attach their outputs to the protected promotion record.
