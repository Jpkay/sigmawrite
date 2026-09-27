# Self-service school onboarding and teacher supervision

Goal started 2026-09-13. This ledger concerns onboarding and access, not curriculum
completion or educational calibration. The onboarding release is now public;
full multi-account browser acceptance remains incomplete (latest checkpoint below).

## Acceptance ledger

| Requirement | Required proof | Current state |
| --- | --- | --- |
| School and class setup | Platform admin creates a school and appoints its admin; school admin manages only that school and creates/edits classes through the UI | Public UI school creation/admin appointment and school-admin-scoped account management/class creation/edit passed; QA school now has three classes, one empty |
| Student onboarding and recovery | Valid invitation joins the right class; invalid/expired/revoked invitations fail; login, resume and recovery verified without changing real credentials | Admin login/password setup and public invitation validation/rotation passed; isolation-student signup, login and onboarding passed; Student C diagnostic/reading and recovery remain pending |
| Many-to-many teacher assignments | Two teachers, two classes and at least three students; shared class and direct-student assignments work; separate grants remain distinguishable | Both teachers' public browser views passed: shared class A, Teacher A across A/B, and both teachers' direct Student C access |
| Teacher reports | Assigned teacher sees diagnostic results, per-skill evidence, activity and progress; direct assignment works without granting an entire class | Both teachers open Student C's granular/activity report; direct-only access excludes the full class; school admin sees five provisional answers and per-skill evidence; completed reading and populated teacher activity/weekly metrics pending |
| Access boundaries and revocation | Cross-school grants, self-grants and direct table-write bypass denied; removing last assignment and deactivation revoke access | Native/hosted SQL passed; public browser last-grant denial/roster removal, Teacher B session revocation on deactivation, and foreign-school denial passed |
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

## Approved QA accounts and authenticated acceptance — 2026-09-14

This checkpoint supersedes the earlier pending-account-approval notes.

- Owner approved six synthetic QA accounts, school-confined assignment tests,
  and test credential/recovery email to `jkayobotsi+plume-qa@gmail.com`.
- Created all six accounts through the deployed public administrator UI in
  school `8f9da60a-ed0e-47f4-9050-4cda2448a2dc`. A separate read confirmed
  exactly one school administrator, two teachers and three students:
  `qa.onboarding.admin.20260913`, `qa.teacher.a.20260914`,
  `qa.teacher.b.20260914`, and `qa.student.{a,b,c}.20260914`.
- The administrator has email recovery enabled; the UI reported credentials
  sent to the approved address. Inbox delivery has not been independently
  confirmed. The other five accounts use usernames without recovery email.
  Temporary passwords are not recorded in this roadmap or committed files.
- Students A and B are actively enrolled in QA Class A; C is enrolled in
  QA Class B. Both teachers share Class A. Teacher A was additionally assigned
  Class B through the UI; an independent read confirmed all three class grants.
  Teacher B has a direct assignment to student C. No real memberships changed,
  and the voluntary feedback-pilot checkbox was not selected.
- All six accounts correctly retain the first-login password-change flag.
  Password setup requires user handoff; no flag or credential bypass was used.
- First-login attempts exposed a production error, so authenticated acceptance
  is **not passed**. The UI displays React error 441; a runtime log on the
  verified public deployment records `Identifiant ou mot de passe incorrect`
  for `/login`. A bounded SOL High investigation is checking the underlying
  login failure and safe handling of expected authentication errors.
- Remaining: successful first login/password setup, school-admin-scoped UI,
  teacher-visible diagnostic/activity reports, invitation/recovery/resume, and
  browser-level revocation/deactivation/foreign-school denial evidence.
  Account and assignment persistence do not substitute for these checks.

## Login error hotfix deployed; CAPTCHA investigation — 2026-09-14

