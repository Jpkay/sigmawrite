import type { SupabaseClient } from "@supabase/supabase-js";
import { PrereqGraph } from "@/lib/graph/traversal";
import type { CompetencyEdge, GoalScope, Strand } from "@/lib/graph/types";
import { buildFrontierReport } from "./report";
import type { DiagEstimate } from "./engine";
import {
  DIAGNOSTIC_STRANDS,
  type DiagnosticSectionKey,
} from "./protocol";
import { mergeDiagnosticHistorySnapshots } from "./history";
import type { DiagnosticDifficultyTier, DiagnosticEvidenceExpectation } from "./item-bank";
import {
  buildDiagnosticEvidenceProfile,
  type DiagnosticEvidenceProfileRow,
} from "./evidence-profile";
import {
  buildStudentGraphView,
  type StudentGraphEdgeInput,
  type StudentGraphPathInput,
} from "@/lib/graph/presentation";

export type LiveDiagnosticItem = {
  id: string; nodeId: string; nodeKey: string; nodeLabel: string; promptFr: string;
  instructionsFr: string | null; responseType: string; choices: Array<{ id: string; text: string }>;
  strand: Strand; sectionKey: DiagnosticSectionKey; informationGain: number;
  masteryEvidenceId: string;
  evidenceExpectation: DiagnosticEvidenceExpectation;
  promptFamily: string;
  difficultyTier: DiagnosticDifficultyTier;
  runItemId?: string;
};

type GraphData = {
  graph: PrereqGraph;
  nodes: Array<{ id: string; key: string; label: string; strand: Strand }>;
  edges: StudentGraphEdgeInput[];
  scope: GoalScope;
  estimates: Map<string, DiagEstimate>;
  releaseId: string | null;
  runId: string | null;
};

function scopeFrom(value: unknown): GoalScope {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    masteryThreshold: typeof data.mastery_threshold === "number" ? data.mastery_threshold : 0.85,
    strands: Array.isArray(data.strands) ? data.strands.filter((item): item is Strand => typeof item === "string") : undefined,
  };
}

