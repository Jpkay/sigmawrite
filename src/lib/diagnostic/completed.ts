import type { SupabaseClient } from "@supabase/supabase-js";
import type { DiagnosticLearningPathStep } from "./learning-path";
import type { DiagnosticSectionProgress } from "./protocol";
import type { frontierForStudent } from "./live";
import { DIAGNOSTIC_PROTOCOL_VERSION } from "./protocol";

/** Read the saved result without rerunning finalization or creating another run. */
export async function loadCompletedDiagnostic(studentId: string, db: SupabaseClient) {
  const { data: run, error } = await db.from("diagnostic_runs")
    .select("id,is_pilot,frontier_report,coverage_report")
    .eq("student_id", studentId).eq("status", "completed")
    .eq("protocol_version", DIAGNOSTIC_PROTOCOL_VERSION)
    .order("completed_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  if (!run) return null;
  const { data: path, error: pathError } = await db.from("student_learning_paths")
    .select("id,summary").eq("student_id", studentId)
    .eq("source_diagnostic_run_id", run.id).single();
  if (pathError) throw new Error(pathError.message);
  const { data: steps, count, error: stepsError } = await db.from("student_learning_path_steps")
    .select("node_id,section_key,position,stage,mastery_snapshot,uncertainty_snapshot,prerequisite_node_ids,rationale_fr", { count: "exact" })
    .eq("path_id", path.id).order("position").limit(8);
  if (stepsError) throw new Error(stepsError.message);
  const frontier = run.frontier_report as Awaited<ReturnType<typeof frontierForStudent>>;
  const progress = (run.coverage_report as { sections: DiagnosticSectionProgress[] }).sections;
  if (!frontier?.report || !progress?.length) throw new Error("Résultats enregistrés incomplets.");
  const firstSteps: DiagnosticLearningPathStep[] = (steps ?? []).map((step) => ({
    nodeId: step.node_id, nodeKey: frontier.labels[step.node_id]?.key ?? step.node_id,
    label: frontier.labels[step.node_id]?.label ?? "Compétence à travailler",
    section: step.section_key, position: step.position, stage: step.stage,
    mastery: Number(step.mastery_snapshot), uncertainty: Number(step.uncertainty_snapshot),
    prerequisiteNodeIds: step.prerequisite_node_ids, rationaleFr: step.rationale_fr,
  }));
  return {
    isPilot: Boolean(run.is_pilot), frontier, progress,
    learningPath: { id: path.id as string, stepCount: count ?? 0,
      sectionCounts: (path.summary as { sectionCounts: Record<string, number> }).sectionCounts,
      firstSteps },
  };
}