- Further owner-UI assignment checks passed on synthetic teacher A: added a
  direct link to student C, removed Class B, observed the message that one pupil
  retained another known right, and restored Class B. Both QA teachers now have
  direct links to C. These are management-UI checks, not teacher-view proof.
- All six QA Auth records are confirmed, not banned/deleted, and have no
  successful sign-in recorded at the checkpoint. No password was reset.
- Bounded SOL High change `1982c3e` returns typed expected login errors instead
  of throwing them through the production Server Action boundary. Only explicit
  safe errors are returned; unexpected exceptions remain opaque. Supabase
  `captcha_failed` maps to a fixed anti-robot message without provider details.
- Review verification: **29 focused tests**, TypeScript, scoped ESLint and
  whitespace checks passed. The full run passed **2,012 tests** but encountered
  four disk-space failures and two five-second timeouts. A serial rerun of all
  six affected suites passed **21 tests**; the full invocation itself was not
  green. No unrelated tests, timeouts or security checks were weakened.
- Candidate `dpl_9chfNkEfuV2KDsKXzxwoXF3c7SAJ` built **Ready**. Candidate login
  returned 200; unauthenticated administrator/teacher routes redirected to login.
  Promoted this exact deployment, source **`1982c3e`**, to the public pilot.
  Immutable URL: <https://sigmawrite-fn5dfcnms-jpkays-projects.vercel.app>.
  No migration or environment/security-setting change accompanied this release.
- Fresh public-browser QA administrator login now displays
  `La vérification anti-robot a échoué. Réessayez.` instead of React error 441.
  Error-message delivery is verified; **successful authentication is not**.
- Production has `TURNSTILE_SECRET_KEY` but no `SUPABASE_CAPTCHA_ENABLED` flag.
  The leading hypothesis is duplicate validation of a single-use token by Plume
  and Supabase Auth. Supabase Auth's CAPTCHA setting still needs direct
  confirmation; do not disable protection or assume that hypothesis is proven.
  Its dashboard opened at a sign-in screen. Owner asked to sign in to that
  Chrome tab so the configuration can be inspected read-only.
- Remaining acceptance gates above are unchanged. The account-creation approval
  is resolved; CAPTCHA diagnosis and eventual user password-setup handoff remain.

## CAPTCHA ownership confirmed — 2026-09-14

- The Supabase dashboard still required sign-in, but the already-authenticated
  CLI credential provided a safe read-only alternative. The official Management
  API returned HTTP 200 for this exact public-pilot project's Auth configuration:
  CAPTCHA **enabled**, provider **Turnstile**, secret configured. No credential
  value or full configuration response was logged or written to the repository.
  Dashboard sign-in is no longer required to establish this configuration.
- Plume must set `SUPABASE_CAPTCHA_ENABLED=true` for login/recovery so Supabase
  receives the token before it is consumed. Supabase protection remains enabled;
  the independent `TURNSTILE_SECRET_KEY` must remain configured as well.
- Review found that no-email class joining uses privileged Auth account creation,
  which cannot delegate its pre-creation CAPTCHA check. A bounded SOL High fix
  keeps that verification mandatory, fails closed in delegated mode without the
  local secret, and returns the existing fresh-login handoff after creation.
  It also aligns the join password limit with the login limit.
- This checkpoint records the verified cause and reviewed release requirements;
  production configuration/deployment and successful login need the following
  release checkpoint before being counted as passed.

## CAPTCHA correction deployed; first login passed — 2026-09-14

- Source **`bcc3c08`** is committed and pushed. Main review passed **50 tests
  across 7 focused files**, TypeScript, scoped ESLint and whitespace checks.
  Coverage includes delegated CAPTCHA denial, rate budgets, first-password
  routing, mandatory verification before privileged student creation, missing
  secret refusal, invalid invitations, recovery rejection, and password limits.
- Added production `SUPABASE_CAPTCHA_ENABLED=true` in the existing Vercel
  project. Supabase's enabled Turnstile configuration and Plume's independent
  secret remain unchanged. No database migration or password update was made.
