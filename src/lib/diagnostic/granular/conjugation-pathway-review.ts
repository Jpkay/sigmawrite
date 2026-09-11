import { checksum } from "@/lib/taxonomy/validate";
import { validateCanonicalDiagnosticBank, type CanonicalDiagnosticBankArtifact } from "../item-bank";
import type { TaxonomyCandidate } from "@/lib/taxonomy/validate";
import { conjugationFacet, conjugationEvidenceFeatures } from "./facets";
import { canonicalProbeMetrics } from "./probe-metrics";
import { questionMaterialKeys, questionAssessedMaterialKeys, teachingMaterialKeys } from "./material-annotations";
import { allocateQuestionPools } from "./question-pools";
import { validateTeachingTargets, type TargetTeachingContent } from "./teaching-content";
import type { V3Assessment } from "./v3-adapter";

/** Content-review feasibility only. Draft questions remain drafts; neither a
 * publishable assessment nor activity bindings are returned. Normal release
 * validation would reject using unapproved questions from this preview. */
export function reviewConjugationPathways(assessment: V3Assessment, bank: CanonicalDiagnosticBankArtifact,
  taxonomy: TaxonomyCandidate, lessons: readonly TargetTeachingContent[]) {
  validateTeachingTargets(assessment, lessons);
  const validation = validateCanonicalDiagnosticBank(bank, taxonomy);
  if (validation.issues.length || validation.manifest.checksum !== assessment.bankChecksum) throw Error("Review source bank mismatch");
  const eligible = new Set(validation.eligibleItemKeys);
  const preview = structuredClone(assessment);
  const targetIds = new Set(lessons.map(lesson => assessment.skills.find(skill => skill.nodeKey === lesson.nodeKey && skill.facetKey === lesson.facetKey && skill.modes.includes(lesson.mode))!.id));
  preview.probes = preview.probes.filter(probe => !targetIds.has(probe.skillId));
  const candidates = bank.items.filter(entry => entry.item.validatorType === "conjugator" && entry.item.validatorConfig?.tense === "present"
    && ["human_approved", "needs_human_review"].includes(entry.reviewStatus));
  for (const entry of candidates) {
    const config = entry.item.validatorConfig!, facet = conjugationFacet(entry.item.nodeKey, config);
    const skill = assessment.skills.find(skill => targetIds.has(skill.id) && skill.facetKey === facet && skill.evidenceKey === entry.evidenceKey);
    if (!skill) continue;
    preview.probes.push({ id: entry.itemKey, skillId: skill.id, mode: skill.modes[0],
      contextId: `verb:${String(config.verb)}`, ...canonicalProbeMetrics(entry),
      evidenceFeatures: conjugationEvidenceFeatures(entry.item.nodeKey, config),
      materialKeys: questionMaterialKeys(entry.item), assessedMaterialKeys: questionAssessedMaterialKeys(entry.item) });
  }
  const allocation = allocateQuestionPools(preview);
  const sentencePreview = { ...preview, probes: preview.probes.filter(probe => !targetIds.has(probe.skillId)
    || (probe.materialKeys ?? []).some(key => key.startsWith("sentence:"))) };
  const sentenceAllocation = allocateQuestionPools(sentencePreview);
  const entries = new Map(bank.items.map(entry => [entry.itemKey, entry]));
  const rows = lessons.map(lesson => {
    teachingMaterialKeys(lesson);
    const skill = assessment.skills.find(skill => skill.nodeKey === lesson.nodeKey && skill.facetKey === lesson.facetKey && skill.modes.includes(lesson.mode))!;
    const coverage = allocation.coverage.find(row => row.skillId === skill.id && row.mode === lesson.mode)!;
    const probes = allocation.assessment.probes.filter(probe => probe.skillId === skill.id);
    const proposedInitial = probes.filter(probe => probe.usage === "initial");
    const proposedLater = probes.filter(probe => probe.usage === "learning");
    const sentenceProbes = sentenceAllocation.assessment.probes.filter(probe => probe.skillId === skill.id);
    return { lessonId: lesson.id, lessonChecksum: checksum(lesson), titleFr: lesson.titleFr,
      skillId: skill.id, facetKey: lesson.facetKey, prerequisites: skill.prerequisites,
      evidenceRequirements: skill.evidenceRequirements?.[lesson.mode],
      eligibleQuestions: probes.filter(probe => eligible.has(probe.id)).length,
      unapprovedCandidates: probes.filter(probe => !eligible.has(probe.id)).length,
      proposedAllocationStatus: coverage.status,
      proposedInitialQuestions: proposedInitial.map(probe => probe.id), proposedLaterQuestions: proposedLater.map(probe => probe.id),
      sentenceApplicationPools: {
        status: sentenceAllocation.coverage.find(row => row.skillId === skill.id && row.mode === lesson.mode)!.status,
        initialQuestionIds: sentenceProbes.filter(probe => probe.usage === "initial").map(probe => probe.id),
        laterQuestionIds: sentenceProbes.filter(probe => probe.usage === "learning").map(probe => probe.id),
      },
      questionChecksums: Object.fromEntries(probes.map(probe => [probe.id, checksum(entries.get(probe.id)!)])),
      // Source-anchored sentence annotations identify application candidates;
      // their presence cannot replace pedagogical/semantic transfer review.
      sentenceContextQuestions: probes.filter(probe => (probe.materialKeys ?? []).some(key => key.startsWith("sentence:"))).length,
      releaseReady: false as const,
      requiredReviews: ["question_correctness_and_target_fit", "lesson_and_guided_practice", "teaching_to_assessment_overlap", "contextual_transfer_and_independence", "prerequisite_scope", "calibration"],
    };
  });
  const report = { version: "conjugation-pathway-review-v1", status: "draft_review_feasibility_only",
    taxonomyChecksum: assessment.taxonomyChecksum, bankChecksum: assessment.bankChecksum,
    facetChecksum: assessment.facetChecksum, rows };
  return { ...report, checksum: checksum(report) };
}
