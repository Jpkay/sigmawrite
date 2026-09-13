# Self-service school onboarding and teacher supervision

Goal started 2026-09-13. This ledger concerns onboarding and access, not curriculum
completion or educational calibration. The existing production application is
unchanged until an explicitly verified release is recorded below.

## Acceptance ledger

| Requirement | Required proof | Current state |
| --- | --- | --- |
| School and class setup | Platform admin creates a school and appoints its admin; school admin manages only that school and creates/edits classes through the UI | Implemented; action/data and native database checks passed; hosted UI pending |
| Student onboarding and recovery | Valid invitation joins the right class; invalid/expired/revoked invitations fail; login, resume and recovery verified without changing real credentials | Implemented; focused action and native invitation checks passed; hosted login/recovery pending |
| Many-to-many teacher assignments | Two teachers, two classes and at least three students; shared class and direct-student assignments work; separate grants remain distinguishable | Implemented; synthetic database assertions passed; hosted UI pending |
| Teacher reports | Assigned teacher sees diagnostic results, per-skill evidence, activity and progress; direct assignment works without granting an entire class | Current granular diagnostic/activity DTO implemented; authorization/privacy tests passed; hosted report pending |
| Access boundaries and revocation | Cross-school grants, self-grants and direct table-write bypass denied; removing last assignment and deactivation revoke access | Database assertions passed locally; hosted evidence pending |
| Verified delivery | Reviewed diff; relevant/integration tests, types, lint, build; forward migration preflight; candidate and public end-to-end verification; commit/push/deploy | Pending |

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
