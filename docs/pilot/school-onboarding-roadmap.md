# Self-service school onboarding and teacher supervision

Goal started 2026-09-13. This ledger concerns onboarding and access, not curriculum
completion or educational calibration. The existing production application is
unchanged until an explicitly verified release is recorded below.

## Acceptance ledger

| Requirement | Required proof | Current state |
| --- | --- | --- |
| School and class setup | Platform admin creates a school and appoints its admin; school admin manages only that school and creates/edits classes through the UI | Implementation in progress |
| Student onboarding and recovery | Valid invitation joins the right class; invalid/expired/revoked invitations fail; login, resume and recovery verified without changing real credentials | Implementation in progress |
| Many-to-many teacher assignments | Two teachers, two classes and at least three students; shared class and direct-student assignments work; separate grants remain distinguishable | Database assertions passed locally; UI in progress |
| Teacher reports | Assigned teacher sees diagnostic results, per-skill evidence, activity and progress; direct assignment works without granting an entire class | Implementation in progress |
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

## Release gates

1. Integrate the three agent slices; review all service-role paths and RPC checks.
2. Exercise the complete journey on isolated technical QA data, including revoked
   grants, multiple teachers, direct-only students and a foreign school.
3. Apply only reviewed forward migrations after exact linked-project/schema preflight.
4. Build a candidate, verify its UI, then promote and repeat public checks.
5. Record actual evidence here. Technical users are not real-student observations.

Real school membership changes, real invitations and credential recovery remain
under the owner's control. Synthetic QA account bootstrapping does not count as
proof of the product's school/class/student creation UI.
