import type { ManagedAccountRole } from "@/lib/user-provisioning";

export type UserManagementSearchParams = {
  role?: string | string[];
  schoolId?: string | string[];
};

const platformRoles = new Set<ManagedAccountRole>(["student", "teacher", "parent", "supervisor", "school_admin"]);
const schoolAdminRoles = new Set<ManagedAccountRole>(["student", "teacher", "parent"]);

function scalar(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

export function resolveInitialUserManagementSelection(
  data: {
    viewerRole: "platform_admin" | "school_admin";
    viewerSchoolId: string | null;
    schools: ReadonlyArray<{ id: string }>;
  },
  searchParams: UserManagementSearchParams,
): { initialRole: ManagedAccountRole; initialSchoolId: string } {
  const requestedRole = scalar(searchParams.role) as ManagedAccountRole | null;
  const allowedRoles = data.viewerRole === "platform_admin" ? platformRoles : schoolAdminRoles;
  const initialRole = requestedRole && allowedRoles.has(requestedRole) ? requestedRole : "student";

  if (data.viewerRole === "school_admin") {
    return { initialRole, initialSchoolId: data.viewerSchoolId ?? "" };
  }

  const requestedSchoolId = scalar(searchParams.schoolId);
  const initialSchoolId = requestedSchoolId && data.schools.some((school) => school.id === requestedSchoolId)
    ? requestedSchoolId
    : "";
  return { initialRole, initialSchoolId };
}

export function filterVisibleClassIds(classIds: readonly string[], visibleClassIds: ReadonlySet<string>): string[] {
  return classIds.filter((classId) => visibleClassIds.has(classId));
}
