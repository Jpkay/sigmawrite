import { beforeEach, describe, expect, it, vi } from "vitest";

const f = vi.hoisted(() => ({
  guard: vi.fn(),
  client: vi.fn(),
  serviceClient: vi.fn(),
  rpc: vi.fn(),
  audit: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: f.revalidate }));
vi.mock("@/lib/auth", () => ({ requireRole: f.guard }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: f.client,
  createServiceClient: f.serviceClient,
}));
vi.mock("@/lib/safety/moderate-input", () => ({ moderateStudentText: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: f.audit }));
vi.mock("@/lib/analytics-server", () => ({ trackServer: vi.fn() }));

import { inviteStudents } from "./teacher";

const classId = "12600000-0000-4000-8000-000000000001";
const created = {
  id: "12600000-0000-4000-8000-000000000002",
  code: "SW-A1B2C3D4E5F60718293A4B5C6D7E8F90",
  class_id: classId,
  expires_at: "2026-09-27T12:00:00.000Z",
  max_uses: 40,
  uses: 0,
  school_consent_enabled: true,
};

describe("inviteStudents", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    f.guard.mockResolvedValue({ id: "admin-profile", role: "school_admin" });
    f.client.mockResolvedValue({ rpc: f.rpc });
    f.serviceClient.mockReturnValue({});
    f.rpc.mockResolvedValue({ data: [created], error: null });
  });

  it.each(["teacher", "school_admin", "platform_admin"])(
    "allows %s to delegate one authenticated atomic rotation",
    async (role) => {
      f.guard.mockResolvedValue({ id: `${role}-profile`, role });

      await expect(inviteStudents({ classId, expiresInDays: 14, maxUses: 40 })).resolves.toEqual({
        id: created.id,
        code: created.code,
        expiresAt: created.expires_at,
        maxUses: created.max_uses,
        uses: created.uses,
        schoolConsentEnabled: created.school_consent_enabled,
      });

      expect(f.guard).toHaveBeenCalledOnce();
      expect(f.guard).toHaveBeenCalledWith(["teacher", "school_admin", "platform_admin"]);
      expect(f.client).toHaveBeenCalledOnce();
      expect(f.serviceClient).not.toHaveBeenCalled();
      expect(f.rpc).toHaveBeenCalledOnce();
      expect(f.rpc).toHaveBeenCalledWith("rotate_class_join_code", {
        p_class_id: classId,
        p_expires_in_days: 14,
        p_max_uses: 40,
      });
      expect(f.audit).toHaveBeenCalledOnce();
      expect(f.audit).toHaveBeenCalledWith("class.join_code_rotated", {
        targetType: "class",
        targetId: classId,
        metadata: {
          expiresAt: created.expires_at,
          maxUses: 40,
          accessBasis: "school_invitation",
          createdByRole: role,
        },
      });
      expect(f.revalidate.mock.calls).toEqual([
        [`/teacher/classes/${classId}`],
        [`/admin/schools/classes/${classId}/invitations`],
      ]);
    },
  );

  it("stops when the role guard rejects, before calling the rotation RPC", async () => {
    f.guard.mockRejectedValue(new Error("Accès refusé"));

    await expect(inviteStudents({ classId, expiresInDays: 14, maxUses: 40 })).rejects.toThrow("Accès refusé");

    expect(f.guard).toHaveBeenCalledWith(["teacher", "school_admin", "platform_admin"]);
    expect(f.client).not.toHaveBeenCalled();
    expect(f.rpc).not.toHaveBeenCalled();
    expect(f.audit).not.toHaveBeenCalled();
    expect(f.revalidate).not.toHaveBeenCalled();
  });

  it("does not audit or revalidate a backend denial for a foreign class scope", async () => {
    f.rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "forbidden" } });

    await expect(inviteStudents({ classId, expiresInDays: 14, maxUses: 40 })).rejects.toThrow("autorisation de gérer les invitations");

    expect(f.rpc).toHaveBeenCalledOnce();
    expect(f.audit).not.toHaveBeenCalled();
    expect(f.revalidate).not.toHaveBeenCalled();
  });

  it.each([
    { classId: "not-a-uuid", expiresInDays: 14, maxUses: 40 },
    { classId, expiresInDays: 0, maxUses: 40 },
    { classId, expiresInDays: 91, maxUses: 40 },
    { classId, expiresInDays: 14, maxUses: 0 },
    { classId, expiresInDays: 14, maxUses: 501 },
  ])("rejects invalid invitation input before touching the authenticated client", async (input) => {
    await expect(inviteStudents(input)).rejects.toThrow("Paramètres du code invalides");

    expect(f.client).not.toHaveBeenCalled();
    expect(f.rpc).not.toHaveBeenCalled();
    expect(f.audit).not.toHaveBeenCalled();
    expect(f.revalidate).not.toHaveBeenCalled();
  });
});
