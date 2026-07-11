import { describe, expect, it } from "vitest";
import { evaluatePackageCompletion, packageProgressSummary, type CompletionCriterion } from "./package-progress";

const criteria: CompletionCriterion[] = [
  { type: "all_required_nodes_mastered", threshold: .85 },
  { type: "minimum_distinct_evidence", perNode: 2 },
  { type: "required_child_packages_completed" },
];
const evidence = { requiredNodeIds: ["agreement", "present"], nodeMastery: { agreement: .9, present: .88 }, nodeEvidenceCount: { agreement: 3, present: 2 }, requiredChildVersionIds: ["lesson-a"], completedChildVersionIds: ["lesson-a"] };

describe("learning package completion", () => {
  it("uses explicit mastery, evidence, and child-package criteria", () => expect(evaluatePackageCompletion(criteria, evidence).complete).toBe(true));
  it("does not treat rows viewed as completion", () => expect(evaluatePackageCompletion(criteria, { ...evidence, nodeMastery: { agreement: .9, present: .2 } }).complete).toBe(false));
  it("shares atomic mastery across any number of packages", () => {
    const first = evaluatePackageCompletion(criteria, evidence);
    const second = evaluatePackageCompletion([{ type: "minimum_required_nodes_mastered", count: 1, threshold: .85 }], { ...evidence, requiredNodeIds: ["present"] });
    expect(first.complete && second.complete).toBe(true);
  });
  it("requires all published-version children without depending on later revisions", () => expect(evaluatePackageCompletion(criteria, { ...evidence, requiredChildVersionIds: ["lesson-a", "lesson-b"] }).complete).toBe(false));
  it("produces student, parent, teacher, and system summaries", () => {
    const summary = packageProgressSummary({ title: "Fondations du présent", kind: "course", completed: true, completedRequired: 2, totalRequired: 2 });
    expect(summary.studentFr).toContain("reste acquise"); expect(summary.parentFr).toContain("2/2"); expect(summary.teacherFr).toContain("complété"); expect(summary.system.completed).toBe(true);
  });
});
