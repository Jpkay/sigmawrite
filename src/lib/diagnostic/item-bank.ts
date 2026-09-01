import {
  generatedItemSchema,
  type GateResults,
  type GeneratedItem,
} from "@/lib/ai/item-generation/schemas";
import { checksum, type TaxonomyCandidate } from "@/lib/taxonomy/validate";
import { conjugate, type Person, type Tense } from "@/lib/linguistic/conjugation";
import {
  assessDiagnosticBankReadiness,
  DIAGNOSTIC_SECTIONS,
  sectionForStrand,
  type DiagnosticSectionKey,
} from "./protocol";

export type DiagnosticDifficultyTier = "foundation" | "core" | "stretch";
export type DiagnosticEvidenceExpectation = "receptive" | "controlled_production" | "independent_production";

export type CanonicalDiagnosticBankItem = {
  /** Stable artifact identity. Content may be corrected during human review
   * without making the importer accidentally reuse an unrelated prompt. */
  itemKey: string;
  item: GeneratedItem;
  evidenceKey: string;
  evidenceExpectation: DiagnosticEvidenceExpectation;
  sectionKey: DiagnosticSectionKey;
  promptFamily: string;
  difficultyTier: DiagnosticDifficultyTier;
  qcGates: GateResults;
  reviewStatus: GateResults["verdict"] | "human_approved";
  review?: { reviewerProfileId: string; reviewedAt: string };
};

export type CanonicalDiagnosticBankArtifact = {
  schemaVersion: 1;
  bank: { key: string; version: string };
  taxonomy: { releaseKey: string; releaseVersion: string; checksum: string };
  generatedAt: string;
  items: CanonicalDiagnosticBankItem[];
  manifest?: ReturnType<typeof validateCanonicalDiagnosticBank>["manifest"];
};

function normalizeStudentFacingText(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("fr");
}

/**
 * Duplicate identity for what the learner can actually see. A repeated generic
 * MCQ stem is legitimate when its answer set is different; an open-response
 * prompt has no visible choices and therefore remains unique by prompt alone.
 * Choice order is ignored so shuffling cannot disguise duplicated content.
 */
export function diagnosticItemSurfaceIdentity(item: GeneratedItem): string {
  const prompt = normalizeStudentFacingText(item.promptFr);
  if (item.responseType !== "mcq") return `open\u0000${prompt}`;
  const choices = (item.choices ?? [])
    .map((choice) => normalizeStudentFacingText(choice.text))
    .sort((left, right) => left.localeCompare(right, "fr"));
  return `mcq\u0000${prompt}\u0000${choices.join("\u001f")}`;
}

