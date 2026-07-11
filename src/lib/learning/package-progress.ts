export type CompletionCriterion =
  | { type: "all_required_nodes_mastered"; threshold: number }
  | { type: "minimum_required_nodes_mastered"; count: number; threshold: number }
  | { type: "required_child_packages_completed" }
  | { type: "minimum_distinct_evidence"; perNode: number };

export type PackageProgressEvidence = {
  requiredNodeIds: string[];
  nodeMastery: Record<string, number>;
  nodeEvidenceCount: Record<string, number>;
  requiredChildVersionIds: string[];
  completedChildVersionIds: string[];
};

export type CriterionResult = { criterion: CompletionCriterion; passed: boolean; actual: number; required: number };

export function evaluatePackageCompletion(criteria: CompletionCriterion[], evidence: PackageProgressEvidence) {
  const results: CriterionResult[] = criteria.map((criterion) => {
    if (criterion.type === "all_required_nodes_mastered") {
      const actual = evidence.requiredNodeIds.filter((id) => (evidence.nodeMastery[id] ?? 0) >= criterion.threshold).length;
      return { criterion, passed: actual === evidence.requiredNodeIds.length, actual, required: evidence.requiredNodeIds.length };
    }
    if (criterion.type === "minimum_required_nodes_mastered") {
      const actual = evidence.requiredNodeIds.filter((id) => (evidence.nodeMastery[id] ?? 0) >= criterion.threshold).length;
      return { criterion, passed: actual >= criterion.count, actual, required: criterion.count };
    }
    if (criterion.type === "minimum_distinct_evidence") {
      const actual = evidence.requiredNodeIds.filter((id) => (evidence.nodeEvidenceCount[id] ?? 0) >= criterion.perNode).length;
      return { criterion, passed: actual === evidence.requiredNodeIds.length, actual, required: evidence.requiredNodeIds.length };
    }
    const completed = new Set(evidence.completedChildVersionIds);
    const actual = evidence.requiredChildVersionIds.filter((id) => completed.has(id)).length;
    return { criterion, passed: actual === evidence.requiredChildVersionIds.length, actual, required: evidence.requiredChildVersionIds.length };
  });
  return { complete: criteria.length > 0 && results.every((result) => result.passed), results };
}

export function packageProgressSummary(input: { title: string; kind: "lesson" | "module" | "course"; completed: boolean; completedRequired: number; totalRequired: number }) {
  const progress = `${input.completedRequired}/${input.totalRequired}`;
  return {
    studentFr: input.completed ? `${input.title} est terminé. Cette réussite reste acquise.` : `${input.title} : ${progress} objectifs requis maîtrisés.`,
    parentFr: `${input.title} (${input.kind}) — progression ${progress}${input.completed ? ", réussite acquise" : ""}.`,
    teacherFr: `${input.title} — ${progress} critères atomiques requis validés; statut ${input.completed ? "complété" : "en cours"}.`,
    system: { ...input, progress },
  };
}
