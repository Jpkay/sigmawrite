import type { SupabaseClient } from "@supabase/supabase-js";
import { PrereqGraph } from "@/lib/graph/traversal";
import type { CompetencyEdge, GoalScope, Strand } from "@/lib/graph/types";
import { buildFrontierReport } from "./report";
import type { DiagEstimate } from "./engine";

export type LiveDiagnosticItem = {
  id: string; nodeId: string; nodeKey: string; nodeLabel: string; promptFr: string;
  instructionsFr: string | null; responseType: string; choices: Array<{ id: string; text: string }>;
};

type GraphData = {
  graph: PrereqGraph;
  nodes: Array<{ id: string; key: string; label: string; strand: Strand }>;
  scope: GoalScope;
  estimates: Map<string, DiagEstimate>;
};

function scopeFrom(value: unknown): GoalScope {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    masteryThreshold: typeof data.mastery_threshold === "number" ? data.mastery_threshold : 0.85,
    strands: Array.isArray(data.strands) ? data.strands.filter((item): item is Strand => typeof item === "string") : undefined,
  };
}

async function loadGraphData(studentId: string, db: SupabaseClient): Promise<GraphData> {
  const [{ data: nodeRows, error: nodeError }, { data: edgeRows, error: edgeError }, { data: estimateRows }, { data: goal }] = await Promise.all([
    db.from("competency_nodes").select("id,key,label_fr,strand").in("review_status", ["auto_approved", "human_approved"]),
    db.from("competency_edges").select("source_node_id,target_node_id,edge_type").eq("edge_type", "prerequisite"),
    db.from("student_competency_estimates").select("node_id,mastery_probability,uncertainty,evidence_count").eq("student_id", studentId),
    db.from("learning_goals").select("scope").eq("student_id", studentId).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (nodeError || edgeError) throw new Error(nodeError?.message ?? edgeError?.message);
  const nodes = (nodeRows ?? []).map((row) => ({ id: row.id as string, key: row.key as string, label: row.label_fr as string, strand: row.strand as Strand }));
  const edges = (edgeRows ?? []).map((row) => ({ sourceNodeId: row.source_node_id as string, targetNodeId: row.target_node_id as string, edgeType: row.edge_type as "prerequisite" })) satisfies CompetencyEdge[];
  const estimates = new Map((estimateRows ?? []).map((row) => [row.node_id as string, {
    masteryProbability: Number(row.mastery_probability), uncertainty: Number(row.uncertainty), evidenceCount: row.evidence_count as number, presumed: false,
  }]));
  return { graph: new PrereqGraph(nodes.map((node) => node.id), edges), nodes, scope: scopeFrom(goal?.scope), estimates };
}

export async function nextDiagnosticItem(studentId: string, runId: string, db: SupabaseClient): Promise<LiveDiagnosticItem | null> {
  const { data, error } = await db.rpc("next_diagnostic_item", {
    p_student_id: studentId,
    p_run_id: runId,
  });
  if (error) throw new Error(error.message);
  if (!data) return null;
  return data as LiveDiagnosticItem;
}

export async function frontierForStudent(studentId: string, db: SupabaseClient) {
  const data = await loadGraphData(studentId, db);
  const strandById = new Map(data.nodes.map((node) => [node.id, node.strand]));
  const report = buildFrontierReport(data.graph, data.estimates, data.scope, (id) => strandById.get(id));
  const labels = Object.fromEntries(data.nodes.map((node) => [node.id, { key: node.key, label: node.label }]));
  return { report, labels, scope: data.scope };
}