export function validateCanonicalDiagnosticBank(
  artifact: Omit<CanonicalDiagnosticBankArtifact, "manifest"> | CanonicalDiagnosticBankArtifact,
  taxonomy: TaxonomyCandidate,
) {
  const issues: string[] = [];
  const nodeByKey = new Map(taxonomy.nodes.map((node) => [node.key, node]));
  const seen = new Set<string>();
  const seenItemKeys = new Set<string>();
  const eligible = artifact.items.filter((entry, index) => {
    if (!entry.itemKey.trim()) issues.push(`items.${index}: item key is required`);
    if (seenItemKeys.has(entry.itemKey)) issues.push(`items.${index}: duplicate item key ${entry.itemKey}`);
    seenItemKeys.add(entry.itemKey);
    const parsedItem = generatedItemSchema.safeParse(entry.item);
    if (!parsedItem.success) issues.push(`items.${index}: item schema is invalid`);
    const node = nodeByKey.get(entry.item.nodeKey);
    if (!node) issues.push(`items.${index}: unknown node ${entry.item.nodeKey}`);
    else {
      const section = sectionForStrand(node.strand as Parameters<typeof sectionForStrand>[0]);
      if (section !== entry.sectionKey) issues.push(`items.${index}: node/section mismatch`);
      if (node.strand !== entry.item.strand) issues.push(`items.${index}: node/strand mismatch`);
      const evidence = node.evidence.find((candidate) => candidate.key === entry.evidenceKey);
      if (!evidence) issues.push(`items.${index}: unknown evidence ${entry.evidenceKey}`);
      else {
        if (evidence.expectation !== entry.evidenceExpectation) issues.push(`items.${index}: evidence expectation mismatch`);
        if (!modalitySupportsEvidence(entry.item.modality, evidence.modality, evidence.expectation)) {
          issues.push(`items.${index}: item/evidence modality mismatch`);
        }
        if (evidence.expectation === "controlled_production" && entry.item.responseType === "mcq") {
          issues.push(`items.${index}: controlled production cannot use a multiple-choice response`);
        }
      }
    }
    const identity = `${entry.item.nodeKey}\u0000${diagnosticItemSurfaceIdentity(entry.item)}`;
    if (seen.has(identity)) issues.push(`items.${index}: duplicate student surface for ${entry.item.nodeKey}`);
    seen.add(identity);
    if (!entry.promptFamily.trim()) issues.push(`items.${index}: prompt family is required`);
    if (!entry.qcGates.gate1_schema || !entry.qcGates.gate1_invariants.ok || !entry.qcGates.gate2_answer_key.ok) {
      issues.push(`items.${index}: hard QC gate did not pass`);
    }
    if (!["exact", "regex", "conjugator"].includes(entry.item.validatorType)) {
      issues.push(`items.${index}: validator is not supported by the live diagnostic`);
    }
    if (entry.qcGates.verdict === "rejected" || entry.reviewStatus === "rejected") {
      issues.push(`items.${index}: rejected item cannot enter a bank`);
    }
    const hasHumanReview = entry.reviewStatus === "human_approved"
      && Boolean(entry.review?.reviewerProfileId.trim())
      && Number.isFinite(Date.parse(entry.review?.reviewedAt ?? ""));
    if (entry.reviewStatus === "human_approved" && !hasHumanReview) {
      issues.push(`items.${index}: human approval provenance is required`);
    }
    const computedConjugationApproved = entry.reviewStatus === "auto_approved"
      && entry.item.validatorType === "conjugator"
      && entry.qcGates.gate0_computed.applied
      && recomputesCanonicalConjugation(entry.item);
    if (
      entry.reviewStatus === "auto_approved"
      && entry.item.validatorType === "conjugator"
      && !computedConjugationApproved
    ) {
      issues.push(`items.${index}: computed conjugation could not be reproduced`);
    }
    const releaseEligible = hasHumanReview
      || computedConjugationApproved;
    if (!releaseEligible && entry.reviewStatus !== "rejected") {
      issues.push(`items.${index}: item is not release-approved`);
    }
    return releaseEligible;
  });

  const readinessRows = DIAGNOSTIC_SECTIONS.map((section) => ({
    key: section.key,
    targetNodeCount: taxonomy.nodes.filter((node) =>
      sectionForStrand(node.strand as Parameters<typeof sectionForStrand>[0]) === section.key
    ).length,
    nodesWithItems: new Set(eligible.filter((entry) => entry.sectionKey === section.key).map((entry) => entry.item.nodeKey)).size,
    approvedItemCount: eligible.filter((entry) => entry.sectionKey === section.key).length,
  }));
  const baseReadiness = assessDiagnosticBankReadiness(readinessRows);
  const sections = baseReadiness.sections.map((section) => {
    const entries = eligible.filter((entry) => entry.sectionKey === section.key);
    const evidenceCountsByNode = new Map<
      string,
      Map<string, number>
    >();
    for (const entry of entries) {
      const evidenceCounts = evidenceCountsByNode.get(entry.item.nodeKey)
        ?? new Map<string, number>();
      evidenceCounts.set(
        entry.evidenceKey,
        (evidenceCounts.get(entry.evidenceKey) ?? 0) + 1,
      );
      evidenceCountsByNode.set(entry.item.nodeKey, evidenceCounts);
    }
    // A node is only confirmable when the live bank can independently repeat
    // every assessable evidence definition required by the pinned taxonomy.
    // The definition's own distinct-item minimum is authoritative; this avoids
    // collapsing two different receptive observables into one coarse category.
    const confirmableNodeCount = [...evidenceCountsByNode].filter(([nodeKey, evidenceCounts]) => {
      const required = (nodeByKey.get(nodeKey)?.evidence ?? [])
        .filter((evidence) => evidence.expectation !== "independent_production");
      return required.length > 0 && required.every((evidence) => {
        const minimumDistinctItems = Math.max(
          2,
          Number(
            evidence.successCriteria.minimumDistinctItems
            ?? evidence.successCriteria.minimumDistinctTexts
            ?? 2,
          ),
        );
        return (evidenceCounts.get(evidence.key) ?? 0) >= minimumDistinctItems;
      });
    }).length;
    const productionItemCount = entries.filter((entry) => entry.evidenceExpectation !== "receptive").length;
    const promptFamilyCount = new Set(entries.map((entry) => entry.promptFamily)).size;
    const difficultyTierCount = new Set(entries.map((entry) => entry.difficultyTier)).size;
    const minimumProduction = section.key === "reading_comprehension" || section.key === "grammar" ? 2 : 4;
    return {
      ...section,
      confirmableNodeCount,
      productionItemCount,
      promptFamilyCount,
      difficultyTierCount,
      ready: section.ready && confirmableNodeCount >= 2 && productionItemCount >= minimumProduction && promptFamilyCount >= 2 && difficultyTierCount >= 2,
    };
  });
  // The release checksum covers everything that can change how a response is
  // presented or graded. Hashing only prompt text would allow an answer key,
  // choice, validator, or QC decision to drift under the same bank release.
  const content = artifact.items
    .map((entry) => ({
      itemKey: entry.itemKey,
      item: entry.item,
      evidenceKey: entry.evidenceKey,
      evidenceExpectation: entry.evidenceExpectation,
      sectionKey: entry.sectionKey,
      promptFamily: entry.promptFamily,
      difficultyTier: entry.difficultyTier,
      qcGates: entry.qcGates,
      reviewStatus: entry.reviewStatus,
      review: entry.review,
    }))
    .sort((left, right) =>
      `${left.item.nodeKey}:${left.item.promptFr}`.localeCompare(`${right.item.nodeKey}:${right.item.promptFr}`)
    );
  const manifest = {
    itemCount: artifact.items.length,
    eligibleItemCount: eligible.length,
    nodeCount: new Set(eligible.map((entry) => entry.item.nodeKey)).size,
    sectionReadiness: sections,
    checksum: checksum({ bank: artifact.bank, taxonomy: artifact.taxonomy, items: content }),
  };
  return {
    valid: issues.length === 0 && sections.every((section) => section.ready),
    issues,
    sections,
    manifest,
  };
}

function modalitySupportsEvidence(
  itemModality: GeneratedItem["modality"],
  evidenceModality: TaxonomyCandidate["nodes"][number]["evidence"][number]["modality"],
  expectation: DiagnosticEvidenceExpectation,
) {
  if (evidenceModality === "multimodal") return true;
  if (evidenceModality === "reading") {
    return expectation === "receptive"
      ? itemModality === "reading" || itemModality === "grammar_analysis"
      : itemModality === "writing";
  }
  if (evidenceModality === "writing") {
    return itemModality === "writing" || itemModality === "dictee";
  }
  return itemModality === evidenceModality;
}

function recomputesCanonicalConjugation(item: GeneratedItem) {
  const config = item.validatorConfig ?? {};
  if (!config.verb || !config.tense || !config.person || !item.correctAnswer) return false;
  try {
    return conjugate(
      String(config.verb),
      config.tense as Tense,
      config.person as Person,
      {
        gender: config.gender as "m" | "f" | undefined,
        codBefore: config.codBefore as { gender?: "m" | "f"; number?: "s" | "p" } | undefined,
      },
    ) === item.correctAnswer;
  } catch {
    return false;
  }
}
