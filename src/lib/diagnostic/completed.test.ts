import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadCompletedDiagnostic } from "./completed";

function database(results: Record<string, unknown>) {
  const filters: unknown[][] = [];
  const from = vi.fn((table: string) => {
    const query: Record<string, unknown> = {};
    for (const method of ["select", "eq", "order", "limit", "maybeSingle", "single"]) {
      query[method] = (...args: unknown[]) => { filters.push([table, method, ...args]); return query; };
    }
    query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(results[table]).then(resolve);
    return query;
  });
  return { db: { from } as unknown as SupabaseClient, from, filters };
}

describe("reopening a completed diagnostic", () => {
  it("returns no saved result for an initial student", async () => {
    const { db, from } = database({ diagnostic_runs: { data: null, error: null } });
    expect(await loadCompletedDiagnostic("student", db)).toBeNull();
    expect(from).toHaveBeenCalledTimes(1);
  });
  it("reads the stored report and path without creating a run or recomputing results", async () => {
    const frontier = { report: { mastered: ["node"] }, labels: { node: { key: "reading", label: "Lire" } } };
    const sections = [{ key: "reading_comprehension", probeCount: 12, status: "completed" }];
    const { db, filters } = database({
      diagnostic_runs: { data: { id: "run", is_pilot: false, frontier_report: frontier, coverage_report: { sections } } },
      student_learning_paths: { data: { id: "path", summary: { sectionCounts: { reading_comprehension: 20 } } } },
      student_learning_path_steps: { count: 20, data: [{ node_id: "node", section_key: "reading_comprehension", position: 1, stage: "verification", mastery_snapshot: .4, uncertainty_snapshot: .6, prerequisite_node_ids: [], rationale_fr: "À vérifier" }] },
    });
    const result = await loadCompletedDiagnostic("student", db);
    expect(result).toMatchObject({ frontier, progress: sections, isPilot: false, learningPath: { id: "path", stepCount: 20, firstSteps: [{ nodeId: "node", label: "Lire", position: 1 }] } });
    expect(filters).toContainEqual(["diagnostic_runs", "eq", "student_id", "student"]);
    expect(filters).toContainEqual(["student_learning_paths", "eq", "source_diagnostic_run_id", "run"]);
    expect(filters.every(([, method]) => ["select", "eq", "order", "limit", "single", "maybeSingle"].includes(String(method)))).toBe(true);
  });
  it("does not replace a failed saved-result read with a new assessment", async () => {
    const { db } = database({ diagnostic_runs: { data: null, error: { message: "database unavailable" } } });
    await expect(loadCompletedDiagnostic("student", db)).rejects.toThrow("database unavailable");
  });
});
