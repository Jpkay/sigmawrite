# Self-service school onboarding and teacher supervision

Goal started 2026-09-13. This ledger concerns onboarding and access, not curriculum
completion or educational calibration. The onboarding release is now public;
full multi-account browser acceptance remains incomplete (latest checkpoint below).

## Acceptance ledger

| Requirement | Required proof | Current state |
| --- | --- | --- |
| School and class setup | Platform admin creates a school and appoints its admin; school admin manages only that school and creates/edits classes through the UI | Public UI school and two-class creation passed; scoped admin appointment and school-admin journey pending |
| Student onboarding and recovery | Valid invitation joins the right class; invalid/expired/revoked invitations fail; login, resume and recovery verified without changing real credentials | Implemented; focused action and native invitation checks passed; hosted login/recovery pending |
| Many-to-many teacher assignments | Two teachers, two classes and at least three students; shared class and direct-student assignments work; separate grants remain distinguishable | Implemented; synthetic database assertions passed; hosted UI pending |
| Teacher reports | Assigned teacher sees diagnostic results, per-skill evidence, activity and progress; direct assignment works without granting an entire class | Current granular diagnostic/activity DTO implemented; authorization/privacy tests passed; hosted report pending |
| Access boundaries and revocation | Cross-school grants, self-grants and direct table-write bypass denied; removing last assignment and deactivation revoke access | Native and hosted rollback SQL assertions passed; browser multi-account denial/revocation pending |
| Verified delivery | Reviewed diff; relevant/integration tests, types, lint, build; forward migration preflight; candidate and public end-to-end verification; commit/push/deploy | Public cutover completed; checks/commits/push passed; full authenticated multi-account end-to-end pending |

## Execution ownership

- GPT-5.6 SOL High / school setup: school CRUD, scoped class management, navigation, focused SQL/action tests.
- GPT-5.6 SOL High / teacher supervision: assignment UI/actions, scoped reporting and focused tests.
- GPT-5.6 SOL High / onboarding: invitation roles, joining and recovery UX, focused tests.
- Coordinator: cross-school database boundaries, integration, database verification,
  technical QA fixture, deployed end-to-end checks and release evidence.

Each agent has a disjoint write scope. No agent may change live account assignments,
send real invitations, rotate real passwords or deploy independently.

## Verified checkpoints

- Baseline: source and documentation committed through `662775d`; existing production
  remains `dpl_G6zc25UMJwHzMixpNi4KAWEsqApc` (application source `8488125`).
- `sh scripts/testing/school-onboarding-db.sh`: 163 migrations applied to disposable
  PostgreSQL. Synthetic many-to-many class/direct grants, duplicate-grant idempotency,
  last-grant revocation, cross-school denial, teacher self-grant denial, deactivation
  and missing-identity denial passed. No remote database mutation performed.
- New permission migration: `20260914101000_teacher_assignment_boundaries.sql`.
  Existing records are preserved; writes use explicit authorization and reads
  re-evaluate the caller's current role and scope.
- Combined integration checkpoint: all **165 migrations** apply to disposable
  PostgreSQL; school creation/management, teacher assignment/revocation and
  invitation rotation/expiry/role-boundary assertions all pass.
- Application checkpoint: **477 test files / 2,007 tests passed**; typecheck
  passed; lint passed with zero errors and 11 pre-existing warnings outside this
  workstream. Final follow-up access/UI fixes require their own rerun.
- Remote `--check` passed for the three explicit onboarding migrations. No
  ambiguous assignments or duplicate unrevoked class codes were found. The check
  rolled back; no remote migration has been applied at this checkpoint.
- Owner Chrome Plume tab remains at login. An administrator-authenticated UI
  journey is still required; unit/database tests do not prove that journey.
- Final frozen application checkpoint (`e1ec056`): **479 files / 2,020 tests
  passed**, typecheck passed, lint has zero errors / the same 11 existing
  warnings, and the dependency audit reports zero vulnerabilities.
- Password recovery now independently verifies Turnstile before account lookup
  or mail handling when the server secret is configured. Missing/failed token
  and explicit Supabase-delegation cases are tested.
- Invitation SQL acceptance includes actual synthetic student signup,
  enrollment and consent, exactly one consumed use, revoked/expired/full-code
  rejection without a retained profile, and a teacher code reused by two teachers.
- Legacy null-home records spanning multiple schools fail closed. Explicit home
  schools override stale enrollment/class links. Native regression checks and
  the expanded remote read-only preflight passed; no historical rows were changed.
- `node --import tsx scripts/verify-school-onboarding-hosted.mts --check` executes
  the exact composed, rollback-only hosted verifier in disposable PostgreSQL:
  **3 suites passed**, synthetic migration ledger checked, no fixture residue.
  It has **not** been executed against the public-pilot database.
