import "server-only";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type SchoolManagementClass = {
  id: string;
  name: string;
  gradeLevel: number | null;
  academicYear: string | null;
};

export type SchoolManagementSchool = {
  id: string;
  organizationId: string | null;
  organizationName: string | null;
  name: string;
  city: string | null;
  country: string | null;
  curriculumType: string | null;
  classes: SchoolManagementClass[];
};

export type SchoolManagementData = {
  viewerRole: "platform_admin" | "school_admin";
  viewerSchoolId: string | null;
  organizations: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  schools: SchoolManagementSchool[];
};

type OrganizationRow = { id: string; name: string; type: string };
type SchoolRow = {
  id: string;
  organization_id: string | null;
  name: string;
  city: string | null;
  country: string | null;
  curriculum_type: string | null;
};
type ClassRow = {
  id: string;
  school_id: string | null;
  name: string;
  grade_level: number | null;
  academic_year: string | null;
};

/**
 * Keep the final shaping step independently testable. The school-admin filter
 * is deliberate defence in depth on top of database RLS.
 */
export function assembleSchoolManagementData(input: {
  viewerRole: "platform_admin" | "school_admin";
  viewerSchoolId: string | null;
  organizations: OrganizationRow[];
  schools: SchoolRow[];
  classes: ClassRow[];
}): SchoolManagementData {
  const visibleSchools = input.viewerRole === "platform_admin"
    ? input.schools
    : input.schools.filter((school) => school.id === input.viewerSchoolId);
  const visibleSchoolIds = new Set(visibleSchools.map((school) => school.id));
  const visibleOrganizationIds = new Set(
    visibleSchools.flatMap((school) => school.organization_id ? [school.organization_id] : []),
  );
  const visibleOrganizations = input.viewerRole === "platform_admin"
    ? input.organizations
    : input.organizations.filter((organization) => visibleOrganizationIds.has(organization.id));
  const organizationNames = new Map(input.organizations.map((organization) => [organization.id, organization.name]));

  return {
    viewerRole: input.viewerRole,
    viewerSchoolId: input.viewerSchoolId,
    organizations: visibleOrganizations,
    schools: visibleSchools.map((school) => ({
      id: school.id,
      organizationId: school.organization_id,
      organizationName: school.organization_id ? organizationNames.get(school.organization_id) ?? null : null,
      name: school.name,
      city: school.city,
      country: school.country,
      curriculumType: school.curriculum_type,
      classes: input.classes
        .filter((selectedClass) => selectedClass.school_id === school.id && visibleSchoolIds.has(school.id))
        .map((selectedClass) => ({
          id: selectedClass.id,
          name: selectedClass.name,
          gradeLevel: selectedClass.grade_level,
          academicYear: selectedClass.academic_year,
        })),
    })),
  };
}

export async function getSchoolManagementData(): Promise<SchoolManagementData> {
  const session = await requireRole(["platform_admin", "school_admin"]);
  if (session.role !== "platform_admin" && session.role !== "school_admin") {
    throw new Error("Rôle de gestion d’établissement requis.");
  }
  const viewerRole = session.role;
  const supabase = await createClient();

  const [organizationsResult, schoolsResult, classesResult, profileResult] = await Promise.all([
    supabase.from("organizations").select("id,name,type").order("name"),
    supabase.from("schools").select("id,organization_id,name,city,country,curriculum_type").order("name"),
    supabase.from("classes").select("id,school_id,name,grade_level,academic_year").order("name"),
    viewerRole === "school_admin"
      ? supabase.from("profiles").select("school_id").eq("id", session.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const error = organizationsResult.error ?? schoolsResult.error ?? classesResult.error ?? profileResult.error;
  if (error) throw new Error(`Impossible de charger la gestion des établissements : ${error.message}`);

  const viewerSchoolId = viewerRole === "school_admin"
    ? (profileResult.data?.school_id as string | null | undefined) ?? null
    : null;
  if (viewerRole === "school_admin" && !viewerSchoolId) {
    throw new Error("Votre compte administrateur n’est rattaché à aucune école.");
  }

  return assembleSchoolManagementData({
    viewerRole,
    viewerSchoolId,
    organizations: (organizationsResult.data ?? []) as OrganizationRow[],
    schools: (schoolsResult.data ?? []) as SchoolRow[],
    classes: (classesResult.data ?? []) as ClassRow[],
  });
}