- Built candidate **`dpl_Cfj5FWeNnyn8227dY6qf72etAmBd`** to Ready. Candidate
  `/login` and `/join` returned 200; unauthenticated `/admin/users` and `/teacher`
  redirected to login. Promoted this exact candidate to the public pilot.
  Immutable URL: <https://sigmawrite-d8h7ajnpo-jpkays-projects.vercel.app>.
- Fresh browser login at <https://sigmawrite.vercel.app> with the QA
  administrator's original temporary credentials **succeeded** and displayed
  `Choisir un nouveau mot de passe`. An independent Auth read confirmed
  `last_sign_in_at = 2026-09-14 06:58:28.882669+00`; `must_change_password`
  remains true. This verifies the CAPTCHA correction and mandatory setup gate,
  not a completed school-administrator journey.
- Handed the password form to the owner before entering any new credential.
  The next required interaction is choosing/confirming a password for
  `qa.onboarding.admin.20260913` and submitting `Enregistrer et continuer`.
  Do not ask the owner to disclose that password in chat.
- Remaining full-goal evidence: school-admin-scoped management, teacher/student
  onboarding and actual report visibility, invitations, recovery/resume, and
  browser-level last-grant revocation/deactivation/foreign-school denials.

## School administrator acceptance and routing fix — 2026-09-14

This checkpoint supersedes the administrator password handoff above.

- Owner completed the QA administrator's password setup. The public `/teacher`
  page renders as `QA Administrateur Onboarding`; an independent profile read
  confirms `must_change_password=false`. No chosen password was collected.
- `/admin/users` shows exactly the six QA accounts within the QA school.
  As this school administrator, removed Teacher B's direct grant to Student C,
  observed the no-remaining-grant status, then restored the original grant.
  This verifies management controls, not the teacher's own post-revocation view.
- Created empty `QA Classe Administration` through `/teacher/classes` (grade 7,
  2026–2027). Independent DB read confirms class
  `30a93ff3-41cf-4e03-aa7b-4cffc2df58cc` belongs to QA school
  `8f9da60a-ed0e-47f4-9050-4cda2448a2dc`. The fixture now has three classes
  and the same six accounts/three students; existing enrollments are unchanged.
- Public signed-out `/join` accepted this class's seven-day, one-use code and
  displayed the correct QA class/school. Replaced it through the administrator
  UI: the old code was rejected, and the new code accepted. No seventh account
  was created or invitation sent; signup/use consumption is not yet verified.
  Codes were kept out of tool logs and repository files.
- Live testing found `/admin/schools` incorrectly redirected a school admin to
  `/teacher`. Bounded GPT-5.6 SOL High fix **`fc91ffd`** allows only the exact
  `/admin/users` and `/admin/schools` route families, rejects lookalikes, and
  retains password setup and teacher/student restrictions. Main review passed
  **37 tests across 4 focused files**, TypeScript, scoped ESLint and diff checks.
- Source committed/pushed; candidate **`dpl_CkgKLrrFDBhKXyzSbbbkrnDN7tvK`**
  built Ready. Candidate `/login` and `/join` returned 200; unauthenticated
  `/teacher` and `/admin/schools` redirected to login. Promoted that exact
  candidate and independently resolved the public alias to it. Immutable URL:
  <https://sigmawrite-law0xx6kx-jpkays-projects.vercel.app>.
- Fresh public page load now shows `Mon établissement`, exactly one QA school,
  and its three classes. Edited the empty class to
  `QA Classe Administration — vérifiée`; UI returned `Enregistré`. An unrelated
  `/admin/items/review` request still redirects this school admin to `/teacher`.
  The refreshed teacher sidebar's École link then navigates correctly.
