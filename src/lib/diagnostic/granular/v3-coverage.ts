import { checksum, type TaxonomyCandidate } from "@/lib/taxonomy/validate";
import type { CanonicalDiagnosticBankArtifact } from "../item-bank";
import { nodePracticeEvidenceExpectation } from "../practice-evidence";

export type LiveDiagnosticReview = { itemKey: string; eligible: boolean; unchanged: boolean };
export type LiveItemInventory = {
  nodeKey: string; reviewStatus: string; responseType: string;
};
/** Approval is recorded separately from compatibility: this report never publishes or copies reviews. */
export function buildV3Coverage(input: {
  previous: TaxonomyCandidate; target: TaxonomyCandidate; bank: CanonicalDiagnosticBankArtifact;
  liveItems?: LiveItemInventory[]; liveDiagnosticReviews?: LiveDiagnosticReview[]; independentProductionKeys: ReadonlySet<string>;
}) {
  const previous = new Map(input.previous.nodes.map(n => [n.key, n]));
  return input.target.nodes.map(node => {
    const old = previous.get(node.key);
    const sameMeaning = old && checksum({ label: old.labelFr, description: old.descriptionFr, strand: old.strand })
      === checksum({ label: node.labelFr, description: node.descriptionFr, strand: node.strand });
    const items = input.bank.items.filter(i => i.item.nodeKey === node.key);
    const approvedPractice = input.liveItems?.filter(i => i.nodeKey === node.key && ["human_approved", "auto_approved"].includes(i.reviewStatus));
    const evidence = node.evidence.map(e => {
      const previousEvidence = old?.evidence.find(p => p.key === e.key);
      const unchanged = Boolean(sameMeaning && previousEvidence && checksum(previousEvidence) === checksum(e));
      const candidates = items.filter(i => i.evidenceKey === e.key && i.evidenceExpectation === e.expectation);
      const required = e.expectation === "independent_production" ? Number(e.successCriteria.minimumDistinctTexts ?? 2) : Number(e.successCriteria.minimumDistinctItems ?? 3);
      const compatible = unchanged ? candidates : [];
      const approved = compatible.filter(i => i.reviewStatus === "human_approved" || (i.reviewStatus === "auto_approved" && i.item.validatorType === "conjugator" && i.qcGates.gate0_computed?.applied));
      const liveApproved = input.liveDiagnosticReviews ? compatible.filter(item => input.liveDiagnosticReviews!.some(r => r.itemKey === item.itemKey && r.eligible && r.unchanged)).length : null;
      const livePractice = e.expectation === "independent_production" ? null : approvedPractice?.filter(i => nodePracticeEvidenceExpectation(i.responseType) === e.expectation).length ?? null;
      return { key: e.key, expectation: e.expectation, actionFr: e.actionFr, successCriteria: e.successCriteria,
        assessmentStage: e.expectation === "independent_production" ? "learning_verification" : "initial_diagnostic",
        compatibility: unchanged ? "unchanged_contract" : old ? "requires_mapping_review" : "new_v3_evidence",
        requiredDistinct: required, authoredV2Items: candidates.length, compatibleV2Items: compatible.length,
        approvedCompatibleArtifactItems: approved.length, approvedCompatibleLiveItems: liveApproved,
        missingApprovedItems: e.expectation === "independent_production" ? null : Math.max(0, required - (liveApproved ?? approved.length)),
        approvedLivePracticeCandidates: livePractice,
        independentProductionSupported: e.expectation === "independent_production" ? input.independentProductionKeys.has(node.key) : null,
        // Item counts alone do not establish multiple occasions, context diversity or transfer.
        readyForPublication: false,
      };
    });
    return { key: node.key, labelFr: node.labelFr, strand: node.strand,
      previousNodeExists: Boolean(old), prerequisites: input.target.edges.filter(e => e.type === "prerequisite" && e.target === node.key).map(e => ({ key: e.source, class: e.prerequisiteClass })),
      evidence, actions: [
        ...(!old ? ["cover_new_v3_competency"] : []),
        ...(evidence.some(e => e.compatibility === "requires_mapping_review") ? ["review_changed_evidence_mapping"] : []),
        ...(evidence.some(e => (e.missingApprovedItems ?? 0) > 0) ? ["fill_approved_question_coverage"] : []),
        ...(evidence.some(e => e.independentProductionSupported === false) ? ["implement_independent_production_activity"] : []),
        ...(approvedPractice === undefined ? ["inspect_live_learning_inventory"] : []),
        ...(evidence.some(e => e.approvedLivePracticeCandidates !== null && e.approvedLivePracticeCandidates < e.requiredDistinct) ? ["fill_learning_activity_coverage"] : []),
        "verify_contexts_occasions_and_granularity",
      ] };
  });
}
