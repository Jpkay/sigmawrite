# School setup workstream

## Outcome

Platform administrators can create a school under an existing organization or atomically create the organization and school. Platform and school administrators can edit a school's name, city, and country, create classes, and edit only a class name, grade, and academic year. A school administrator sees and manages only the school assigned through `profiles.school_id`.

There is no school deletion flow and no class-to-school reassignment flow.

## Owned surface

- `src/lib/actions/schools.ts`
- `src/lib/db/schools.ts`
- `src/components/school-management-console.tsx`
- `src/app/admin/schools/page.tsx`
- school-administrator navigation in `src/app/admin/layout.tsx`
- `supabase/migrations/20260914100000_school_self_service.sql` and its matching tests

## Database contract

- `create_school_with_organization(p_school_name, p_organization_id, p_organization_name, p_city, p_country, p_curriculum_type) returns uuid`
- `update_school(p_school_id, p_name, p_city, p_country) returns uuid`
- `create_school_class(p_school_id, p_name, p_grade_level, p_academic_year) returns uuid`
- `update_school_class(p_class_id, p_name, p_grade_level, p_academic_year) returns uuid`
- existing `create_teacher_class(p_name, p_grade, p_year) returns uuid` remains compatible but now prefers the active caller's `profiles.school_id`; an unassigned school administrator fails closed instead of creating an independent school, and school-admin creation relies on school scope rather than inventing a `teacher_classes` link

All functions are callable only by `authenticated` and perform their own database-owned authorization. Application actions use the cookie-bound anon client, so RLS and the RPC checks remain active. Class update does not accept a school identifier.

## Account provisioning handoff

The school console links to `/admin/users?role=school_admin&schoolId=<school UUID>`. The users screen remains the existing account-provisioning boundary; this workstream does not create Auth accounts itself. Query-string preselection is an enhancement owned by that surface and is not required for authorization.

## Authorization matrix

| Operation | Platform admin | School admin | Teacher |
|---|---:|---:|---:|
| Create organization + school | Yes | No | No |
| Create class for any school | Yes | No | No |
| Create class for own school | Yes | Yes | Existing teacher flow only |
| Edit school name/city/country | Yes | Own school only | No |
| Edit class name/grade/year | Yes | Own school only | No |
| Move or delete school | No UI/RPC | No UI/RPC | No |

## Coordination

This migration intentionally precedes `20260914101000_teacher_assignment_boundaries.sql`. That later migration owns teacher/student assignment rules and the existing `teacher_students` table; this slice neither recreates nor mutates that contract.

## Verification scope

Run the focused Vitest files for school actions and school data shaping, plus the matching native transactional SQL assertions on a disposable local Supabase database. No remote mutations, deployment, full build, or account provisioning are part of this workstream.
