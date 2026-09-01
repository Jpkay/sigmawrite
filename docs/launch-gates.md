# Launch gates

Application engineering is complete through Sprint 20. The items below require
a human decision, a protected third-party credential, or real pilot participants;
automation must not pretend to satisfy them.

## Human content sign-off for general availability

1. In `/admin/items/review`, select active real educators and use **Attribuer les
   exercices restants** so every diagnostic item has one accountable owner.
   Review the queue, synchronize decisions into the canonical artifact, replace
   replacement candidates, resolve audit findings, and require
   `npm run diagnostic:verify:v2` to pass before publishing the bank. Never
   bulk-promote generated candidates.
2. In `/admin/reviews/reviewers`, invite the two real educators. The principal
   admin account is prepared as the first reviewer. Staging QA identities exist
   only for technical smoke tests and do not satisfy this gate.
3. In `/admin/reviews/assign`, assign the 60 pilot passages to all three reviewers.
4. Each reviewer acknowledges `/review/instructions` and submits an independent
   rubric through `/review`; do not share ratings before submission.
5. Resolve completed passages in `/admin/reviews`, publish at least 60 passages,
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
Production rehearsal must cover class creation, invitation validation, immediate
access for a pupil under 15, diagnostic, three
days of practice/reading/retrieval, weekly email, parent evidence and teacher
export without manual SQL. Log P0/P1 findings and close them before a school is
invited.

## Incoming-student acceptance

- A valid class code can be checked anonymously before signup.
- Creating the account atomically creates the student, active enrollment and
  institutional authorization trail; age never adds a second waiting screen.
- The class grade is authoritative during onboarding.
- Removing the final active enrollment withdraws institutional access unless a
  separate active guardian authorization exists.
- Sign-out clears account-scoped client state before another learner signs in.
- The CI browser job must run `E2E_INCOMING_STUDENT=true`; a skipped journey is
  not release evidence.

## Required hosted authentication controls

In both staging and production, configure Supabase Auth itself—not merely the browser UX—with email confirmation, a 12-character password minimum, leaked-password protection where available, native password/OTP rate limits, CAPTCHA/Turnstile on public signup and recovery, and an exact redirect allow-list. Direct Auth endpoints remain public by design, so the application `consume_auth_attempt` helper is only defense-in-depth and must never be described as the security boundary. Exercise parallel failures and recovery before promotion.

## Repository evidence (not hosted proof)

The application, SQL contracts, browser projects and launch-verification commands are committed and run in CI. Current command evidence belongs in [`execution-report-2026-09-01.md`](./execution-report-2026-09-01.md); do not preserve mutable test/content counts here. The content audit is `npm run launch:audit-content` and requires at least 60 governed passages, 180 submitted assignments, exactly six benchmarks, a published diagnostic/taxonomy release, and a licensed lexical release with at least 2,000 lemmas and 95% held-out coverage. Both staging and production report this audit without blocking application deployment so administration and reviewer work can continue. The ordinary student runtime still fails closed on unpublished content. Only explicitly enrolled, expiring feedback participants may use the isolated provisional diagnostic; their results cannot unlock the normal learning path.

Historical hosted smoke observations and QA identities are not present-tense production evidence. Re-run migration, RLS, load, deletion, mobile/offline, reviewer-isolation and telemetry checks against the exact release candidate and attach their outputs to the protected promotion record.
