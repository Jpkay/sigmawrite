import { PrereqGraph } from "./traversal";
import type { CompetencyEdge, Strand } from "./types";

export type AdminGraphRelease = {
  id: string;
  key: string;
  version: string;
  status: "draft" | "validating" | "published" | "withdrawn";
  checksum: string | null;
  createdAt: string;
  publishedAt: string | null;
};

export type AdminGraphNode = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  strand: Strand;
  nodeType: string;
  atomicityLevel: number | null;
  evidenceCount: number;
  sourceKeys: string[];
  reviewStatus: string | null;
  generationType: string | null;
  recordVersion: number;
  recordChecksum: string;
};

export type AdminGraphEdge = {
  id: string;
  sourceNodeId: string | null;
  targetNodeId: string | null;
  sourceKey: string;
  targetKey: string;
  edgeType: string;
  prerequisiteClass: "hard" | "soft" | "unknown";
  rationale: string | null;
  reviewStatus: string | null;
  recordVersion: number;
  recordChecksum: string;
};

export type AdminGraphWarning = {
  id: string;
  code: "cycle" | "dangling_edge" | "orphan_node" | "missing_evidence" | "unknown_prerequisite_class";
  severity: "error" | "warning";
  message: string;
  nodeIds: string[];
  edgeId?: string;
};

export type AdminGraphView = {
  release: AdminGraphRelease;
  meta: {
    nodeCount: number;
    edgeCount: number;
    hardPrerequisiteCount: number;
    softPrerequisiteCount: number;
    unknownPrerequisiteCount: number;
    evidenceDefinitionCount: number;
  };
  nodes: AdminGraphNode[];
  edges: AdminGraphEdge[];
  warnings: AdminGraphWarning[];
};

type MembershipRow = {
  record_id: string;
  record_type: string;
  stable_key: string;
  record_version: number;
  record_snapshot: unknown;
  record_checksum: string;
};

type CurrentNodeRow = {
  id: string;
  review_status: string | null;
  generation_type: string | null;
};

type CurrentEdgeRow = {
  id: string;
  review_status: string | null;
};