async function loadGraphData(
  studentId: string,
  db: SupabaseClient,
  options: { releaseId?: string | null; runId?: string | null } = {},
): Promise<GraphData> {
  let releaseId = options.releaseId;
  let runId = options.runId;
  let protocolVersion: string | null = null;
  let priorStateSnapshot: unknown;
  if (runId) {
    const { data: selectedRun, error: selectedRunError } = await db.from("diagnostic_runs")
      .select("taxonomy_release_id,protocol_version,prior_state_snapshot")
      .eq("id", runId)
      .eq("student_id", studentId)
      .maybeSingle();
    if (selectedRunError) throw new Error(selectedRunError.message);
    if (releaseId === undefined) releaseId = selectedRun?.taxonomy_release_id as string | null | undefined;
    protocolVersion = selectedRun?.protocol_version as string | null ?? null;
    priorStateSnapshot = selectedRun?.prior_state_snapshot;
  } else if (releaseId === undefined) {
    const { data: latest } = await db.from("diagnostic_runs")
      .select("id,taxonomy_release_id,protocol_version,prior_state_snapshot")
      .eq("student_id", studentId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    releaseId = latest?.taxonomy_release_id as string | null | undefined;
    runId = latest?.id as string | null | undefined;
    protocolVersion = latest?.protocol_version as string | null ?? null;
    priorStateSnapshot = latest?.prior_state_snapshot;
  }
  let releaseNodeIds: string[] | null = null;
  let releaseEdgeSnapshots: Array<Record<string, unknown>> | null = null;
  if (releaseId) {
    const { data: memberships, error: membershipError } = await db.from("taxonomy_release_memberships")
      .select("record_id,record_type,record_snapshot")
      .eq("release_id", releaseId)
      .in("record_type", ["competency_node", "competency_edge"]);
    if (membershipError) throw new Error(membershipError.message);
    releaseNodeIds = (memberships ?? [])
      .filter((row) => row.record_type === "competency_node")
      .map((row) => row.record_id as string);
    releaseEdgeSnapshots = (memberships ?? [])
      .filter((row) => row.record_type === "competency_edge")
      .map((row) => row.record_snapshot as Record<string, unknown>);
  }
  if (runId) {
    const { data: targets, error: targetError } = await db.from("diagnostic_run_targets")
      .select("node_id")
      .eq("run_id", runId);
    if (targetError) throw new Error(targetError.message);
    const targetNodeIds = new Set((targets ?? []).map((row) => row.node_id as string));
    if (targetNodeIds.size) {
      releaseNodeIds = releaseNodeIds
        ? releaseNodeIds.filter((nodeId) => targetNodeIds.has(nodeId))
        : [...targetNodeIds];
    }
  }
  let nodeQuery = db.from("competency_nodes").select("id,key,label_fr,strand")
    .in("review_status", ["auto_approved", "human_approved"]);
  if (releaseNodeIds) {
    if (!releaseNodeIds.length) throw new Error("La version de la taxonomie ne contient aucun nœud.");
    nodeQuery = nodeQuery.in("id", releaseNodeIds);
  }
  const [{ data: nodeRows, error: nodeError }, { data: edgeRows, error: edgeError }, { data: goal }] = await Promise.all([
    nodeQuery,
    db.from("competency_edges").select("source_node_id,target_node_id,edge_type,prerequisite_class,rationale").eq("edge_type", "prerequisite"),
    db.from("learning_goals").select("scope").eq("student_id", studentId).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (nodeError || edgeError) throw new Error(nodeError?.message ?? edgeError?.message);
  const nodes = (nodeRows ?? []).map((row) => ({ id: row.id as string, key: row.key as string, label: row.label_fr as string, strand: row.strand as Strand }));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const nodeIdByKey = new Map(nodes.map((node) => [node.key, node.id]));
  const edges = releaseEdgeSnapshots
    ? releaseEdgeSnapshots.flatMap((snapshot) => {
        const sourceNodeId = typeof snapshot.source === "string"
          ? nodeIdByKey.get(snapshot.source)
          : undefined;
        const targetNodeId = typeof snapshot.target === "string"
          ? nodeIdByKey.get(snapshot.target)
          : undefined;
        return snapshot.type === "prerequisite" && sourceNodeId && targetNodeId
          ? [{
              sourceNodeId,
              targetNodeId,
              edgeType: "prerequisite" as const,
              prerequisiteClass: snapshot.prerequisiteClass === "hard" || snapshot.prerequisiteClass === "soft"
                ? snapshot.prerequisiteClass
                : null,
              rationale: typeof snapshot.rationale === "string" ? snapshot.rationale : null,
            }]
          : [];
      }) satisfies StudentGraphEdgeInput[]
    : (edgeRows ?? [])
      .filter((row) => nodeIds.has(row.source_node_id as string) && nodeIds.has(row.target_node_id as string))
      .map((row) => ({
        sourceNodeId: row.source_node_id as string,
        targetNodeId: row.target_node_id as string,
        edgeType: row.edge_type as "prerequisite",
        prerequisiteClass: row.prerequisite_class as "hard" | "soft" | null,
        rationale: row.rationale as string | null,
      })) satisfies StudentGraphEdgeInput[];
  let estimates: Map<string, DiagEstimate>;
  if (runId) {
    const { data: resultRows, error: resultError } = await db.from("diagnostic_node_results")
      .select("node_id,mastery_probability,uncertainty,direct_evidence_count,evidence_coverage_confirmed,evidence_kind,classification")
      .eq("run_id", runId);
    if (resultError) throw new Error(resultError.message);
    const snapshots = mergeDiagnosticHistorySnapshots(
      priorStateSnapshot,
      (resultRows ?? []) as Record<string, unknown>[],
      {
        taxonomyReleaseId: releaseId ?? "",
        protocolVersion: protocolVersion ?? "",
      },
    );
    estimates = new Map([...snapshots]
      .filter(([nodeId]) => nodeIds.has(nodeId))
      .map(([nodeId, estimate]) => [nodeId, {
        masteryProbability: estimate.masteryProbability,
        uncertainty: estimate.uncertainty,
        evidenceCount: estimate.directEvidenceCount,
        evidenceCoverageConfirmed: estimate.evidenceCoverageConfirmed,
        presumed: estimate.evidenceKind === "inferred_prerequisite",
        classification: estimate.classification,
      }]));
  } else {
    const { data: estimateRows, error: estimateError } = await db.from("student_competency_estimates")
      .select("node_id,mastery_probability,uncertainty,evidence_count,estimate_source")
      .eq("student_id", studentId);
    if (estimateError) throw new Error(estimateError.message);
    estimates = new Map((estimateRows ?? []).map((row) => [row.node_id as string, {
      masteryProbability: Number(row.mastery_probability),
      uncertainty: Number(row.uncertainty),
      evidenceCount: Number(row.evidence_count),
      evidenceCoverageConfirmed: false,
      presumed: false,
    }]));
  }
  const scope = scopeFrom(goal?.scope);
  if (releaseId) scope.strands = DIAGNOSTIC_STRANDS;
  return {
    graph: new PrereqGraph(nodes.map((node) => node.id), edges as CompetencyEdge[]),
    nodes,
    edges,
    scope,
    estimates,
    releaseId: releaseId ?? null,
    runId: runId ?? null,
  };
}

export async function nextDiagnosticItem(
  studentId: string,
  runId: string,
  sectionKey: DiagnosticSectionKey,
  db: SupabaseClient,
): Promise<LiveDiagnosticItem | null> {
  const { data: run, error: runError } = await db.from("diagnostic_runs")
    .select("is_pilot")
    .eq("id", runId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (runError) throw new Error(runError.message);
  const rpc = run?.is_pilot
    ? "next_pilot_section_diagnostic_item"
    : "next_section_diagnostic_item";
  const { data, error } = await db.rpc(rpc, {
    p_student_id: studentId,
    p_run_id: runId,
    p_section_key: sectionKey,
  });
  if (error) throw new Error(error.message);
  if (!data) return null;
  return data as LiveDiagnosticItem;
}

export async function diagnosticRequirement(studentId: string, db: SupabaseClient) {
  const { data, error } = await db.rpc("student_diagnostic_requirement", { p_student_id: studentId });
  if (error) throw new Error(error.message);
  return data as { required: boolean; kind: "initial" | "reentry" | "calibration"; reason: string; targetNodeIds: string[] };
}

export async function frontierForStudent(
  studentId: string,
  db: SupabaseClient,
  options: { releaseId?: string | null; runId?: string | null } = {},
) {
  const data = await loadGraphData(studentId, db, options);
  const strandById = new Map(data.nodes.map((node) => [node.id, node.strand]));
  const report = buildFrontierReport(data.graph, data.estimates, data.scope, (id) => strandById.get(id));
  const labels = Object.fromEntries(data.nodes.map((node) => [node.id, { key: node.key, label: node.label }]));
  let evidenceProfile: DiagnosticEvidenceProfileRow[] = [];
  let pathSteps: StudentGraphPathInput[] = [];
  let activePathQuery = db.from("student_learning_paths")
    .select("id")
    .eq("student_id", studentId)
    .eq("status", "active");
  if (data.releaseId) activePathQuery = activePathQuery.eq("taxonomy_release_id", data.releaseId);
  const { data: activePath, error: activePathError } = await activePathQuery
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (activePathError) throw new Error(activePathError.message);
  if (activePath) {
    const { data: stepRows, error: stepError } = await db.from("student_learning_path_steps")
      .select("node_id,position,stage,status,rationale_fr,required_evidence_expectation")
      .eq("path_id", activePath.id)
      .order("position");
    if (stepError) throw new Error(stepError.message);
    pathSteps = (stepRows ?? []).map((step) => ({
      nodeId: step.node_id as string,
      position: Number(step.position),
      stage: step.stage as StudentGraphPathInput["stage"],
      status: step.status as StudentGraphPathInput["status"],
      rationaleFr: step.rationale_fr as string,
      requiredEvidenceExpectation: step.required_evidence_expectation as StudentGraphPathInput["requiredEvidenceExpectation"],
    }));
  }
  if (data.runId && data.releaseId) {
    const [{ data: evidenceMemberships, error: evidenceMembershipError }, { data: evidenceResults, error: evidenceResultError }] = await Promise.all([
      db.from("taxonomy_release_memberships")
        .select("record_id,stable_key,record_snapshot")
        .eq("release_id", data.releaseId)
        .eq("record_type", "mastery_evidence"),
      db.from("diagnostic_node_evidence_results")
        .select("node_id,mastery_evidence_id,classification,mastery_probability,observed_accuracy,distinct_item_count,occasion_count")
        .eq("run_id", data.runId),
    ]);
    if (evidenceMembershipError || evidenceResultError) {
      throw new Error(evidenceMembershipError?.message ?? evidenceResultError?.message);
    }
    evidenceProfile = buildDiagnosticEvidenceProfile({
      nodes: data.nodes.map((node) => ({ id: node.id, key: node.key })),
      memberships: (evidenceMemberships ?? []).map((membership) => ({
        recordId: membership.record_id as string,
        stableKey: membership.stable_key as string,
        snapshot: membership.record_snapshot as Record<string, unknown>,
      })),
      results: (evidenceResults ?? []).map((result) => ({
        nodeId: result.node_id as string,
        evidenceId: result.mastery_evidence_id as string,
        classification: result.classification as "mastered" | "fragile" | "missing",
        masteryProbability: Number(result.mastery_probability),
        observedAccuracy: Number(result.observed_accuracy),
        distinctItemCount: Number(result.distinct_item_count),
        occasionCount: Number(result.occasion_count),
      })),
    });
  }
  const graphView = buildStudentGraphView({
    releaseId: data.releaseId,
    runId: data.runId,
    nodes: data.nodes,
    edges: data.edges,
    estimates: data.estimates,
    report,
    pathSteps,
  });
  return { report, labels, scope: data.scope, evidenceProfile, graphView };
}
