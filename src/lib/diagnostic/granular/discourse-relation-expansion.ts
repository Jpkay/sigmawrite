import { runGates } from "@/lib/ai/item-generation/pipeline";
import { checksum, type TaxonomyCandidate } from "@/lib/taxonomy/validate";
import {
  validateCanonicalDiagnosticBank,
  type CanonicalDiagnosticBankArtifact,
  type CanonicalDiagnosticBankItem,
} from "../item-bank";
import type { DraftExpansion } from "./assemble-drafts";
import {
  DISCOURSE_RELATIONS,
  DISCOURSE_RELATION_CONNECTORS,
  DISCOURSE_RELATION_QUESTIONS,
  DISCOURSE_RELATION_REVIEW,
  RELATION_ANALYSES,
  type DiscourseRelationKey,
} from "./discourse-relation-family";
import type { EvidenceAnnotation } from "./facet-adapter";
import { questionMaterialKeys } from "./material-annotations";

type TaxonomyArtifact = {
  manifest: { contentChecksum: string };
  taxonomy: TaxonomyCandidate;
};

type Pool = "initial" | "learning";
type RegistryId = "C083" | "C084" | "C085" | "C086" | "C087" | "C088" | "C089" | "C090";

export type DiscourseRelationExpansion = DraftExpansion & {
  registryTaskIds: RegistryId[];
  claimScope: "sentence_level_recognition_and_controlled_combination";
  poolIntents: Record<Pool, string[]>;
  contentReview: typeof DISCOURSE_RELATION_REVIEW;
};

const sourceSentence = (value: string) =>
  `${value.charAt(0).toLocaleUpperCase("fr")}${value.slice(1)}.`;

export async function buildDiscourseRelationExpansion(
  taxonomyArtifact: TaxonomyArtifact,
  base: CanonicalDiagnosticBankArtifact,
): Promise<DiscourseRelationExpansion> {
  const items: CanonicalDiagnosticBankItem[] = [];
  const annotations: EvidenceAnnotation[] = [];
  const poolIntents: Record<Pool, string[]> = { initial: [], learning: [] };
  const nodeByRelation = new Map<DiscourseRelationKey, TaxonomyCandidate["nodes"][number]>();

  for (const definition of DISCOURSE_RELATIONS) {
    const node = taxonomyArtifact.taxonomy.nodes.find(candidate => candidate.key === definition.nodeKey);
    if (!node) throw new Error(`Approved ${definition.nodeKey} node is missing`);
    const hasRecognitionEvidence = node.evidence.some(
      evidence => evidence.key === "reading-analysis" && evidence.expectation === "receptive",
    );
    const hasProductionEvidence = node.evidence.some(
      evidence => evidence.key === "writing-controlled-production" && evidence.expectation === "controlled_production",
    );
    if (!hasRecognitionEvidence || !hasProductionEvidence) {
      throw new Error(`Approved evidence is incomplete for ${definition.nodeKey}`);
    }
    nodeByRelation.set(definition.key, node);
  }

  let ordinal = 0;
  for (const row of DISCOURSE_RELATION_QUESTIONS) {
    ordinal++;
    const node = nodeByRelation.get(row.relation)!;

    if ("sentence" in row) {
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
        choices: RELATION_ANALYSES.map(text => ({
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
        throw new Error(`Rejected ${row.registryId}/${row.pool}/${ordinal}`);
      }
      questionMaterialKeys(checked.item);

      const itemKey = `coverage-discourse-relations:${row.registryId}:${row.pool}:${String(ordinal).padStart(3, "0")}`;
      const entry: CanonicalDiagnosticBankItem = {
        itemKey,
        item: checked.item,
        evidenceKey: "reading-analysis",
        evidenceExpectation: "receptive",
        sectionKey: "grammar",
        promptFamily: `discourse-relation-${row.relation}-analysis`,
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
        evidenceTarget: { nodeKey: node.key, evidenceKey: "reading-analysis" },
        contextKey: itemKey,
      });
      continue;
    }

    const answerWithoutPeriod = row.answer.slice(0, -1);
    const reverseWithoutPeriod = row.reverse.slice(0, -1);
    const leftSentence = sourceSentence(row.pair.left);
    const rightSentence = sourceSentence(row.pair.right);
    const connector = DISCOURSE_RELATION_CONNECTORS[row.relation];
    const checked = await runGates({
      nodeKey: node.key,
      strand: node.strand,
      modality: "writing",
      learnerMode: "shared",
      responseType: "transform",
      promptFr: `Relie les deux idées avec « ${connector} » en gardant leur ordre.\n\n${leftSentence}\n${rightSentence}`,
      instructionsFr: "Écris la phrase complète.",
      correctAnswer: row.answer,
      acceptableAnswers: [answerWithoutPeriod],
      validatorType: "exact",
      difficulty: row.difficulty,
      validatorConfig: {
        materialExposure: {
          sentences: [leftSentence, rightSentence, row.answer],
          assessed: { sentences: [row.answer] },
        },
        finiteResponseSpace: {
          alternatives: [row.answer, answerWithoutPeriod, row.reverse, reverseWithoutPeriod],
          rationaleFr: "Les deux idées, le lien et leur ordre sont fournis. Deux ordres, chacun avec ou sans point final, donnent un plancher conservateur de hasard de un demi. Cette combinaison contrôlée n’est pas une rédaction libre.",
        },
      },
    }, { knownNodeKeys: new Set([node.key]), knownMisconceptionKeys: new Set() });
    if (!checked.item || checked.gates.verdict === "rejected") {
      throw new Error(`Rejected ${row.registryId}/${row.pool}/${ordinal}`);
    }
    // Preserve exact source anchoring before the item receives evidence provenance.
    questionMaterialKeys(checked.item);

    const itemKey = `coverage-discourse-relations:${row.registryId}:${row.pool}:${String(ordinal).padStart(3, "0")}`;
    const entry: CanonicalDiagnosticBankItem = {
      itemKey,
      item: checked.item,
      evidenceKey: "writing-controlled-production",
      evidenceExpectation: "controlled_production",
      sectionKey: "grammar",
      promptFamily: `discourse-relation-${row.relation}-controlled-combination`,
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
      evidenceTarget: { nodeKey: node.key, evidenceKey: "writing-controlled-production" },
      contextKey: itemKey,
    });
  }

  const combined = { ...base, items: [...base.items, ...items] };
  delete combined.manifest;
  const validation = validateCanonicalDiagnosticBank(combined, taxonomyArtifact.taxonomy);
  if (validation.issues.length) throw new Error(validation.issues.join("\n"));
  const sourceBankChecksum = validateCanonicalDiagnosticBank(base, taxonomyArtifact.taxonomy).manifest.checksum;
  const content = {
    version: "coverage-discourse-relation-family-v1",
    status: "draft_requires_review" as const,
    registryTaskIds: DISCOURSE_RELATIONS.flatMap(
      definition => [definition.recognitionId, definition.productionId],
    ) as RegistryId[],
    claimScope: "sentence_level_recognition_and_controlled_combination" as const,
    parentTaxonomyChecksum: taxonomyArtifact.manifest.contentChecksum,
    sourceBankChecksum,
    items,
    annotations,
    poolIntents,
    contentReview: DISCOURSE_RELATION_REVIEW,
  };
  return { ...content, checksum: checksum(content) };
}