- Remaining gates: teacher/student authentication, real activity/report evidence,
  signup/recovery/resume, and teacher-view denial/revocation/deactivation and
  foreign-school browser checks. The other five QA accounts still require
  first-password setup. Their one-time credentials are no longer available in
  the current browser-tool session; use a user-controlled QA password-reset
  handoff, never a database/API credential bypass. Administrator setup is no
  longer blocked. The goal remains active and is not complete.

## Teacher A credential recovery and first login — 2026-09-14

- Owner used `Mot de passe` for `QA Enseignant A`. The administrator UI displayed
  that account's new temporary credentials; the previous missing-credential
  handoff is resolved for this account only.
- Entered the existing temporary credentials into the public Plume login in a
  separate Chrome tab, preserving the in-app administrator session. Login
  succeeded and rendered `Choisir un nouveau mot de passe`. No credential value
  was printed, saved in a file or committed.
- Handed the first-login form to the owner before entering a new password.
  Owner must fill both password fields and submit `Enregistrer et continuer`.
  Teacher dashboard/report and access-boundary acceptance remains unproven until
  this mandatory setup is completed. The other four QA accounts remain pending.
- No application code, database configuration or deployment changed for this
  check. Public application source remains `fc91ffd`.

## Teacher A scope and last-grant acceptance — 2026-09-14

- Owner completed Teacher A's password setup. Chrome renders `/teacher` as
  `QA Enseignant A`; the refreshed administrator console no longer shows its
  password-renewal badge. Its dashboard lists exactly two assigned classes,
  three QA students and one direct student assignment. `/teacher/classes`
  excludes the unassigned, empty administration QA class.
- Student C's detail renders diagnostic, per-skill evidence and activity regions,
  with class B and direct-grant labels. These QA students have no recorded
  activity: empty states are correct but do not prove populated report accuracy.
- Removed Teacher A's class B grant through the QA administrator UI. A fresh
  teacher page still renders Student C, labelled only `Affectation directe`.
  Removed the remaining direct grant: fresh student detail shows
  `Élève introuvable`, and the dashboard lists only Students A/B, one class and
  zero direct assignments. No Student C report content is rendered.
- Restored the original direct grant, tested class B's URL while class B was
  still unassigned, then restored the original class B grant. The unassigned
  class did not expose content but showed a generic global error instead of a
  normal access-denied/not-found page. A bounded SOL High fix is being prepared;
  its release evidence must be recorded separately.
- After restoration, class B renders normally with Student C, its username and
  the expected class controls. Teacher A again has the original two class
  assignments and direct Student C assignment. No real membership changed.
- `/teacher/reports` renders the three QA students with their empty activity
  summaries. Navigating to `/admin/users` redirects Teacher A to `/teacher`.
- Remaining full-goal gates include Teacher B's actual view, student signup,
  login/recovery/resume, populated report evidence, deactivation and foreign-
  school browser checks. Teacher A and QA administrator sessions are preserved.

## Unassigned-class denial fix deployed — 2026-09-14

- Bounded GPT-5.6 SOL High implementation **`8bd589a`** adds an authenticated,
  RLS-bound `classes` lookup before any roster, goal, league, join-code or
  credential loaders. A missing/inaccessible class uses Next.js `notFound()`;
  database errors still propagate. No service-role bypass or broader grant was
  introduced, and no migration or environment setting changed.
- Main review confirmed `classes_select` requires an actual teacher-class grant
  in the same school (or scoped school administration); a direct student grant
  alone cannot pass. **25 tests across 5 focused files**, TypeScript, scoped
  ESLint and whitespace checks passed. Page tests prove denied lookup results
  stop all class loaders; the separate SQL/live checks establish grant semantics.
- Committed and pushed the source. Candidate
  **`dpl_EMHLSsfGJxcwf9VPU2ASvSJEvg5z`** built Ready; `/login` and `/join`
  returned 200, and an unauthenticated class request redirected to login.
  Promoted this exact candidate to the public pilot. Immutable URL:
  <https://sigmawrite-61ntuou4o-jpkays-projects.vercel.app>.
