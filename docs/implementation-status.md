# Implementation and launch status

> Living source of truth. Updated 2026-09-01. Historical roadmaps describe design intent and must not override current code, tests, or this status.

## Repository-implemented

- Relational learner evidence, invitation/guardian authorization gates, deletion/export workflows and audit history. A valid class invitation authorizes access immediately at every age; an uninvited student still fails closed.
- Transactional student onboarding with class-owned grade preservation, explicit CEFR targets and account-scoped browser state.
- Versioned French taxonomy, diagnostic-bank release machinery and graph-driven learning paths.
- Checksum-bound v2 diagnostic → v3 learning-path transitions; path steps must belong to the destination release.
- Adaptive diagnostic, BKT/KST-style mastery, FSRS memory state, decay, FIRe propagation, daily session planning, Elo targeting and failure remediation.
- Duration-bounded sessions with unique reviewed items, response-type interleaving and a minimum 25% new-learning share when frontier work exists.
- Controlled reading/writing loop, parent/teacher dashboards, weekly reports and class operations.
- AI generation contracts, safety/QA gates, provisional serving, psychometrics, sparse review and measured rollout controls.
- Human review portal, guarded/balanced diagnostic-item allocation, independent passage assignments, editorial resolution and exact-six benchmark governance.
- Security hardening migrations 0077+, PWA cache isolation, password recovery, job idempotency and dependency remediation.
- Browser smoke/accessibility checks plus a seeded under-15 invitation → onboarding → account-switch isolation journey and full application/SQL CI gates.
- Auditable feedback-participant provisioning: an administrator can create a managed student, record student/guardian agreement and grant an expiring isolated diagnostic pilot in one operation; withdrawal does not remove normal class access.
- Flat per-word vocabulary review and persistent scaffold fading.
- Recoverable at-most-once reading/content boundaries, leased jobs, service-only audit writes and parent/student password rotation.
- Typed vocabulary recall, vocabulary-fit recommendations, lexical launch thresholds, corrective retests and strand-specific scaffolds.
- Pseudonymous explicit-only analytics, comprehensive guardian export, bilingual parent controls and authenticated pilot-browser CI.

## Repository verification commands

`npm run ci`, `npm run test:e2e`, `supabase test db`, `npm run launch:verify-env`, and `npm run launch:audit-content` are the release contract. Evidence counts should be taken from the latest command output, not copied into long-lived prose.

## External or human gates — not complete in source control

1. Migrations through `0106` and the graph smoke check are applied/passing in isolated staging. Migration `0107` adds feedback-participant agreement provenance and must be promoted with the matching application build, then exercised through the hosted admin and student journeys.
2. Configure and exercise PostHog, Sentry, Resend, Google adult OAuth, LanguageTool and protected Vercel environments with real credentials.
3. Allocate and review the 8 imported replacement candidates, complete all 465 pending diagnostic reviews, then publish the exact approved checksum. The bank has all 696 slots and no structural issue; generic MCQ stems are compared with their complete visible choices by migration `0106`. Have three real educators independently review the pilot passage set; resolve and publish the required passages and lock exactly six benchmarks.
4. Run the friendly-family protocol without manual SQL, including class invitation, immediate under-15 access, password recovery, account switching, diagnostic, practice, reading, vocabulary, retrieval, weekly email, privacy/export/deletion, parent evidence and teacher export.
5. Obtain controller/legal approval for privacy terms, processor agreements, region/transfers, retention and the institution's authority to invite and supervise pupils. Guardian authorization remains the fallback for students without an active institutional invitation.
6. Close rehearsal P0/P1 findings before general school availability. They do not block deploying the application and its explicitly isolated feedback cohort to production.

These gates cannot be honestly replaced by automated commits or QA identities, and remain publication/general-availability gates rather than application-deployment gates.

## Next evidence-driven work

After pilot activation: grow licensed vocabulary/content coverage, calibrate the custom FSRS parameters and Elo ratings on real exposure data, act on psychometric anomalies through human review, and expand oral modalities only after the core loop demonstrates retention lift.
