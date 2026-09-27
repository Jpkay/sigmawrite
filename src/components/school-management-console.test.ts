import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { SchoolManagementConsole } from "./school-management-console";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/actions/schools", () => ({
  createSchool: vi.fn(),
  createSchoolClass: vi.fn(),
  updateSchool: vi.fn(),
  updateSchoolClass: vi.fn(),
}));

it("links every class editor to its admin invitation page", () => {
  const html = renderToStaticMarkup(React.createElement(SchoolManagementConsole, {
    data: {
      viewerRole: "school_admin",
      viewerSchoolId: "school-a",
      organizations: [{ id: "organization-a", name: "Académie", type: "school_group" }],
      schools: [{
        id: "school-a",
        organizationId: "organization-a",
        organizationName: "Académie",
        name: "École du Lac",
        city: "Kigali",
        country: "Rwanda",
        curriculumType: "national",
        classes: [
          { id: "class-a", name: "5e A", gradeLevel: 7, academicYear: "2026–2027" },
          { id: "class-b", name: "5e B", gradeLevel: 7, academicYear: "2026–2027" },
        ],
      }],
    },
  }));

  expect(html.match(/Inviter des élèves/g)).toHaveLength(2);
  expect(html).toContain('href="/admin/schools/classes/class-a/invitations"');
  expect(html).toContain('href="/admin/schools/classes/class-b/invitations"');
});