- Public regression: removed only Teacher A's class B grant while retaining
  direct Student C access. A fresh class B request now renders the normal
  `404 / This page could not be found.` response, without class content or the
  generic error page. Student C's report still opens with only the direct label.
- Restored class B, then verified its full teacher page, Student C roster entry
  and credential controls render normally. Independently checked the school
  administrator's empty QA administration class: it also renders without error.
  Teacher A's original two class grants and direct Student C grant are restored.
- Next account: `QA Enseignant B` (`qa.teacher.b.20260914`). Its temporary
  credential still needs a user-controlled reset through the administrator
  account page, followed by login and first-password setup. No further reset or
  new password was performed by the agent. Full-goal gates remain open.

## Teacher B reset and first login — 2026-09-14

- Owner reset `QA Enseignant B` (`qa.teacher.b.20260914`) through the account
  page. Its temporary credential notice was verified and used privately for
  login; no password value was printed or persisted.
- Signed out the tested QA Teacher A Chrome session and signed in Teacher B on
  the public site. The login succeeded and displayed `Choisir un nouveau mot
  de passe`. The in-app QA administrator session remains authenticated.
- Handed Teacher B's new-password form to the owner before entering anything.
  Its shared-class/direct-student view remains pending this mandatory setup.
  Teacher A's password and restored assignments were not changed. No code or
  deployment change was needed; application source remains `8bd589a`.

## Teacher B shared/direct access and deactivation — 2026-09-14

- Owner completed Teacher B's password setup. Its authenticated dashboard shows
  one class, three QA students and one direct assignment. Students A/B are
  labelled class A; Student C is labelled only `Affectation directe`.
- Teacher B opens Student C's granular diagnostic/activity report through its
  direct grant. Class B's URL returns the normal 404. Shared class A renders
  Students A/B, not Student C. The reports page includes all three authorised
  students with correct empty activity states. Both teacher account views have
  now been exercised; populated student/report evidence remains pending.
- Through the approved QA administrator controls, deactivated Teacher B while
  its Chrome session was active. Refreshing `/teacher/reports` redirected to
  `/login?next=%2Fteacher%2Freports`; no report content remained visible.
- Reactivated Teacher B. Backend `setUserDeactivated` intentionally deletes
  teacher class/direct grants during deactivation; reactivation does not restore
  them. Restored only its original class A and direct Student C grants through
  the UI, then refreshed: Teacher B is active with 1 class/1 direct assignment;
  Teacher A remains at 2 classes/1 direct assignment. No real account changed.
- Found a display inconsistency: the unrefreshed account row retained the old
  assignment counts after deactivation/reactivation even though the server had
  removed them. A bounded SOL High UI fix is in progress to clear those local
  counts and explain that teacher assignments must be added again. Backend
  deactivation/security behaviour will remain unchanged.
- Next account handoff is `QA Élève C` (`qa.student.c.20260914`) so actual
  student activity can be tested before validating populated teacher reports.
  Chrome is signed out by the deactivation test; the administrator session is
  preserved. All three students still need first-password setup.

## Teacher deactivation display correction — 2026-09-14

- SOL High change **`74d2e1a`** clears the account row's local class/direct
  assignment collections after successful teacher deactivation. Reactivation
  does not recreate stale grants. Teacher-specific status text explains that
  assignments were removed and must be assigned again. Backend semantics,
  password controls and access permissions are unchanged.
- Main diff review and TypeScript passed. Initial test attempts failed before
  running tests because the workstation could not create temporary directories
  (`ENOSPC`). Confirmed no local Next.js server was running, then removed only
  this repository's untracked, regenerable `.next` build output (88 MB). No
  source, QA credential or saved evidence file was removed.
- Serial rerun passed **12 tests across 4 files**, followed by scoped ESLint and
  whitespace checks. New UI tests check source contracts; the deployed browser
  check below is required to prove actual state transitions.
