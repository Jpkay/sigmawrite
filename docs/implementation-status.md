# Implementation and launch status

> Living source of truth. Updated 2026-08-06. Historical roadmaps describe design intent and must not override current code, tests, or this status.

## Repository-implemented

- Relational learner evidence, consent gates, deletion/export workflows and audit history.
- Versioned French taxonomy, diagnostic-bank release machinery and graph-driven learning paths.
- Adaptive diagnostic, BKT/KST-style mastery, FSRS memory state, decay, FIRe propagation, daily session planning, Elo targeting and failure remediation.
- Controlled reading/writing loop, parent/teacher dashboards, weekly reports and class operations.
- AI generation contracts, safety/QA gates, provisional serving, psychometrics, sparse review and measured rollout controls.
- Human review portal, independent assignments, editorial resolution and exact-six benchmark governance.
- Security hardening migrations 0077+, PWA cache isolation, password recovery, job idempotency and dependency remediation.
- Browser smoke/accessibility checks plus full application and SQL CI gates.
- Flat per-word vocabulary review and persistent scaffold fading.
- Recoverable at-most-once reading/content boundaries, leased jobs, service-only audit writes and parent/student password rotation.
- Typed vocabulary recall, vocabulary-fit recommendations, lexical launch thresholds, corrective retests and strand-specific scaffolds.
- Pseudonymous explicit-only analytics, comprehensive guardian export, bilingual parent controls and authenticated pilot-browser CI.

## Repository verification commands

`npm run ci`, `npm run test:e2e`, `supabase test db`, `npm run launch:verify-env`, and `npm run launch:audit-content` are the release contract. Evidence counts should be taken from the latest command output, not copied into long-lived prose.

## External or human gates — not complete in source control

1. Apply every numbered migration to an isolated staging project and run the complete SQL suite there.
2. Configure and exercise PostHog, Sentry, Resend, Google adult OAuth, LanguageTool and protected Vercel environments with real credentials.
3. Have three real educators independently review the pilot diagnostic/content set; resolve and publish the required passages and lock exactly six benchmarks.
4. Run the friendly-family protocol without manual SQL, including password recovery, account switching, diagnostic, practice, reading, vocabulary, retrieval, weekly email, privacy/export/deletion, parent evidence and teacher export.
5. Obtain controller/legal approval for privacy terms, processor agreements, region/transfers, retention and school consent authority.
6. Close rehearsal P0/P1 findings, then promote `develop` to `main` through protected CI.

These gates cannot be honestly replaced by automated commits or QA identities.

## Next evidence-driven work

After pilot activation: grow licensed vocabulary/content coverage, calibrate the custom FSRS parameters and Elo ratings on real exposure data, act on psychometric anomalies through human review, and expand oral modalities only after the core loop demonstrates retention lift.
