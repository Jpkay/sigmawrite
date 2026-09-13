import { conjugate, PERSONS } from "@/lib/linguistic/conjugation";
import { runGates } from "@/lib/ai/item-generation/pipeline";
import { checksum, type TaxonomyCandidate } from "@/lib/taxonomy/validate";
import { validateCanonicalDiagnosticBank, type CanonicalDiagnosticBankArtifact, type CanonicalDiagnosticBankItem } from "../item-bank";
import { PASSE_RECENT_MODAL_QUESTIONS, PASSE_RECENT_MODAL_TARGETS } from "./passe-recent-modal-family";
import { conjugationFacet } from "./facets";
import { questionMaterialKeys } from "./material-annotations";
import type { FacetAnnotation } from "./facet-adapter";
import type { DraftExpansion } from "./assemble-drafts";

type TaxonomyArtifact = {
  manifest: { contentChecksum: string };
  taxonomy: TaxonomyCandidate;
};

export type PasseRecentModalExpansion = DraftExpansion & {
  registryTaskIds: Array<"C001" | "C002" | "C003">;
  claimScope: "controlled_form_only";
  poolIntents: Record<"initial" | "learning", string[]>;
  naturalnessReview: Array<{
    registryId: "C001" | "C002" | "C003";
    skillId: string;
    status: "awaiting_real_review";
    scopeFr: string;
    questionsFr: readonly string[];
  }>;
};

export async function buildPasseRecentModalExpansion(
  taxonomyArtifact: TaxonomyArtifact,
  base: CanonicalDiagnosticBankArtifact,
): Promise<PasseRecentModalExpansion> {
  const node = taxonomyArtifact.taxonomy.nodes.find(candidate => candidate.key === "produire_passe_recent");
  if (!node) throw new Error("Approved produire_passe_recent node is missing");
  const evidence = node.evidence.find(candidate => candidate.expectation === "controlled_production");
  if (!evidence) throw new Error("Approved controlled-production evidence is missing");

  const items: CanonicalDiagnosticBankItem[] = [];
  const annotations: FacetAnnotation[] = [];
  const poolIntents: Record<"initial" | "learning", string[]> = { initial: [], learning: [] };
  const ordinalByPool = new Map<string, number>();

  for (const row of PASSE_RECENT_MODAL_QUESTIONS) {
    const config = { verb: row.verb, tense: "passe_recent", person: row.person };
    const completed = row.sentence.replace("___", row.answer);
    const checked = await runGates({
      nodeKey: node.key,
      strand: node.strand,
      modality: "writing",
      learnerMode: "shared",
      responseType: "short_answer",
      promptFr: `Le passé récent et le verbe sont imposés. Complète avec ${row.verb} : ${row.sentence}`,
      instructionsFr: "Écris seulement le groupe verbal manquant.",
      correctAnswer: row.answer,
      acceptableAnswers: [],
      validatorType: "conjugator",
      difficulty: row.difficulty,
      validatorConfig: {
        ...config,
        sentenceApplication: row.sentence,
        finiteResponseSpace: {
          alternatives: [...new Set(PERSONS.map(person => conjugate(row.verb, "passe_recent", person)))],
          rationaleFr: "Le verbe et le temps sont fournis. Les cinq groupes verbaux écrits distincts donnent un plancher conservateur de hasard pour cette transformation contrôlée. Cette réponse ne mesure pas le choix du verbe dans une production libre.",
        },
        materialExposure: {
          words: [{ lemma: row.verb, form: row.verb }],
          sentences: [row.sentence, completed],
          assessed: { sentences: [row.sentence, completed] },
        },
      },
    }, { knownNodeKeys: new Set([node.key]), knownMisconceptionKeys: new Set() });
    if (!checked.item || checked.gates.verdict === "rejected") throw new Error(`Rejected ${row.registryId}/${row.pool}/${row.person}`);
    questionMaterialKeys(checked.item);
    const ordinalKey = `${row.registryId}:${row.pool}`;
    const ordinal = (ordinalByPool.get(ordinalKey) ?? 0) + 1;
    ordinalByPool.set(ordinalKey, ordinal);
    const itemKey = `coverage-passe-recent-modal:${row.registryId}:${row.pool}:${String(ordinal).padStart(2, "0")}`;
    const entry: CanonicalDiagnosticBankItem = {
      itemKey,
      item: checked.item,
      evidenceKey: evidence.key,
      evidenceExpectation: evidence.expectation,
      sectionKey: "conjugation",
      promptFamily: "passe-recent-modal-controlled-form",
      difficultyTier: row.difficultyTier,
      reviewStatus: "needs_human_review",
      qcGates: { ...checked.gates, gate3_ensemble: { agrees: false, agreement: 0 }, verdict: "needs_human_review" },
    };
    const facetKey = conjugationFacet(node.key, config);
    if (!facetKey) throw new Error(`No exact facet for ${row.registryId}/${row.person}`);
    items.push(entry);
    poolIntents[row.pool].push(itemKey);
    annotations.push({
      itemKey,
      itemChecksum: checksum(entry),
      facetKey,
      contextKey: `coverage-passe-recent-modal:${row.registryId}:${row.pool}:${ordinal}`,
    });
  }

  const combined = { ...base, items: [...base.items, ...items] };
  delete combined.manifest;
  const validation = validateCanonicalDiagnosticBank(combined, taxonomyArtifact.taxonomy);
  if (validation.issues.length) throw new Error(validation.issues.join("\n"));
  const sourceBankChecksum = validateCanonicalDiagnosticBank(base, taxonomyArtifact.taxonomy).manifest.checksum;
  const content = {
    version: "coverage-passe-recent-modal-family-v1",
    status: "draft_requires_review" as const,
    registryTaskIds: PASSE_RECENT_MODAL_TARGETS.map(target => target.registryId),
    claimScope: "controlled_form_only" as const,
    parentTaxonomyChecksum: taxonomyArtifact.manifest.contentChecksum,
    sourceBankChecksum,
    items,
    annotations,
    poolIntents,
    naturalnessReview: PASSE_RECENT_MODAL_TARGETS.map(target => ({
      registryId: target.registryId,
      skillId: `produire_passe_recent::writing-controlled-production::verb:${target.verb}`,
      status: "awaiting_real_review" as const,
      scopeFr: target.naturalnessScopeFr,
      questionsFr: target.ownerReviewQuestionsFr,
    })),
  };
  return { ...content, checksum: checksum(content) };
}