- Source committed and pushed. Candidate
  **`dpl_DSxb1wworYN3uDYJmGp71vnHWD5t`** built Ready. Candidate `/login`
  returned 200; unauthenticated `/admin/users` and `/teacher` redirected to
  login. Promoted this exact candidate. Immutable URL:
  <https://sigmawrite-ghv59goqe-jpkays-projects.vercel.app>.
- Fresh public administrator page showed Teacher B at 1 class/1 direct grant.
  With its class controls expanded, deactivation immediately changed both
  counts to zero, cleared the class A selected state, and explained that
  assignments had been removed. No reload was used to establish those changes.
  Reactivation kept both counts at zero and displayed reassignment guidance.
- Restored only class A and direct Student C through the UI, then refreshed the
  account page to verify persistence. The QA teacher is active again with its
  original scope. Student C's password handoff remains the next step; full-goal
  student activity, populated reports and foreign-school browser gates are open.

## Student C handoff and remaining browser acceptance — 2026-09-22

- Using the existing temporary credential for `qa.student.c.20260914`, the
  public login reached `/set-password?first=1` in the in-app browser. Both
  password fields were left untouched and the Chrome administrator session was
  preserved. Owner completion of the password handoff has not been confirmed,
  so Student C authentication and activity acceptance have not passed.
- The intended evidence path is already implemented: `/student/diagnostic`
  records granular observations and refinements in
  `granular_assessment_sessions.state`, while a completed
  `/student/read/[textSlug]` session records `reading_sessions`, `dailyactivity`
  and XP used by weekly metrics; an unfinished reading session can be resumed.
  Student C still has no proven populated teacher-detail or reports evidence.
- Last verified release baseline before this checkpoint was application source
  `74d2e1a`, production deployment `dpl_DSxb1wworYN3uDYJmGp71vnHWD5t` at
  <https://sigmawrite.vercel.app>, and aligned `develop` / `origin/develop` at
  `cc8eb8385572d641ae0fe2990617caee265af791`. This entry does not claim a fresh
  production deployment verification.
- Owner subsequently completed Student C's first-password form. The authenticated
  student identity was accepted, onboarding saved three interests and routed to
  the diagnostic. A bounded read-only production query confirmed
  `must_change_password=false`, a completed onboarding timestamp and exactly
  three interest rows for student `41506dc0-590a-4c00-9a1a-17c83e628631`.
- The production diagnostic then displayed `Ce diagnostic n’est pas encore
  disponible.` The configured non-secret release key was exactly
  `french-granular-diagnostic-v43-modal\n`, with an actual trailing newline.
  That value has no exact release-row match; the whitespace-trimmed key resolves
  to published release `b6f62722-c913-4d64-9ffd-59027eefc73b`, whose taxonomy,
  bank, provenance identifiers and parent checksums all match and are published.
- Corrected only the production release-key newline. The exact configured key is
  now `french-granular-diagnostic-v43-modal`: 36 characters, ending in `l`
  (character code 108). Code fix `dc0667d` redirects a locked student from
  `/student/lessons` to the diagnostic instead of rendering the generic error.
  Promoted deployment `dpl_AuydUuMowWnkUDdmvT9Xa99a3Emb`, source `573a1ac`, and
  independently confirmed the public alias resolves to it.
- Final public-browser QA at 21:07:22 CAT confirmed Student C remained
  authenticated, `/student/lessons` redirected to the diagnostic without a
  generic error, and the diagnostic start screen loaded with zero answers and a
  35-minute estimate. Student C answered four real questions, paused, reloaded
  and resumed at the same fifth question. The fifth answer persisted; the paused
  screen then showed five answers, zero skips, a 32-minute estimate,
  `Progression enregistrée` and `Reprendre`.
