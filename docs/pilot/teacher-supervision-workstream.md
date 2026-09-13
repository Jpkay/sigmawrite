# Teacher supervision workstream

Status: bounded UI and server-access slice implemented on 2026-09-13. Database migration ownership remains with the main coordinator.

## Delivered surface

- `/teacher` lists every RLS-visible student, including students visible only through `teacher_students`.
- Each roster/detail view names the active access source: taught class, direct assignment, or school-admin scope.
- `/teacher/students/[studentId]` shows the current granular diagnostic scope, engine-owned per-skill status, eligible evidence counts, current granular learning progress, and reading activity.
- The legacy reading-band result appears only as a labelled historical baseline when no granular session exists. It is not converted into granular mastery claims.
- `/admin/users` manages teacher classes and direct students as independent grants. Removing either grant reports whether another known class/direct grant remains.
- `/admin/users?role=…&schoolId=…` validates request-time query values against the viewer role and visible schools before preselecting the creation form. Teacher class/direct-student choices are limited to the selected home school.
- School admins can read managed credentials for a class in their own school.

## Authorization and privacy contract

- Dashboard, student snapshots, curriculum coverage, and longitudinal graph reads use the authenticated Supabase client and real RLS.
- Granular assessment sessions deliberately have no authenticated `SELECT`. `loadTeacherGranularReport` first calls authenticated `can_view_student(studentId)` and constructs the service-backed store only after that check returns `true`.
- The granular teacher DTO contains aggregate result status, resolution, eligible item/context/occasion counts, and bounded learning-progress counters. It excludes raw responses, pending questions, answer keys, banks, persisted session state, and guided-practice answers.
- Guided lesson completion is activity progress, not independent mastery evidence. Unsupported release scope and unresolved evidence remain distinct.
- Server Actions re-authenticate and delegate class/direct assignment to the hardened authenticated RPCs. Direct links cannot be self-granted by teachers.
- School-admin password, deactivation, e-mail, and guardian-link targets must pass authenticated profile/student RLS before any service-backed mutation. Platform-admin bypass remains explicit.
- Class credential reads prove the requested class is visible through the authenticated RLS client before constructing the service client. Returned account and student class IDs are projected onto the viewer-visible class set.
- After class authorization, class-account lookup also resolves enrolled student identities through authenticated student RLS before reading usernames, so stale foreign enrollments cannot disclose account metadata.
- School-admin account discovery first loads the profile IDs visible through authenticated RLS, then uses the service client only to shape those approved accounts. Legacy null-home and guardian visibility therefore follow the hardened database policy without a duplicated application policy.

## Assignment behavior

- `set_teacher_class` and `set_teacher_student` are separate controls and audit events.
- `assignStudentAccess` calls the atomic `assign_student_class` RPC. The RPC checks caller scope and student/class/optional-teacher school equality before any write and does not transfer students between schools.
- Managed teacher creation requires one home school for a platform admin. Teacher class IDs and direct student IDs are checked against that school before provisioning.
- Managed student creation rejects class arrays spanning schools. Optional direct teachers must be active and have the same home school before provisioning; the direct link is then written through `set_teacher_student`.
- Teacher-created students gain visibility through a class the teacher already teaches; the workflow does not self-grant a direct link.

## Verification

- `npx vitest run src/lib/user-management-boundaries.test.ts src/lib/db/users.test.ts src/lib/actions/users-assignment.test.ts src/lib/teacher-supervision-report.test.ts src/lib/db/teacher-supervision.test.ts` (18 tests passed)
- `npx eslint` was run against the owned teacher dashboard, detail, user-management, report, and test files.
- Focused tests cover granular scope/resolution semantics, activity counters, precise DTO privacy sentinels, access denial before any service read, authorization-RPC failure before any service read, and authenticated atomic/separate assignment RPC routing.

No migrations, school CRUD, teacher actions, join/sign-up flows, pedagogical content, commits, deployments, or real data were changed by this workstream.
