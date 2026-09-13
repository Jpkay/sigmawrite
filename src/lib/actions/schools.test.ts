import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  audit: vi.fn(),
  revalidate: vi.fn(),
  role: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/audit", () => ({ logAudit: mocks.audit }));
vi.mock("@/lib/auth", () => ({ requireRole: mocks.role }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: mocks.rpc }) }));

import { createSchool, createSchoolClass, updateSchool, updateSchoolClass } from "./schools";

const schoolId = "11111111-1111-4111-8111-111111111111";
const classId = "22222222-2222-4222-8222-222222222222";
const organizationId = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.role.mockResolvedValue({ id: "profile-id", role: "platform_admin" });
  mocks.rpc.mockResolvedValue({ data: schoolId, error: null });
});

it("creates a school through the guarded atomic organization RPC", async () => {
  await expect(createSchool({
    schoolName: "École Horizon",
    organizationId,
    organizationName: null,
    city: "Kigali",
    country: "Rwanda",
    curriculumType: "national",
  })).resolves.toEqual({ schoolId });

  expect(mocks.role).toHaveBeenCalledWith(["platform_admin"]);
  expect(mocks.rpc).toHaveBeenCalledWith("create_school_with_organization", {
    p_school_name: "École Horizon",
    p_organization_id: organizationId,
    p_organization_name: null,
    p_city: "Kigali",
    p_country: "Rwanda",
    p_curriculum_type: "national",
  });
  expect(mocks.audit).toHaveBeenCalledWith("school.created", expect.objectContaining({ targetId: schoolId }));
});

it("rejects an ambiguous organization selection before touching the database", async () => {
  await expect(createSchool({
    schoolName: "École Horizon",
    organizationId,
    organizationName: "Nouvelle organisation",
    curriculumType: "national",
  })).rejects.toThrow("organisation existante");
  expect(mocks.rpc).not.toHaveBeenCalled();
});

it("updates only editable school details through the scoped RPC", async () => {
  await updateSchool({ schoolId, name: "École Nouvelle", city: "Huye", country: "Rwanda" });
  expect(mocks.role).toHaveBeenCalledWith(["platform_admin", "school_admin"]);
  expect(mocks.rpc).toHaveBeenCalledWith("update_school", {
    p_school_id: schoolId,
    p_name: "École Nouvelle",
    p_city: "Huye",
    p_country: "Rwanda",
  });
});

it("creates classes for an explicit school and never assigns a teacher implicitly", async () => {
  mocks.rpc.mockResolvedValue({ data: classId, error: null });
  await createSchoolClass({ schoolId, name: "6e A", gradeLevel: 6, academicYear: "2026–2027" });
  expect(mocks.rpc).toHaveBeenCalledWith("create_school_class", {
    p_school_id: schoolId,
    p_name: "6e A",
    p_grade_level: 6,
    p_academic_year: "2026–2027",
  });
});

it("updates class fields without accepting or sending a school reassignment", async () => {
  mocks.rpc.mockResolvedValue({ data: classId, error: null });
  await updateSchoolClass({
    classId,
    schoolId: "44444444-4444-4444-8444-444444444444",
    name: "6e B",
    gradeLevel: 6,
    academicYear: "2027–2028",
  });
  expect(mocks.rpc).toHaveBeenCalledWith("update_school_class", {
    p_class_id: classId,
    p_name: "6e B",
    p_grade_level: 6,
    p_academic_year: "2027–2028",
  });
  expect(mocks.revalidate).toHaveBeenCalledWith(`/teacher/classes/${classId}`);
});

it("does not report or revalidate a database-denied mutation", async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: { message: "forbidden" } });
  await expect(createSchoolClass({ schoolId, name: "6e A", gradeLevel: 6, academicYear: "2026–2027" })).rejects.toThrow("autorisé");
  expect(mocks.audit).not.toHaveBeenCalled();
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
