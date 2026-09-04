import type { SupabaseClient } from "@supabase/supabase-js";

export type CurriculumTag = { framework: "cycle3" | "cycle4" | "eval6e" | "brevet"; code: string; labelFr: string };

export const FRAMEWORK_LABELS: Record<CurriculumTag["framework"], string> = {
  cycle3: "Cycle 3",
  cycle4: "Cycle 4",
  eval6e: "Évaluation 6e",
  brevet: "Brevet",
};

/** Programme tags for one or more node keys (roadmap 4.2). */
export async function curriculumTagsFor(db: SupabaseClient, nodeKeys: string[]): Promise<Map<string, CurriculumTag[]>> {
  const out = new Map<string, CurriculumTag[]>();
  if (nodeKeys.length === 0) return out;
  const { data } = await db.from("curriculum_mappings").select("node_key,framework,code,label_fr").in("node_key", nodeKeys).order("framework");
  for (const row of data ?? []) {
    const list = out.get(row.node_key as string) ?? [];
    list.push({ framework: row.framework as CurriculumTag["framework"], code: row.code as string, labelFr: row.label_fr as string });
    out.set(row.node_key as string, list);
  }
  return out;
}

export type CurriculumCoverageRow = { framework: CurriculumTag["framework"]; code: string; labelFr: string; mastered: number; inProgress: number };

/** Programme attendus covered by a student's mastered and in-progress nodes (roadmap 4.2). */
export async function curriculumCoverage(db: SupabaseClient, studentId: string): Promise<CurriculumCoverageRow[]> {
  const { data: estimates } = await db.from("student_competency_estimates").select("mastery_probability,competency_nodes!inner(key)").eq("student_id", studentId).gt("evidence_count", 0);
  const rows = (estimates ?? []).map((row) => ({ key: (row.competency_nodes as unknown as { key: string }).key, mastered: Number(row.mastery_probability) >= 0.85 }));
  const tags = await curriculumTagsFor(db, rows.map((row) => row.key));
  const coverage = new Map<string, CurriculumCoverageRow>();
  for (const row of rows) for (const tag of tags.get(row.key) ?? []) {
    if (tag.framework === "brevet") continue;
    const id = `${tag.framework}:${tag.code}`;
    const entry = coverage.get(id) ?? { framework: tag.framework, code: tag.code, labelFr: tag.labelFr, mastered: 0, inProgress: 0 };
    if (row.mastered) entry.mastered++; else entry.inProgress++;
    coverage.set(id, entry);
  }
  return [...coverage.values()].sort((a, b) => a.framework.localeCompare(b.framework) || b.mastered - a.mastered);
}