- School management/invitations (`8d90544`), recovery and legacy boundaries
  (`1c23e8a`), and teacher supervision (`e1ec056`) are committed and pushed.

## Candidate release — 2026-09-13

- Frozen application source: `e1ec056`. Subsequent commits contain the QA helper
  and evidence documentation, not additional application changes.
- Vercel candidate: `dpl_DA6zpXShDiYKoCPyJUfwFgv84wmV`, status **Ready** after
  the Production-environment build with R43 retained. URL:
  <https://sigmawrite-k14sf4xg1-jpkays-projects.vercel.app>.
- Candidate unauthenticated HTTP checks: `/login`, `/join`, `/signup` and
  `/reset-password` returned 200; `/admin/schools`, `/admin/users` and `/teacher`
  returned 307 to login with their intended next route. No server-error pages.
  The deployment-protection bypass was used only for these technical requests;
  application authentication and Turnstile were not bypassed.
- **Not promoted.** `sigmawrite.vercel.app` still resolves to previous public
  deployment `dpl_G6zc25UMJwHzMixpNi4KAWEsqApc`. No onboarding migrations have been
  applied to the public-pilot database. The candidate is not ready for real
  onboarding until its matching migrations and authenticated checks are completed.
- Remaining owner input: sign into Plume in Chrome with the platform-administrator
  account. The observed Plume tab is still at login. Do not reset the owner's
  credentials, create a substitute privileged account, or alter real school
  membership to work around this missing session.
- Remaining verification: coordinated database/application cutover; rollback-only
  hosted SQL checks; actual UI school and class creation, administrator appointment,
  two teachers/two classes/three synthetic students, shared/direct access and
  revocation, real-widget login, invitation join, recovery and student resume.
  Local SQL fixtures and anonymous HTTP checks do not satisfy those UI requirements.

## Resumed verification — 2026-09-13

This checkpoint supersedes the earlier missing-sign-in notes above.

- The owner's `/admin` dashboard rendered with the Platform Admin role. The
  administrator sign-in blocker is cleared; do not reset credentials or create
  a substitute privileged account. The separate review-page failure is not a
  failed sign-in.
- A read-only review query under that account's authenticated database context
  exceeded the live eight-second statement timeout (`57014`, context
  `app_role` / `is_staff`). Privileged REST and shape checks passed. A SOL High
  worker is preparing a semantics-preserving policy performance fix, without
  increasing the timeout or bypassing permissions.
- The existing candidate remains Ready. The migration preflight passed again.
- Added `--candidate-preflight=pwztnrirtrnicywvdbpz` to the hosted verifier:
  only the three named migrations and ledger entries are applied inside the
  assertion transaction, then all changes roll back. Local `--check` now tests
  installed and pending schema modes: **6 SQL suites passed**, including schema,
  ledger and fixture rollback. TypeScript and `git diff --check` passed.
- The candidate preflight passed on the **public-pilot database**: all **3 SQL
  suites passed**. A separate read confirmed zero retained onboarding ledger
  entries, zero synthetic auth accounts, and no retained school-creation RPC.
  No real accounts or memberships were changed.
- Chrome inspection subsequently timed out through supported accessibility and
  DOM interfaces. This does not mean the owner must sign in again; authenticated
  UI acceptance remains unproven.
- No public application promotion or permanent onboarding migration occurred
  at this checkpoint. The coordinated cutover gate remains required.

## Review-query SQL hotfix deployed — 2026-09-13

- `56834e5` adds `20260914103000_review_rls_initplans.sql`: eight existing
  review-path policies evaluate their stable staff-role check through InitPlans.
  Commands, role targets, approval predicates and write checks are preserved.
- SOL High's focused regression covers **17 assertions**, including active and
  deactivated administrators, student/reviewer/anonymous denials, authenticated
  approved-content reads, denied writes and a 2,000-item review count.
- The integrated native PostgreSQL 18 runner passed **all 166 migrations** plus
  school, teacher, invitation and review-performance/authorization suites.
  TypeScript and whitespace checks passed; implementation is committed and pushed.
- `apply-review-rls-migration.mts --check <existing-admin-email>` passed on the
  linked public-pilot project. The helper rejects target/policy drift and an
  existing ledger entry, tests the authenticated query under the unchanged
  eight-second limit, and checks missing-identity denial before committing.
- The exact targeted `--apply` passed. A separate read verified **one** recorded
  hotfix migration and **eight** optimized policies. The previously timing-out
  query ran in **270.857 ms** after deployment (rollback trial: 947.464 ms).
- This is a **database-only release**. The public Vercel application is still
  `dpl_G6zc25UMJwHzMixpNi4KAWEsqApc`; zero onboarding migrations are retained.
  A browser revisit must still establish whether the entire review page now
  renders. Full onboarding cutover and authenticated UI acceptance remain open.
