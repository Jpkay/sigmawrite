type NodeMembership = {
  record_id: string;
  record_snapshot: Record<string, unknown> | null;
};

type ApprovedItem = {
  id: string;
  primary_node_id: string;
};

function evidenceExpectations(snapshot: Record<string, unknown> | null): string[] {
  const evidence = snapshot?.evidence;
  if (!Array.isArray(evidence)) return [];
  return evidence.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const expectation = (entry as { expectation?: unknown }).expectation;
    return typeof expectation === "string" ? [expectation] : [];
  });
}

/**
 * A published graph is only activated for new student paths after every node
 * has an approved micro-lesson and every controlled-production node has at
 * least three distinct approved exercises. Publishing and activation remain
 * separate so an immutable release can be reviewed without exposing empty
 * practice sessions to learners.
 */
export function hasStudentPathCoverage(input: {
  nodes: NodeMembership[];
  approvedLessonNodeIds: Iterable<string>;
  approvedItems: ApprovedItem[];
}): boolean {
  if (input.nodes.length === 0) return false;
  const lessons = new Set(input.approvedLessonNodeIds);
  if (input.nodes.some((node) => !lessons.has(node.record_id))) return false;

  const itemIdsByNode = new Map<string, Set<string>>();
  for (const item of input.approvedItems) {
    const itemIds = itemIdsByNode.get(item.primary_node_id) ?? new Set<string>();
    itemIds.add(item.id);
    itemIdsByNode.set(item.primary_node_id, itemIds);
  }

  return input.nodes.every((node) => {
    const controlled = evidenceExpectations(node.record_snapshot)
      .includes("controlled_production");
    return !controlled || (itemIdsByNode.get(node.record_id)?.size ?? 0) >= 3;
  });
}
