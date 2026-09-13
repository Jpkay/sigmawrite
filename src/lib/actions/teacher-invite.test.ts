import { beforeEach, describe, expect, it, vi } from "vitest";

const f = vi.hoisted(() => ({
  guard: vi.fn(),
  rpc: vi.fn(),
  audit: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: f.revalidate }));
vi.mock("@/lib/auth", () => ({ requireRole: f.guard }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc: f.rpc }),
  createServiceClient: () => ({}),
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
    f.rpc.mockResolvedValue({ data: [created], error: null });
  });

  it("allows the bounded teacher and school-admin boundary to delegate one atomic rotation", async () => {
    await expect(inviteStudents({ classId, expiresInDays: 14, maxUses: 40 })).resolves.toMatchObject({
      code: created.code,
      expiresAt: created.expires_at,
      maxUses: 40,
      uses: 0,
    });

    expect(f.guard).toHaveBeenCalledWith(["teacher", "school_admin"]);
    expect(f.rpc).toHaveBeenCalledWith("rotate_class_join_code", {
      p_class_id: classId,
      p_expires_in_days: 14,
      p_max_uses: 40,
    });
    expect(f.revalidate).toHaveBeenCalledWith(`/teacher/classes/${classId}`);
  });

  it("rejects invalid limits before touching the rotation RPC", async () => {
    await expect(inviteStudents({ classId, expiresInDays: 0, maxUses: 40 })).rejects.toThrow("Paramètres du code invalides");
    expect(f.rpc).not.toHaveBeenCalled();
  });

  it("turns a database scope rejection into an actionable error", async () => {
    f.rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "forbidden" } });
    await expect(inviteStudents({ classId, expiresInDays: 14, maxUses: 40 })).rejects.toThrow("autorisation de gérer les invitations");
    expect(f.audit).not.toHaveBeenCalled();
  });
});
