import { beforeEach, describe, expect, it, vi } from "vitest";

const f = vi.hoisted(() => ({
  service: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createServiceClient: f.service }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));

import { ManagedAccountEmailInUseError, provisionManagedAccount } from "./user-provisioning";

describe("managed account provisioning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    f.createUser.mockResolvedValue({
      data: { user: null },
      error: { code: "email_exists", status: 422, message: "A user with this email address has already been registered" },
    });
    f.service.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        })),
      })),
      auth: { admin: { createUser: f.createUser } },
    });
  });

  it("maps Supabase's duplicate-email code to a safe, actionable error", async () => {
    await expect(provisionManagedAccount({
      role: "student",
      displayName: "Managed Student",
      requestedUsername: "managed.student",
      email: "already@example.test",
      grade: 7,
      provisionedByProfileId: "admin",
    })).rejects.toBeInstanceOf(ManagedAccountEmailInUseError);
    expect(f.createUser).toHaveBeenCalledOnce();
  });
});
