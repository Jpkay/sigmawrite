import { beforeEach, describe, expect, it, vi } from "vitest";

const f = vi.hoisted(() => ({
  role: vi.fn(),
  createClient: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
  notFound: vi.fn((): never => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  }),
  goal: vi.fn(),
  league: vi.fn(),
  students: vi.fn(),
  joinCode: vi.fn(),
  managedAccounts: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: f.notFound }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ requireRole: f.role }));
vi.mock("@/lib/supabase/server", () => ({ createClient: f.createClient }));
vi.mock("@/lib/actions/teacher", () => ({ loadClassGoal: f.goal, loadClassLeague: f.league }));
vi.mock("@/lib/db/dashboard", () => ({ getClassStudents: f.students }));
vi.mock("@/lib/db/lifecycle", () => ({ getActiveJoinCode: f.joinCode }));
vi.mock("@/lib/db/users", () => ({ getClassManagedAccounts: f.managedAccounts }));

import ClassDetailPage from "./page";

const classId = "14100000-0000-0000-0000-000000000012";

function exposeClass() {
  f.maybeSingle.mockResolvedValue({ data: { id: classId }, error: null });
}

function hideClass() {
  f.maybeSingle.mockResolvedValue({ data: null, error: null });
}

function expectNoClassLoaders() {
  expect(f.goal).not.toHaveBeenCalled();
  expect(f.league).not.toHaveBeenCalled();
  expect(f.students).not.toHaveBeenCalled();
  expect(f.joinCode).not.toHaveBeenCalled();
  expect(f.managedAccounts).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  f.role.mockResolvedValue({ id: "teacher-a", role: "teacher" });
  f.createClient.mockResolvedValue({ from: f.from });
  f.from.mockReturnValue({ select: f.select });
  f.select.mockReturnValue({ eq: f.eq });
  f.eq.mockReturnValue({ maybeSingle: f.maybeSingle });
  f.goal.mockResolvedValue(null);
  f.league.mockResolvedValue(null);
  f.students.mockResolvedValue([]);
  f.joinCode.mockResolvedValue(null);
  f.managedAccounts.mockResolvedValue([]);
});

describe("teacher class-detail access gate", () => {
  it("allows an assigned teacher before loading class data and actions", async () => {
    exposeClass();

    await ClassDetailPage({ params: Promise.resolve({ classId }) });

    expect(f.role).toHaveBeenCalledWith(["teacher", "school_admin"]);
    expect(f.from).toHaveBeenCalledTimes(1);
    expect(f.from).toHaveBeenCalledWith("classes");
    expect(f.select).toHaveBeenCalledWith("id");
    expect(f.eq).toHaveBeenCalledWith("id", classId);
    expect(f.maybeSingle.mock.invocationCallOrder[0]).toBeLessThan(f.goal.mock.invocationCallOrder[0]);
    expect(f.maybeSingle.mock.invocationCallOrder[0]).toBeLessThan(f.league.mock.invocationCallOrder[0]);
    expect(f.maybeSingle.mock.invocationCallOrder[0]).toBeLessThan(f.students.mock.invocationCallOrder[0]);
    expect(f.maybeSingle.mock.invocationCallOrder[0]).toBeLessThan(f.joinCode.mock.invocationCallOrder[0]);
    expect(f.maybeSingle.mock.invocationCallOrder[0]).toBeLessThan(f.managedAccounts.mock.invocationCallOrder[0]);
  });

  it("allows a school administrator when the class is visible in their school scope", async () => {
    f.role.mockResolvedValue({ id: "admin-a", role: "school_admin" });
    exposeClass();

    await ClassDetailPage({ params: Promise.resolve({ classId }) });

    expect(f.students).toHaveBeenCalledWith(classId);
    expect(f.joinCode).toHaveBeenCalledWith(classId);
    expect(f.managedAccounts).toHaveBeenCalledWith(classId);
  });

  it.each([
    "a teacher with only a direct grant to one student in the class",
    "an unassigned teacher in the same school",
    "a teacher from another school",
    "an unknown class",
  ])("renders the non-disclosing not-found boundary for %s", async () => {
    hideClass();

    await expect(ClassDetailPage({ params: Promise.resolve({ classId }) })).rejects.toThrow(
      "NEXT_HTTP_ERROR_FALLBACK;404",
    );

    expect(f.notFound).toHaveBeenCalledOnce();
    expectNoClassLoaders();
  });

  it("propagates an access-check infrastructure error without converting it to not-found", async () => {
    f.maybeSingle.mockResolvedValue({ data: null, error: { message: "class lookup unavailable" } });

    await expect(ClassDetailPage({ params: Promise.resolve({ classId }) })).rejects.toThrow(
      "class lookup unavailable",
    );

    expect(f.notFound).not.toHaveBeenCalled();
    expectNoClassLoaders();
  });

  it("does not swallow unexpected class-loader failures after access is granted", async () => {
    exposeClass();
    f.goal.mockRejectedValue(new Error("goal database unavailable"));

    await expect(ClassDetailPage({ params: Promise.resolve({ classId }) })).rejects.toThrow(
      "goal database unavailable",
    );
  });
});