export function buildAdminGraphView(input: {
  release: AdminGraphRelease;
  memberships: MembershipRow[];
  currentNodes?: CurrentNodeRow[];
  currentEdges?: CurrentEdgeRow[];
}): AdminGraphView {
  const currentNodeById = new Map((input.currentNodes ?? []).map((row) => [row.id, row]));
  const currentEdgeById = new Map((input.currentEdges ?? []).map((row) => [row.id, row]));
  const evidenceMemberships = input.memberships.filter((row) => row.record_type === "mastery_evidence");

  const nodes = input.memberships
    .filter((row) => row.record_type === "competency_node")
    .map((row) => {
      const snapshot = record(row.record_snapshot);
      const current = currentNodeById.get(row.record_id);
      const embeddedEvidence = Array.isArray(snapshot.evidence) ? snapshot.evidence.length : 0;
      const membershipEvidence = evidenceMemberships.filter((item) => item.stable_key.startsWith(`${row.stable_key}:`)).length;
      return {
        id: row.record_id,
        key: stringValue(snapshot.key) ?? row.stable_key,
        label: stringValue(snapshot.labelFr) ?? stringValue(snapshot.label_fr) ?? row.stable_key,
        description: stringValue(snapshot.descriptionFr) ?? stringValue(snapshot.description_fr),
        strand: (stringValue(snapshot.strand) ?? "analyse") as Strand,
        nodeType: stringValue(snapshot.nodeType) ?? "unknown",
        atomicityLevel: numberValue(snapshot.atomicityLevel),
        evidenceCount: Math.max(embeddedEvidence, membershipEvidence),
        sourceKeys: stringArray(snapshot.sourceKeys),
        reviewStatus: current?.review_status ?? null,
        generationType: current?.generation_type ?? null,
        recordVersion: Number(row.record_version),
        recordChecksum: row.record_checksum,
      } satisfies AdminGraphNode;
    })
    .sort((a, b) => a.key.localeCompare(b.key));

  const nodeIdByKey = new Map(nodes.map((node) => [node.key, node.id]));
  const edges = input.memberships
    .filter((row) => row.record_type === "competency_edge")
    .map((row) => {
      const snapshot = record(row.record_snapshot);
      const sourceKey = stringValue(snapshot.source) ?? "unknown-source";
      const targetKey = stringValue(snapshot.target) ?? "unknown-target";
      const prerequisiteClass = snapshot.prerequisiteClass === "hard" || snapshot.prerequisiteClass === "soft"
        ? snapshot.prerequisiteClass
        : "unknown";
      return {
        id: row.record_id,
        sourceNodeId: nodeIdByKey.get(sourceKey) ?? null,
        targetNodeId: nodeIdByKey.get(targetKey) ?? null,
        sourceKey,
        targetKey,
        edgeType: stringValue(snapshot.type) ?? "prerequisite",
        prerequisiteClass,
        rationale: stringValue(snapshot.rationale),
        reviewStatus: currentEdgeById.get(row.record_id)?.review_status ?? null,
        recordVersion: Number(row.record_version),
        recordChecksum: row.record_checksum,
      } satisfies AdminGraphEdge;
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const warnings = graphWarnings(nodes, edges);
  return {
    release: input.release,
    meta: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      hardPrerequisiteCount: edges.filter((edge) => edge.prerequisiteClass === "hard").length,
      softPrerequisiteCount: edges.filter((edge) => edge.prerequisiteClass === "soft").length,
      unknownPrerequisiteCount: edges.filter((edge) => edge.prerequisiteClass === "unknown").length,
      evidenceDefinitionCount: evidenceMemberships.length,
    },
    nodes,
    edges,
    warnings,
  };
}

function graphWarnings(nodes: AdminGraphNode[], edges: AdminGraphEdge[]): AdminGraphWarning[] {
  const warnings: AdminGraphWarning[] = [];
  const incident = new Set<string>();
  const completePrerequisites: CompetencyEdge[] = [];

  for (const edge of edges) {
    if (!edge.sourceNodeId || !edge.targetNodeId) {
      warnings.push({
        id: `dangling:${edge.id}`,
        code: "dangling_edge",
        severity: "error",
        message: `${edge.sourceKey} → ${edge.targetKey} référence un nœud absent de cette version.`,
        nodeIds: [edge.sourceNodeId, edge.targetNodeId].filter((id): id is string => Boolean(id)),
        edgeId: edge.id,
      });
      continue;
    }
    if (edge.edgeType !== "prerequisite") continue;
    incident.add(edge.sourceNodeId);
    incident.add(edge.targetNodeId);
    completePrerequisites.push({ sourceNodeId: edge.sourceNodeId, targetNodeId: edge.targetNodeId, edgeType: "prerequisite" });
    if (edge.prerequisiteClass === "unknown") {
      warnings.push({
        id: `class:${edge.id}`,
        code: "unknown_prerequisite_class",
        severity: "warning",
        message: `${edge.sourceKey} → ${edge.targetKey} n'a pas de classe de prérequis.`,
        nodeIds: [edge.sourceNodeId, edge.targetNodeId],
        edgeId: edge.id,
      });
    }
  }

  const cycle = new PrereqGraph(nodes.map((node) => node.id), completePrerequisites).findCycle();
  if (cycle) {
    warnings.unshift({
      id: "cycle:prerequisite",
      code: "cycle",
      severity: "error",
      message: "Le graphe de prérequis contient un cycle.",
      nodeIds: cycle,
    });
  }

  for (const node of nodes) {
    if (!incident.has(node.id)) {
      warnings.push({ id: `orphan:${node.id}`, code: "orphan_node", severity: "warning", message: `${node.label} est isolée du graphe de prérequis.`, nodeIds: [node.id] });
    }
    if (node.evidenceCount === 0) {
      warnings.push({ id: `evidence:${node.id}`, code: "missing_evidence", severity: "warning", message: `${node.label} n'a aucune définition de preuve de maîtrise.`, nodeIds: [node.id] });
    }
  }
  return warnings;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length ? value : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
