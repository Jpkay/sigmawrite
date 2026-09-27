import { runGates } from "@/lib/ai/item-generation/pipeline";
import { checksum, type TaxonomyCandidate } from "@/lib/taxonomy/validate";
import { validateCanonicalDiagnosticBank, type CanonicalDiagnosticBankArtifact, type CanonicalDiagnosticBankItem } from "../item-bank";
import { CAUSE_PRODUCTION_QUESTIONS, CAUSE_RECOGNITION_QUESTIONS, CAUSE_RELATION_ANALYSES, CAUSE_RELATION_REVIEW } from "./cause-relation-family";
import type { EvidenceAnnotation } from "./facet-adapter";
import { questionMaterialKeys } from "./material-annotations";
import type { DraftExpansion } from "./assemble-drafts";

type TaxonomyArtifact = {
  manifest: { contentChecksum: string };
  taxonomy: TaxonomyCandidate;
};

export type CauseRelationExpansion = DraftExpansion & {
  registryTaskIds: Array<"C081" | "C082">;
  claimScope: "sentence_level_recognition_and_controlled_combination";
  poolIntents: Record<"initial" | "learning", string[]>;
  contentReview: typeof CAUSE_RELATION_REVIEW;
};

export async function buildCauseRelationExpansion(
  taxonomyArtifact: TaxonomyArtifact,
  base: CanonicalDiagnosticBankArtifact,
): Promise<CauseRelationExpansion> {
  const node = taxonomyArtifact.taxonomy.nodes.find(candidate => candidate.key === "relation_cause");
  if (!node) throw new Error("Approved relation_cause node is missing");
  const evidenceByKey = new Map(node.evidence.map(evidence => [evidence.key, evidence]));
  const recognitionEvidence = evidenceByKey.get("reading-analysis");
  const productionEvidence = evidenceByKey.get("writing-controlled-production");
  if (!recognitionEvidence || recognitionEvidence.expectation !== "receptive") {
    throw new Error("Approved cause-recognition evidence is missing");
  }
  if (!productionEvidence || productionEvidence.expectation !== "controlled_production") {
    throw new Error("Approved cause-production evidence is missing");
  }

  const items: CanonicalDiagnosticBankItem[] = [];
  const annotations: EvidenceAnnotation[] = [];
  const poolIntents: Record<"initial" | "learning", string[]> = { initial: [], learning: [] };

  for (const row of CAUSE_RECOGNITION_QUESTIONS) {
    const checked = await runGates({
      nodeKey: node.key,
      strand: node.strand,
      modality: "reading",
      learnerMode: "shared",
      responseType: "mcq",
      promptFr: `${row.sentence}\n\nQuelle relation unit les deux idées ?`,
      instructionsFr: "Choisis l’analyse exacte de la phrase.",
      acceptableAnswers: [],
      validatorType: "exact",
      difficulty: row.difficulty,
      choices: CAUSE_RELATION_ANALYSES.map(text => ({
        text,
        correct: text === row.answer,
        feedbackFr: text === row.answer ? row.explanationFr : undefined,
      })),
      validatorConfig: {
        materialExposure: {
          sentences: [row.sentence],
          assessed: { sentences: [row.sentence] },
        },
        ...(row.negative ? {
          negativeExample: {
            excerptFr: row.sentence,
            rationaleFr: row.explanationFr,
          },
        } : {}),
      },
    }, { knownNodeKeys: new Set([node.key]), knownMisconceptionKeys: new Set() });
    if (!checked.item || checked.gates.verdict === "rejected") {
      throw new Error(`Rejected C081/${row.pool}/${row.key}`);
    }
    questionMaterialKeys(checked.item);
    const itemKey = `coverage-cause-relation:C081:${row.pool}:${row.key}`;
    const entry: CanonicalDiagnosticBankItem = {
      itemKey,
      item: checked.item,
      evidenceKey: recognitionEvidence.key,
      evidenceExpectation: recognitionEvidence.expectation,
      sectionKey: "grammar",
      promptFamily: "cause-relation-analysis",
      difficultyTier: row.difficultyTier,
      reviewStatus: "needs_human_review",
      qcGates: {
        ...checked.gates,
        gate3_ensemble: { agrees: false, agreement: 0 },
        verdict: "needs_human_review",
      },
    };
    items.push(entry);
    poolIntents[row.pool].push(itemKey);
    annotations.push({
      kind: "evidence",
      itemKey,
      itemChecksum: checksum(entry),
      evidenceTarget: { nodeKey: node.key, evidenceKey: recognitionEvidence.key },
      contextKey: `coverage-cause-relation:C081:${row.pool}:${row.key}`,
    });
  }

  for (const row of CAUSE_PRODUCTION_QUESTIONS) {
    const answerWithoutPeriod = row.answer.slice(0, -1);
    const reverseWithoutPeriod = row.reverse.slice(0, -1);
    const checked = await runGates({
      nodeKey: node.key,
      strand: node.strand,
      modality: "writing",
      learnerMode: "shared",
      responseType: "transform",
      promptFr: `Relie les deux idées avec « parce que ». Commence par la première.\n\n${row.effect}\n${row.reason}`,
      instructionsFr: "Écris la phrase complète.",
      correctAnswer: row.answer,
      acceptableAnswers: [answerWithoutPeriod],
      validatorType: "exact",
      difficulty: row.difficulty,
      validatorConfig: {
        materialExposure: {
          sentences: [row.effect, row.reason, row.answer],
          assessed: { sentences: [row.answer] },
        },
        finiteResponseSpace: {
          alternatives: [row.answer, answerWithoutPeriod, row.reverse, reverseWithoutPeriod],
          rationaleFr: "Les deux propositions et le lien parce que sont fournis. Deux directions causales, chacune avec ou sans point final, donnent un plancher conservateur de hasard de un demi. Cette combinaison contrôlée n’est pas une rédaction libre.",
        },
      },
    }, { knownNodeKeys: new Set([node.key]), knownMisconceptionKeys: new Set() });
    if (!checked.item || checked.gates.verdict === "rejected") {
      throw new Error(`Rejected C082/${row.pool}/${row.key}`);
    }
    questionMaterialKeys(checked.item);
    const itemKey = `coverage-cause-relation:C082:${row.pool}:${row.key}`;
    const entry: CanonicalDiagnosticBankItem = {
      itemKey,
      item: checked.item,
      evidenceKey: productionEvidence.key,
      evidenceExpectation: productionEvidence.expectation,
      sectionKey: "grammar",
      promptFamily: "cause-relation-controlled-combination",
      difficultyTier: row.difficultyTier,
      reviewStatus: "needs_human_review",
      qcGates: {
        ...checked.gates,
        gate3_ensemble: { agrees: false, agreement: 0 },
        verdict: "needs_human_review",
      },
    };
    items.push(entry);
    poolIntents[row.pool].push(itemKey);
    annotations.push({
      kind: "evidence",
      itemKey,
      itemChecksum: checksum(entry),
      evidenceTarget: { nodeKey: node.key, evidenceKey: productionEvidence.key },
      contextKey: `coverage-cause-relation:C082:${row.pool}:${row.key}`,
    });
  }

  const combined = { ...base, items: [...base.items, ...items] };
  delete combined.manifest;
  const validation = validateCanonicalDiagnosticBank(combined, taxonomyArtifact.taxonomy);
  if (validation.issues.length) throw new Error(validation.issues.join("\n"));
  const sourceBankChecksum = validateCanonicalDiagnosticBank(base, taxonomyArtifact.taxonomy).manifest.checksum;
  const content = {
    version: "coverage-cause-relation-family-v1",
    status: "draft_requires_review" as const,
    registryTaskIds: ["C081", "C082"] as Array<"C081" | "C082">,
    claimScope: "sentence_level_recognition_and_controlled_combination" as const,
    parentTaxonomyChecksum: taxonomyArtifact.manifest.contentChecksum,
    sourceBankChecksum,
    items,
    annotations,
    poolIntents,
    contentReview: CAUSE_RELATION_REVIEW,
  };
  return { ...content, checksum: checksum(content) };
}
