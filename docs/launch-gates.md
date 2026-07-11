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

## Automated evidence already complete

- Staging migrations through `0035` applied; a fresh local database plus the
  committed item-bank seed reproduces all 488 approved items.
- Two slices: 61 nodes, at least eight approved items per node after the final
  coverage fill; Gate-1 tests pass.
- Real GLM generation, scoring, moderation, tagging and embeddings exercised.
- The live pilot review queue contains exactly the 60 planned combinations
  across 10 interests and three bands; the earlier hosted QA smoke candidate
  and its linked revision are retained separately as `retired`.
- Diagnostic next-item database operation measured at 0.25–0.52 seconds on
  warm end-to-end staging requests from the test machine.
- 50 concurrent load sanity after the final RLS migrations: p50 0.995 s, p95
  1.132 s, maximum 1.142 s; RLS scope
  intact.
- Mobile 360 px reading loop has no horizontal overflow; reload restores the
  question and saved answer; offline queue drains on reconnect.
- Lighthouse accessibility: 95 on reading and results.
- Due throwaway deletion request removes Auth, profile/student and related graph,
  and retains a completed request with a null student link.
- Dependency audit: zero known vulnerabilities; no server credential found in
  client modules.
- The assignment-based review portal, independent draft/submission workflow,
  admin resolution, CSV export, and exact-six benchmark governance are implemented;
  actual educator ratings remain a human launch action.
- Hosted staging proved three isolated reviewer sessions, 180 temporary pilot
  assignments (60 per reviewer), draft restore, immutable submissions, a
  high-disagreement admin comparison, audited resolution, and version-preserving
  revision. Temporary pilot assignments were cleaned before any submission.
- The review database suite passes 34 assertions; the application suite passes
  204 tests, production build, typecheck, lint, and a zero-vulnerability audit.
