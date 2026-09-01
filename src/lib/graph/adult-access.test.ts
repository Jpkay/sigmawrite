import { describe, expect, it, vi } from "vitest";
import { loadAdultStudentGraphWith } from "./adult-access-policy";
import type { SessionProfile } from "@/lib/auth";
import type { StudentRow } from "@/lib/reports";

const profile = (role: SessionProfile["role"]): SessionProfile => ({ id: "profile", authUserId: "auth", displayName: "Adult", role, mustChangePassword: false });
const student: StudentRow = { id: "visible-student", name: "Élève", snap: { sessions: [], skillEstimates: {} } };
const frontier = { report: {}, labels: {}, scope: {}, evidenceProfile: [], graphView: {} } as never;

describe("adult graph access", () => {
  it("requires the parent role before looking up a child", async () => {
    const guard = vi.fn(async () => profile("parent"));
    const findViewableStudent = vi.fn(async () => student);
    const loadGraph = vi.fn(async () => frontier);
    await loadAdultStudentGraphWith("requested", "parent", { guard, findViewableStudent, loadGraph });
    expect(guard).toHaveBeenCalledWith(["parent"]);
  });

  it("allows teacher, supervisor, and school-admin roles for the teacher view", async () => {
    const guard = vi.fn(async () => profile("teacher"));
    await loadAdultStudentGraphWith("requested", "teacher", {
      guard,
      findViewableStudent: async () => student,
      loadGraph: async () => frontier,
    });
    expect(guard).toHaveBeenCalledWith(["teacher", "supervisor", "school_admin"]);
  });

  it("allows a supervisor to load a student returned by the scoped lookup", async () => {
    const guard = vi.fn(async () => profile("supervisor"));
    const result = await loadAdultStudentGraphWith("requested", "teacher", {
      guard,
      findViewableStudent: async () => student,
      loadGraph: async () => ({ ok: true }),
    });
    expect(guard).toHaveBeenCalledWith(["teacher", "supervisor", "school_admin"]);
    expect(result?.student.id).toBe("visible-student");
  });

  it("never loads graph data when the RLS-scoped student lookup is hidden", async () => {
    const loadGraph = vi.fn(async () => frontier);
    const result = await loadAdultStudentGraphWith("hidden-student", "parent", {
      guard: async () => profile("parent"),
      findViewableStudent: async () => null,
      loadGraph,
    });
    expect(result).toBeNull();
    expect(loadGraph).not.toHaveBeenCalled();
  });

  it("loads the graph only for the exact student returned by the scoped lookup", async () => {
    const loadGraph = vi.fn(async () => frontier);
    const result = await loadAdultStudentGraphWith("requested-alias", "teacher", {
      guard: async () => profile("teacher"),
      findViewableStudent: async () => student,
      loadGraph,
    });
    expect(loadGraph).toHaveBeenCalledWith("visible-student");
    expect(result?.student).toBe(student);
  });
});