- Verification/rehearsal work is in `a23f581`; the public SQL fix is in `56834e5`.
  Only the rebuildable `.next/cache` was removed to recover local disk space;
  source files and existing test artifacts were preserved.

## Public onboarding cutover and initial UI acceptance — 2026-09-13

This checkpoint supersedes the earlier unpromoted/missing-browser notes.

- A fresh Chrome tab restored browser inspection. `/admin/items/review` now
  renders the review queue for the owner: **review-page hotfix verified in UI**.
- Re-inspected the Ready candidate and reran the three-migration preflight.
  Applied exactly `20260914100000`, `20260914101000`, `20260914102000`, then
  immediately promoted `dpl_DA6zpXShDiYKoCPyJUfwFgv84wmV`. The public alias
  `https://sigmawrite.vercel.app` now resolves to that candidate (source `e1ec056`).
- Hosted `--confirm-public-pilot=pwztnrirtrnicywvdbpz` passed all **3 rollback-only
  SQL suites** against the installed release. A separate read confirmed all
  three permanent onboarding ledger entries. The review RLS hotfix remains applied.
- Public `/login`, `/join`, `/signup`, `/reset-password` returned 200;
  unauthenticated `/admin/schools` and `/teacher` returned 307 to their login route.
- Through the **public browser UI**, created organisation
  `Plume QA — onboarding 2026-09-13`, school `QA Onboarding — 2026-09-13`
  (`8f9da60a-ed0e-47f4-9050-4cda2448a2dc`), and two classes:
  `QA Classe A` (`a69840cd-7bf3-4f77-b783-17c794136fd8`) and
  `QA Classe B` (`91c58c61-9d20-4394-9dea-bad371bb9f6b`). UI success messages,
  class counts, and a separate database read confirmed persistence.
- Opened the school-specific administrator-appointment form. Prepared a clearly
  synthetic administrator identity but **did not submit credential creation**.
  Requested action-time approval for one QA school administrator, two teachers,
  three students and school-confined assignment tests, plus the proposed owner
  QA email destination. No new account or access grant has been created yet.
- The school and classes contain only synthetic QA data. No existing school,
  real membership, credential or invitation was modified.
- Remaining acceptance: administrator appointment; school-admin management;
  teacher/student invitation and login; shared/direct visibility with actual
  diagnostic/activity reports; recovery/resume; revocation and foreign-school
  denials in the browser. Successful SQL fixtures do not substitute for these.

## UI follow-up and current public build — 2026-09-13

- Edited the synthetic second class through the public UI to
  `QA Classe B — vérifiée`. The UI returned `Enregistré`; an independent database
  read of class `91c58c61-9d20-4394-9dea-bad371bb9f6b` confirmed the name persisted.
- A bounded SOL High follow-up corrected obsolete teacher-signup guidance: an
  invalid school code is rejected, not converted into a parent signup. The text
  now explains the valid-code requirement and administrator-managed alternative.
- Code/test commit `4a82211` is pushed. **5 focused tests passed**, focused lint,
  TypeScript and whitespace checks passed. Vercel built the candidate Ready;
  candidate login returned 200 and protected management routes redirected to login.
- Promoted **`dpl_5FNA2ipXcihhmAiTc4NGcwPPR4fA`**, source **`4a82211`**.
  Current public app: <https://sigmawrite.vercel.app>.
  Immutable deployment: <https://sigmawrite-gkrvisnaf-jpkays-projects.vercel.app>.
  A fresh authenticated public `/admin/users` page displays the corrected text.
  No further database migration was required for this copy-only build.
- QA-account approval has not yet been received. The current-build scoped
  administrator form is left prepared with the synthetic name/username and no
  email entered. No account creation or permission-grant submission occurred.
  Browser connectivity is restored; the remaining input is approval for the
  six QA accounts, their school-scoped assignment tests and QA email destination.

## Release gates

1. Integrate the three agent slices; review all service-role paths and RPC checks.
2. Exercise the complete journey on isolated technical QA data, including revoked
   grants, multiple teachers, direct-only students and a foreign school.
3. Build the candidate before the database cutover. The invitation migration
   removes direct client writes used by the old app: do not leave that migration
   applied while the previous app remains the public release.
4. Apply only reviewed forward migrations after exact linked-project/schema
   preflight in a coordinated cutover; verify the candidate, promote and repeat
   public checks. Database rollback must be considered separately from app rollback.
5. Record actual evidence here. Technical users are not real-student observations.

Real school membership changes, real invitations and credential recovery remain
under the owner's control. Synthetic QA account bootstrapping does not count as
proof of the product's school/class/student creation UI.
