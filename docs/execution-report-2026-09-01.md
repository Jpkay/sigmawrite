# Incoming-student production execution report — 2026-09-01

## Outcome

The repository now implements the intended invited-student contract:

1. A student validates a class invitation before creating an account.
2. Account provisioning creates the student and active enrollment; the
   enrollment records institutional authorization automatically.
3. The student proceeds immediately at every age. There is no `Accès en
   attente` branch for an invited pupil.
4. Onboarding commits profile, interests, learning goal and completion in one
   database transaction while preserving the class-owned grade.
5. Diagnostic evidence builds a jagged mastery profile. The generated learning
   path omits confidently mastered nodes, orders missing hard prerequisites
   before what they unlock, and retains unknown/independent-production work as
   verification rather than invented mastery.
6. The current v2 diagnostic may transition only to the exact approved v3
   taxonomy checksum, and every saved path step must be a v3 release member.
7. Daily planning interleaves due review and frontier learning within 28
   minutes. Frontier work is at least 25% of the displayed plan when available.
   A practice activity uses each approved item at most once and alternates
   response types when the reviewed bank permits it.

Students without an active institutional enrollment still fail closed unless
they have a separate active guardian authorization.

## Verified repository evidence

| Gate | Result |
| --- | --- |
| TypeScript, ESLint | Pass |
| Vitest | 107 files, 607 tests, all pass |
| Fresh-schema pgTAP contracts | 61 files, 725 assertions, all pass |
| Public Playwright/axe suite | 18 tests, all pass |
| Seeded incoming-student journey | Pass: under-15 signup, immediate access, grade preservation, transactional persistence, sign-out and second-account isolation |
| Production Next 16 Webpack build | Pass; 69 static pages generated and all dynamic routes compiled |
| Dependency audit | 0 vulnerabilities reported |
| Taxonomy integrity | Frozen v1/v2 and reproducible v3 checks pass at their approved checksums |
| Learning benchmark | 19/19 expected outcomes; release decision `allow` |
| Diagnostic review sync/audit | Complete 696-item draft: 198 human-approved, 33 reproducibly computed and 465 pending; zero rejected/missing slots and zero structural issues; publication remains correctly blocked on human review |
| Linked staging schema/graph | Migrations `0001`–`0106` are in parity; live completed-run and legacy graph smoke cases pass with zero unknown prerequisites |

The incoming-student E2E is opt-in to prevent accidental writes to a shared
backend. CI now enables it against its isolated local Supabase project. The
Playwright-managed Next server uses Webpack to keep test cache growth bounded.

## General-availability content gates that code must not fabricate

The read-only hosted content audit remains fail-closed:

- 3 of 60 required human-approved passages;
- 0 of 60 required published editorial review versions;
- 33 of 180 required independent review assignments;
- 0 of exactly 6 locked benchmarks;
- no published validated diagnostic item-bank release.

The diagnostic review state is no longer hypothetical. Three accountable
reviewers own the original staging queues; 214 decisions have been submitted.
Eight rejected slots were replaced locally with new identities and wording that
incorporates the submitted educator notes. The replacements were imported into
the staging draft as `needs_human_review`; no approval provenance was
synthesized and no curriculum material was sent to an external model. The
canonical bank now contains 198 human approvals, 33 reproducibly computed
approvals and 465 pending items, with all 696 required slots present.

The earlier audit's 30 “duplicate” findings were false positives: generic MCQ
stems such as “Quel mot est correctement orthographié ?” had different visible
answer sets. The validator and migration `0106` now compare the complete,
order-insensitive learner-visible MCQ surface, while open-response prompts
remain strictly unique. Choice inserts, edits and deletions are guarded too.
The audit is now structurally ready with no hard, slot or projected issue.
`npm run diagnostic:verify:v2` must continue to fail until the 465 pending items
receive attributable human approval.

The staging database is current through `0106`. Migration `0104` adds the
previously missing guarded allocator behind `/admin/items/review`: it assigns
every unowned pending diagnostic item exactly once across selected active
reviewers, orders personal queues by section, sends aggregate notifications and
records the operation in the audit log. The eight new replacement candidates
are deliberately unassigned until an administrator selects their accountable
reviewers. This does not block application deployment: the reviewers continue
in production while the ordinary student runtime remains closed to unpublished
content.

Migration `0107` adds a separate, auditable feedback-participant classification
to the existing isolated diagnostic pilot. `/admin/users` can now create the
managed student, active class enrollment, temporary credentials and expiring
pilot enrollment in one operation after recording whether the student (15+) or
their responsible adult agreed. The production deploy installs the draft pilot
assets only when absent, verifies structural readiness, enables the pilot kill
switch and still keeps every result provisional. Revocation stops pilot access
without removing normal class access.

Before general school availability:

1. allocate the eight newly imported replacements, finish all 465 pending
   reviews, synchronize again, then approve and publish the exact v2 bank
   checksum and approved v3 learning taxonomy in staging;
2. finish the 60-passage/three-reviewer corpus and lock six benchmarks;
3. deploy the application build paired with migrations through `0107`, then
   rerun hosted SQL/RLS plus browser suites against that exact
   release candidate;
4. configure and prove the protected service/authentication environment;
5. complete the friendly-family rehearsal, legal/controller approval and
   canary/rollback sign-off.

The deployment workflow reports `launch:audit-content` in both environments so
unfinished review tooling and the isolated feedback cohort can ship. It does
not publish unfinished content or let provisional results unlock ordinary
learning. These human gates therefore cannot be bypassed by a green application
build; they are completed in parallel before general availability.