- A read-only production checkpoint at `2026-09-22 19:08:23.901033+00` confirmed
  granular session `08bdc0f8-04cc-4c85-b484-21252a0df38b`, release
  `b6f62722-c913-4d64-9ffd-59027eefc73b`, revision 20, phase `assessing`, paused,
  with five observations, five answered and zero skipped. Its last persisted
  update was `2026-09-22 19:07:10.105636+00`; Student C still had zero reading
  sessions. This proves start, persistence and pause/resume, not diagnostic
  completion, reading completion or populated teacher reports.

## Additional isolation fixture authorization and invitation UI gap — 2026-09-22

- Owner authorized exactly one additional synthetic school, class and student
  account, bringing the approved account ceiling to seven, for invitation signup
  and cross-school browser acceptance. Authorization does not mean the seventh
  account has been created.
- Through the public platform-administrator UI, created school
  `QA Isolation — 2026-09-22` (`cb5326e3-fed0-4b42-a561-7eeffac36cc0`) and class
  `QA Classe Isolation — 2026-09-22`
  (`9718b70d-dd82-4e4c-9e1d-b7d565bafbff`). A scoped read confirmed the class
  belongs to that school.
- At the checkpoint, the original QA school still had exactly six profiles and
  `qa.student.isolation.20260922` had zero profiles. The existing six accounts
  were unchanged; no seventh student account or class enrollment had been
  created.
- The application UI/role mismatch is fixed and live: the invitation action now
  admits platform administrators, the school console links to a scoped
  administrator invitation page, and the page retains the authenticated client
  plus `can_manage_class_invitations` database authorization. Main review and
  integration passed **41 tests across 5 files**, changed-file lint, full
  TypeScript and whitespace checks. Promoted deployment
  `dpl_2BFF7tjfQR2vFnd899DZXqm3nrvW`, source
  `53d50818d02e3e58767e8a51497877bb19978daf`, to
  <https://sigmawrite.vercel.app>.
- The live administrator route
  `/admin/schools/classes/9718b70d-dd82-4e4c-9e1d-b7d565bafbff/invitations`
  rendered the correct class and initially showed no code. Generated one
  seven-day, one-use invitation; refreshing retained the same private code, so
  no replacement occurred. A single read-only checkpoint confirmed invitation
  `0571d5f8-9bea-4591-80c2-1bbbc9ab1724` for the expected class, created
  `2026-09-22 19:37:10.353948+00`, expiring
  `2026-09-29 19:37:10.353948+00`, with `uses=0`, `max_uses=1` and no revocation.
  The private code was not queried or recorded.
- At that checkpoint, no account creation or signup had started. The original QA
  school remained at six profiles and `qa.student.isolation.20260922` remained
  absent. The seventh account was approved, not awaiting fixture approval. Its
  signup handoff was then gated by browser/model access: this agent could not
  operate the parent-owned in-app browser, and the user had requested Astra
  permission before further UI work. One-use consumption and foreign-school
  browser denial were therefore still unproven at that time.
- Student C remains unchanged at the last verified checkpoint: session
  `08bdc0f8-04cc-4c85-b484-21252a0df38b` is paused at revision 20 with five
  answered observations and no reading sessions.

### Owner invitation-signup checkpoint — 2026-09-22

- The owner completed password setup on public `/join` for the synthetic username
  `qa.student.isolation.20260922`, using the isolation school and class recorded
  above. The public app redirected to `/login?joined=1` and explicitly confirmed
  `Ton compte a été créé`.
- A fresh public `/join` revalidation of that exact one-use invitation was rejected
  as invalid, expired, revoked or full. No invitation code or password is recorded
  here.
- Independent read-only production verification at `2026-09-22 20:28:09+00`
  found exactly one Auth account, profile and student row for
  `qa.student.isolation.20260922`: school
  `cb5326e3-fed0-4b42-a561-7eeffac36cc0`, grade 7, and exactly one active
  enrollment in class `9718b70d-dd82-4e4c-9e1d-b7d565bafbff`. Invitation
  `0571d5f8-9bea-4591-80c2-1bbbc9ab1724` had `uses=1` and `max_uses=1`.
  The original QA school still had six profiles; across the approved two-school
  QA scope there were exactly seven active profiles and seven distinct Auth
  accounts. Browser login/recovery, populated teacher reports and cross-school
  browser denial remain pending.

