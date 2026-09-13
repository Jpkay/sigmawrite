import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { assembleSchoolManagementData } from "./schools";

const organizations = [
  { id: "org-a", name: "Organisation A", type: "school" },
  { id: "org-b", name: "Organisation B", type: "school" },
];
const schools = [
  { id: "school-a", organization_id: "org-a", name: "École A", city: "Kigali", country: "Rwanda", curriculum_type: "national" },
  { id: "school-b", organization_id: "org-b", name: "École B", city: null, country: null, curriculum_type: "ib" },
];
const classes = [
  { id: "class-a", school_id: "school-a", name: "6e A", grade_level: 6, academic_year: "2026–2027" },
  { id: "class-b", school_id: "school-b", name: "5e B", grade_level: 5, academic_year: "2026–2027" },
];

describe("assembleSchoolManagementData", () => {
  it("keeps the platform view unscoped", () => {
    const result = assembleSchoolManagementData({ viewerRole: "platform_admin", viewerSchoolId: null, organizations, schools, classes });
    expect(result.schools.map((school) => school.id)).toEqual(["school-a", "school-b"]);
    expect(result.organizations).toEqual(organizations);
  });

  it("fails closed at the shaping boundary if cross-school rows leak through RLS", () => {
    const result = assembleSchoolManagementData({ viewerRole: "school_admin", viewerSchoolId: "school-a", organizations, schools, classes });
    expect(result.organizations.map((organization) => organization.id)).toEqual(["org-a"]);
    expect(result.schools).toEqual([expect.objectContaining({
      id: "school-a",
      organizationName: "Organisation A",
      classes: [expect.objectContaining({ id: "class-a" })],
    })]);
    expect(JSON.stringify(result)).not.toContain("school-b");
    expect(JSON.stringify(result)).not.toContain("class-b");
  });
});
