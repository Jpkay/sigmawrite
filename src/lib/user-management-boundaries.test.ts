import { describe, expect, it } from "vitest";
import { filterVisibleClassIds, resolveInitialUserManagementSelection } from "./user-management-boundaries";

const schools = [{ id: "school-a" }, { id: "school-b" }];

describe("user management URL boundaries", () => {
  it("accepts a platform administrator's valid role and school preselection", () => {
    expect(resolveInitialUserManagementSelection(
      { viewerRole: "platform_admin", viewerSchoolId: null, schools },
      { role: "school_admin", schoolId: "school-b" },
    )).toEqual({ initialRole: "school_admin", initialSchoolId: "school-b" });
  });

  it("rejects repeated, unknown, and out-of-scope query values", () => {
    expect(resolveInitialUserManagementSelection(
      { viewerRole: "platform_admin", viewerSchoolId: null, schools },
      { role: ["teacher", "school_admin"], schoolId: "foreign-school" },
    )).toEqual({ initialRole: "student", initialSchoolId: "" });
  });

  it("does not let a school administrator preselect a privileged role or foreign school", () => {
    expect(resolveInitialUserManagementSelection(
      { viewerRole: "school_admin", viewerSchoolId: "school-a", schools: [{ id: "school-a" }] },
      { role: "school_admin", schoolId: "school-b" },
    )).toEqual({ initialRole: "student", initialSchoolId: "school-a" });
  });
});

describe("visible class projection", () => {
  it("removes stale and cross-school class links from returned account data", () => {
    expect(filterVisibleClassIds(["class-a", "class-foreign", "class-b"], new Set(["class-a", "class-b"])))
      .toEqual(["class-a", "class-b"]);
  });
});