### Isolation student login and onboarding checkpoint — 2026-09-23

- Public in-app-browser login as the synthetic
  `qa.student.isolation.20260922` account succeeded and showed the student
  identity `QA Élève Isolation` at `/student/onboarding`. The class-provided
  grade 7 was locked.
- Completed onboarding with three synthetic interests: science, technology and
  African history. The app routed to `/student/diagnostic`, which showed zero
  answers and `Commencer`. The diagnostic was **not started**.
- An independent read-only production checkpoint at
  `2026-09-23 14:22:22 UTC` confirmed Auth `last_sign_in_at` at
  `2026-09-23 14:18:12 UTC`, `onboarding_completed_at` at
  `2026-09-23 14:20:07 UTC`, exactly three interests, an active student linked
  to the intended isolation school, and exactly one active enrollment in the
  intended isolation class.
- Browser login and onboarding are now verified. Recovery, Student C diagnostic
  completion and reading, populated teacher reports, and cross-school browser
  denial remain pending. Isolation-school membership does not itself prove
  foreign-school denial. No password or token was recorded.

### Public-browser foreign-school denial — 2026-09-23

- The approved QA school administrator `qa.onboarding.admin.20260913` signed in
  through a fresh one-time email link in the public in-app browser. The live UI
  showed `QA Administrateur Onboarding School Admin`. No password, link, token
  or private invitation code is recorded here.
- `/admin/schools` showed exactly the original school
  `QA Onboarding — 2026-09-13` and its classes; the separate
  `QA Isolation — 2026-09-22` school was absent. The administrator's own class
  A route `/teacher/classes/a69840cd-7bf3-4f77-b783-17c794136fd8` rendered the
  expected Students A and B.
- The foreign isolation invitation route
  `/admin/schools/classes/9718b70d-dd82-4e4c-9e1d-b7d565bafbff/invitations`
  returned a non-disclosing 404. The corresponding foreign teacher-class route
  `/teacher/classes/9718b70d-dd82-4e4c-9e1d-b7d565bafbff` also returned 404.
  Neither route exposed isolation-school content.
- A read-only Auth checkpoint confirmed `last_sign_in_at =
  2026-09-23 15:15:13Z`, role `school_admin`, and the original QA school as the
  account's own school. Chrome retained a separate Platform Admin session; the
  school-admin evidence came from the fresh in-app-browser session.
- In the same authorised school-admin session, Student C's detail showed a
  provisional diagnostic with five saved answers, zero skips, four active
  minutes and at least one admissible per-skill observation. The reading panel
  still said no activity, and `/teacher/reports` still showed zero weekly texts
  for Student C. This is partial diagnostic visibility, not completed
  diagnostic/reading or populated teacher-report acceptance.
- The public-browser foreign-school gate is now **passed**. Student C diagnostic
  completion and reading, populated teacher reports, and recovery remain open;
  this checkpoint does not claim the total onboarding goal is complete.

### Shortest remaining acceptance checklist

1. As Student C, complete `/student/diagnostic`; start a reading at
   `/student/read/[textSlug]`, leave it unfinished, reopen it to prove resume,
   then complete it.
2. In both authorised teacher accounts, open Student C's detail and
   `/teacher/reports`; confirm populated granular/per-skill evidence, the
   completed reading activity, and the resulting daily/weekly XP metrics.
3. Complete the browser recovery check for the seventh synthetic account; its
   browser login and onboarding are now verified.

The separate foreign-school browser gate passed on 2026-09-23. The three items
above remain open, so the total goal is not yet complete.

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
