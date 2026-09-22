import { Children, isValidElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const f = vi.hoisted(() => ({
  role: vi.fn(),
  createClient: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
  joinCode: vi.fn(),
  panel: vi.fn(() => null),
  notFound: vi.fn((): never => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  }),
}));

vi.mock("next/navigation", () => ({ notFound: f.notFound }));
vi.mock("@/lib/auth", () => ({ requireRole: f.role }));
vi.mock("@/lib/supabase/server", () => ({ createClient: f.createClient }));
vi.mock("@/lib/db/lifecycle", () => ({ getActiveJoinCode: f.joinCode }));
vi.mock("@/components/join-code-panel", () => ({ JoinCodePanel: f.panel }));

import AdminClassInvitationsPage from "./page";

const classId = "14100000-0000-4000-8000-000000000012";
const activeCode = {
  id: "24100000-0000-4000-8000-000000000013",
  code: "SW-EXISTING",
  classId,
  expiresAt: "2026-10-01T00:00:00.000Z",
  maxUses: 30,
  uses: 4,
  schoolConsentEnabled: true,
};

function expectNoClassOrCodeLoad() {
  expect(f.from).not.toHaveBeenCalled();
  expect(f.joinCode).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  f.role.mockResolvedValue({ id: "admin-a", role: "platform_admin" });
  f.createClient.mockResolvedValue({ rpc: f.rpc, from: f.from });
  f.rpc.mockResolvedValue({ data: true, error: null });
  f.from.mockReturnValue({ select: f.select });
  f.select.mockReturnValue({ eq: f.eq });
  f.eq.mockReturnValue({ maybeSingle: f.maybeSingle });
  f.maybeSingle.mockResolvedValue({ data: { id: classId, name: "5e A" }, error: null });
  f.joinCode.mockResolvedValue(activeCode);
});

describe("admin class invitation page", () => {
  it("stops before all database access when the role guard rejects", async () => {
    f.role.mockRejectedValue(new Error("unauthorized"));

    await expect(AdminClassInvitationsPage({ params: Promise.resolve({ classId }) })).rejects.toThrow(
      "unauthorized",
    );

    expect(f.createClient).not.toHaveBeenCalled();
    expect(f.rpc).not.toHaveBeenCalled();
    expectNoClassOrCodeLoad();
  });

  it.each(["platform_admin", "school_admin"] as const)(
    "allows an authorized %s and retains the active code",
    async (role) => {
      f.role.mockResolvedValue({ id: `${role}-a`, role });

      const page = await AdminClassInvitationsPage({ params: Promise.resolve({ classId }) });

      expect(f.role).toHaveBeenCalledWith(["platform_admin", "school_admin"]);
      expect(f.rpc).toHaveBeenCalledWith("can_manage_class_invitations", { p_class_id: classId });
      expect(f.select).toHaveBeenCalledWith("id,name");
      expect(f.joinCode).toHaveBeenCalledWith(classId);
      const panel = Children.toArray(page.props.children).find(
        (child) => isValidElement(child) && child.type === f.panel,
      ) as ReactElement<{ classId: string; initial: typeof activeCode }>;
      expect(panel.props).toEqual({ classId, initial: activeCode });

      const html = renderToStaticMarkup(page);
      expect(html).toContain("5e A");
      expect(html).toContain('href="/admin/schools"');
      expect(html).toContain("Retour aux classes");
    },
  );

  it.each([false, null])("returns not-found when the permission RPC returns %s", async (permission) => {
    f.rpc.mockResolvedValue({ data: permission, error: null });

    await expect(AdminClassInvitationsPage({ params: Promise.resolve({ classId }) })).rejects.toThrow(
      "NEXT_HTTP_ERROR_FALLBACK;404",
    );

    expect(f.notFound).toHaveBeenCalledOnce();
    expectNoClassOrCodeLoad();
  });

  it("returns not-found for a malformed class id before creating a database client", async () => {
    await expect(AdminClassInvitationsPage({ params: Promise.resolve({ classId: "not-a-uuid" }) })).rejects.toThrow(
      "NEXT_HTTP_ERROR_FALLBACK;404",
    );

    expect(f.createClient).not.toHaveBeenCalled();
    expect(f.rpc).not.toHaveBeenCalled();
    expectNoClassOrCodeLoad();
  });

  it("propagates permission-check errors without loading class data or a join code", async () => {
    f.rpc.mockResolvedValue({ data: null, error: { message: "permission database unavailable" } });

    await expect(AdminClassInvitationsPage({ params: Promise.resolve({ classId }) })).rejects.toThrow(
      "permission database unavailable",
    );

    expect(f.notFound).not.toHaveBeenCalled();
    expectNoClassOrCodeLoad();
  });

  it("returns not-found when an authorized class no longer exists", async () => {
    f.maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(AdminClassInvitationsPage({ params: Promise.resolve({ classId }) })).rejects.toThrow(
      "NEXT_HTTP_ERROR_FALLBACK;404",
    );

    expect(f.joinCode).not.toHaveBeenCalled();
  });

  it("propagates unexpected class lookup errors without loading a join code", async () => {
    f.maybeSingle.mockResolvedValue({ data: null, error: { message: "class database unavailable" } });

    await expect(AdminClassInvitationsPage({ params: Promise.resolve({ classId }) })).rejects.toThrow(
      "class database unavailable",
    );

    expect(f.notFound).not.toHaveBeenCalled();
    expect(f.joinCode).not.toHaveBeenCalled();
  });
});
