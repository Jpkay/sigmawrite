import { beforeEach, describe, expect, it, vi } from "vitest";

const CLASS_ID = "11111111-1111-4111-8111-111111111111";
const SCHOOL_ID = "22222222-2222-4222-8222-222222222222";
const PROFILE_ID = "33333333-3333-4333-8333-333333333333";
const STUDENT_ID = "44444444-4444-4444-8444-444444444444";

const f = vi.hoisted(() => ({
  role: vi.fn(),
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
  provision: vi.fn(),
  deliver: vi.fn(),
  audit: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: f.revalidate }));
vi.mock("@/lib/auth", () => ({ requireRole: f.role }));
vi.mock("@/lib/audit", () => ({ logAudit: f.audit }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: f.createClient,
  createServiceClient: f.createServiceClient,
}));
vi.mock("@/lib/user-provisioning", () => ({
  deliverProvisionedCredentials: f.deliver,
  provisionManagedAccount: f.provision,
  rotateManagedPassword: vi.fn(),
}));

import { createManagedUser } from "./users";

describe("managed student creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    f.role.mockResolvedValue({ id: "platform-admin", role: "platform_admin" });
    f.provision.mockResolvedValue({
      authUserId: "auth-user",
      profileId: PROFILE_ID,
      studentId: STUDENT_ID,
      username: "managed.student",
      temporaryPassword: "temporary-password",
      email: null,
      emailDelivered: false,
    });
    f.deliver.mockResolvedValue(false);
    f.audit.mockResolvedValue(undefined);

    const from = vi.fn((table: string) => {
      if (table === "classes") {
        return {
          select: vi.fn(() => ({
            in: vi.fn().mockResolvedValue({ data: [{ id: CLASS_ID, school_id: SCHOOL_ID }], error: null }),
          })),
        };
      }
      if (table === "enrollments") {
        return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      }
      if (table === "students") {
        return {
          update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });
    f.createServiceClient.mockReturnValue({
      from,
      auth: { admin: { deleteUser: vi.fn() } },
    });
  });

  it("ignores stale birth-date and pilot keys without persisting or enrolling them", async () => {
    const result = await createManagedUser({
      role: "student",
      displayName: "Managed Student",
      email: "",
      username: "",
      grade: 7,
      schoolIds: [],
      classIds: [CLASS_ID],
      teacherIds: [],
      studentIds: [],
      dateOfBirth: "2012-05-10",
      feedbackPilot: {
        agreementSource: "guardian",
        agreementConfirmed: true,
        agreedAt: "2026-09-23T10:00:00.000Z",
        durationDays: 30,
      },
    });

    expect(f.provision).toHaveBeenCalledOnce();
    const provisionInput = f.provision.mock.calls[0][0];
    expect(provisionInput).not.toHaveProperty("dateOfBirth");
    expect(provisionInput).toMatchObject({ role: "student", grade: 7, schoolId: SCHOOL_ID });
    expect(f.createServiceClient.mock.results[0].value.from).not.toHaveBeenCalledWith("diagnostic_pilot_enrollments");
    expect(f.audit).toHaveBeenCalledWith("user.managed_account_created", expect.objectContaining({
      metadata: { role: "student", emailDelivered: false, classCount: 1 },
    }));
    expect(result).not.toHaveProperty("feedbackPilotEnrollment");
  });
});
