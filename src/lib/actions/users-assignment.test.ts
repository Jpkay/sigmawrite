import { beforeEach, describe, expect, it, vi } from "vitest";

const f = vi.hoisted(() => ({
  role: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  service: vi.fn(),
  rotatePassword: vi.fn(),
  audit: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: f.revalidate }));
vi.mock("@/lib/auth", () => ({ requireRole: f.role }));
vi.mock("@/lib/audit", () => ({ logAudit: f.audit }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc: f.rpc, from: f.from }),
  createServiceClient: f.service,
}));
vi.mock("@/lib/user-provisioning", () => ({
  deliverProvisionedCredentials: vi.fn(),
  provisionManagedAccount: vi.fn(),
  rotateManagedPassword: f.rotatePassword,
}));
vi.mock("@/lib/diagnostic/pilot-enrollment", () => ({ createDiagnosticPilotEnrollment: vi.fn() }));

import { assignStudentAccess, resetManagedUserPassword, setTeacherStudent } from "./users";

const STUDENT_ID = "11111111-1111-4111-8111-111111111111";
const CLASS_ID = "22222222-2222-4222-8222-222222222222";
const TEACHER_ID = "33333333-3333-4333-8333-333333333333";

describe("teacher assignment actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    f.role.mockResolvedValue({ id: "admin", role: "school_admin" });
    f.rpc.mockResolvedValue({ data: true, error: null });
    f.audit.mockResolvedValue(undefined);
  });

  it("uses the atomic authenticated class-assignment RPC without a service client", async () => {
    await assignStudentAccess({ studentId: STUDENT_ID, classId: CLASS_ID, teacherProfileId: null });

    expect(f.rpc).toHaveBeenCalledWith("assign_student_class", {
      p_student_id: STUDENT_ID,
      p_class_id: CLASS_ID,
      p_teacher_profile_id: null,
    });
    expect(f.service).not.toHaveBeenCalled();
  });

  it("keeps a direct student link as a separate authenticated RPC", async () => {
    await setTeacherStudent({ teacherProfileId: TEACHER_ID, studentId: STUDENT_ID, assigned: false });

    expect(f.rpc).toHaveBeenCalledWith("set_teacher_student", {
      p_teacher_profile_id: TEACHER_ID,
      p_student_id: STUDENT_ID,
      p_assigned: false,
    });
    expect(f.service).not.toHaveBeenCalled();
  });

  it("blocks a hidden profile before password rotation or service access", async () => {
    const maybeSingle = vi.fn()
      .mockResolvedValueOnce({ data: { school_id: "44444444-4444-4444-8444-444444444444" }, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    f.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      })),
    });

    await expect(resetManagedUserPassword({ profileId: STUDENT_ID })).rejects.toThrow("Ce compte n’appartient pas à votre école.");
    expect(f.rotatePassword).not.toHaveBeenCalled();
    expect(f.service).not.toHaveBeenCalled();
  });
});
