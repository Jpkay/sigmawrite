import { runGates } from "@/lib/ai/item-generation/pipeline";
import type { GeneratedItem } from "@/lib/ai/item-generation/schemas";
import type { TaxonomyCandidate } from "@/lib/taxonomy/validate";
import {
  DIAGNOSTIC_DIFFICULTY_TIERS,
  diagnosticDifficultyForTier,
  diagnosticItemModality,
  diagnosticPromptFamilies,
} from "./item-authoring";
import type {
  CanonicalDiagnosticBankItem,
  DiagnosticEvidenceExpectation,
} from "./item-bank";
import { sectionForStrand } from "./protocol";

type ReusePlan = {
  targetNodeKey: string;
  expectation: Exclude<DiagnosticEvidenceExpectation, "independent_production">;
  sourceNodeKeys: readonly string[];
  promptPattern?: RegExp;
};

const PLANS: readonly ReusePlan[] = [
  { targetNodeKey: "construction_pronom_objet", expectation: "receptive", sourceNodeKeys: ["pronom_personnel_cod"] },
  { targetNodeKey: "construction_pronom_objet", expectation: "controlled_production", sourceNodeKeys: ["pronom_personnel_cod"] },
  { targetNodeKey: "construction_pronom_relatif", expectation: "receptive", sourceNodeKeys: ["pronom_relatif_que"] },
  { targetNodeKey: "construction_pronom_relatif", expectation: "controlled_production", sourceNodeKeys: ["pronom_relatif_que"] },

  { targetNodeKey: "identifier_sujet_verbe", expectation: "receptive", sourceNodeKeys: ["fonction_sujet", "sujet_simple", "sujet_groupe_nominal", "sujet_inverse"] },
  { targetNodeKey: "reconnaitre_radical_terminaison", expectation: "receptive", sourceNodeKeys: ["radical_terminaison"] },
  { targetNodeKey: "classer_famille_verbale", expectation: "receptive", sourceNodeKeys: ["groupes_verbes"] },
  { targetNodeKey: "reconnaitre_auxiliaire", expectation: "receptive", sourceNodeKeys: ["auxiliaire_choix"] },
  { targetNodeKey: "choisir_auxiliaire_compose", expectation: "controlled_production", sourceNodeKeys: ["auxiliaire_choix"] },
  { targetNodeKey: "former_participe_passe", expectation: "controlled_production", sourceNodeKeys: ["participe_passe_formation"] },
  { targetNodeKey: "reconnaitre_present_indicatif", expectation: "receptive", sourceNodeKeys: ["present_indicatif", "present_er", "present_ir_2g", "present_etre_avoir", "present_aller_faire", "present_3g_frequents"] },
  { targetNodeKey: "reconnaitre_passe_compose", expectation: "receptive", sourceNodeKeys: ["passe_compose_avoir", "passe_compose_etre"] },
  { targetNodeKey: "reconnaitre_imparfait", expectation: "receptive", sourceNodeKeys: ["imparfait_formation"] },
  { targetNodeKey: "contraster_pc_imparfait", expectation: "receptive", sourceNodeKeys: ["pc_vs_imparfait"] },
  { targetNodeKey: "reconnaitre_plus_que_parfait", expectation: "receptive", sourceNodeKeys: ["plus_que_parfait"] },
  { targetNodeKey: "produire_plus_que_parfait", expectation: "controlled_production", sourceNodeKeys: ["plus_que_parfait"] },
  { targetNodeKey: "interpreter_sequence_temporelle", expectation: "receptive", sourceNodeKeys: ["concordance_temps_recit"] },

  { targetNodeKey: "construction_accord_determinant_nom", expectation: "receptive", sourceNodeKeys: ["accord_determinant_nom", "accord_gn_complet"] },
  { targetNodeKey: "accorder_determinant_nom_ecrit", expectation: "controlled_production", sourceNodeKeys: ["accord_determinant_nom", "accord_gn_complet"] },
  { targetNodeKey: "construction_accord_nom_adjectif", expectation: "receptive", sourceNodeKeys: ["accord_adjectif_genre", "accord_adjectif_nombre", "accord_genre_nombre"] },
  { targetNodeKey: "accorder_adjectif_nom_ecrit", expectation: "controlled_production", sourceNodeKeys: ["accord_adjectif_genre", "accord_adjectif_nombre", "accord_genre_nombre", "accord_gn_complet"] },
  { targetNodeKey: "construction_accord_sujet_verbe", expectation: "receptive", sourceNodeKeys: ["accord_sujet_verbe", "accord_sv_sujet_simple", "accord_sv_sujet_eloigne", "accord_sv_sujets_coord"] },
  { targetNodeKey: "accorder_sujet_verbe_ecrit", expectation: "controlled_production", sourceNodeKeys: ["accord_sujet_verbe", "accord_sv_sujet_simple", "accord_sv_sujet_eloigne", "accord_sv_sujets_coord"] },
  { targetNodeKey: "construction_accord_participe", expectation: "receptive", sourceNodeKeys: ["accord_pp_etre", "accord_pp_avoir_cod"] },
  { targetNodeKey: "marquer_pluriel_nom_regulier", expectation: "receptive", sourceNodeKeys: ["pluriel_noms_reguliers", "nombre_nom"] },
  { targetNodeKey: "marquer_pluriel_nom_regulier", expectation: "controlled_production", sourceNodeKeys: ["pluriel_noms_reguliers", "nombre_nom"] },
  { targetNodeKey: "former_feminin_adjectif_regulier", expectation: "receptive", sourceNodeKeys: ["accord_adjectif_genre", "accord_genre_nombre"] },
  { targetNodeKey: "former_feminin_adjectif_regulier", expectation: "controlled_production", sourceNodeKeys: ["accord_adjectif_genre", "accord_genre_nombre"] },
  { targetNodeKey: "distinguer_homophones_a_a", expectation: "receptive", sourceNodeKeys: ["homophone_a_a"] },
  { targetNodeKey: "distinguer_homophones_a_a", expectation: "controlled_production", sourceNodeKeys: ["homophone_a_a"] },
  { targetNodeKey: "distinguer_homophones_et_est", expectation: "receptive", sourceNodeKeys: ["homophone_et_est"] },
  { targetNodeKey: "distinguer_homophones_et_est", expectation: "controlled_production", sourceNodeKeys: ["homophone_et_est"] },
  { targetNodeKey: "distinguer_homophones_son_sont", expectation: "receptive", sourceNodeKeys: ["homophone_son_sont"] },
  { targetNodeKey: "distinguer_homophones_son_sont", expectation: "controlled_production", sourceNodeKeys: ["homophone_son_sont"] },
  { targetNodeKey: "distinguer_homophones_on_ont", expectation: "receptive", sourceNodeKeys: ["homophone_on_ont"] },
  { targetNodeKey: "distinguer_homophones_on_ont", expectation: "controlled_production", sourceNodeKeys: ["homophone_on_ont"] },
  { targetNodeKey: "distinguer_homophones_ce_se", expectation: "receptive", sourceNodeKeys: ["homophone_ce_se"] },
  { targetNodeKey: "distinguer_homophones_ce_se", expectation: "controlled_production", sourceNodeKeys: ["homophone_ce_se"] },
  { targetNodeKey: "distinguer_homophones_ces_ses", expectation: "receptive", sourceNodeKeys: ["homophone_ces_ses"] },
  { targetNodeKey: "distinguer_homophones_ces_ses", expectation: "controlled_production", sourceNodeKeys: ["homophone_ces_ses"] },
  { targetNodeKey: "distinguer_homophones_ou_ou", expectation: "receptive", sourceNodeKeys: ["homophone_ou_ou"] },
  { targetNodeKey: "distinguer_homophones_ou_ou", expectation: "controlled_production", sourceNodeKeys: ["homophone_ou_ou"] },
  { targetNodeKey: "distinguer_infinitif_participe_ecrit", expectation: "receptive", sourceNodeKeys: ["terminaison_er_e_ez"] },
  { targetNodeKey: "distinguer_infinitif_participe_ecrit", expectation: "controlled_production", sourceNodeKeys: ["terminaison_er_e_ez"] },
  { targetNodeKey: "maintenir_orthographe_grammaticale_phrase", expectation: "receptive", sourceNodeKeys: ["chaine_accords_phrase", "revision_present_gn"] },
  { targetNodeKey: "maintenir_orthographe_grammaticale_phrase", expectation: "controlled_production", sourceNodeKeys: ["chaine_accords_phrase", "revision_present_gn"] },
] as const;

export const REUSED_DIAGNOSTIC_ITEM_PREFIX = "review-draft-v1";

export async function buildReusedDiagnosticDraftItems(
  taxonomy: TaxonomyCandidate,
  sourceItems: readonly GeneratedItem[],
): Promise<CanonicalDiagnosticBankItem[]> {
  const nodeByKey = new Map(taxonomy.nodes.map((node) => [node.key, node]));
  const knownNodeKeys = new Set(nodeByKey.keys());
  const usedPrompts = new Set<string>();
  const result: CanonicalDiagnosticBankItem[] = [];

  for (const plan of PLANS) {
    const node = nodeByKey.get(plan.targetNodeKey);
    if (!node) throw new Error(`Reuse target is absent from taxonomy: ${plan.targetNodeKey}`);
    const evidence = node.evidence.find((candidate) => candidate.expectation === plan.expectation);
    if (!evidence) throw new Error(`Reuse target lacks ${plan.expectation}: ${plan.targetNodeKey}`);
    const sectionKey = sectionForStrand(node.strand as Parameters<typeof sectionForStrand>[0]);
    if (!sectionKey) throw new Error(`Reuse target is outside the diagnostic: ${plan.targetNodeKey}`);
    const candidates = sourceItems.filter((item) =>
      plan.sourceNodeKeys.includes(item.nodeKey)
      && (plan.expectation === "receptive"
        ? item.responseType === "mcq"
        : item.responseType !== "mcq" && Boolean(item.correctAnswer ?? item.acceptableAnswers[0]))
      && (!plan.promptPattern || plan.promptPattern.test(item.promptFr))
      && !usedPrompts.has(item.promptFr)
    );
    const chosen = chooseTierCandidates(candidates);
    if (chosen.length !== DIAGNOSTIC_DIFFICULTY_TIERS.length) {
      throw new Error(
        `Reuse plan has ${chosen.length}/3 structurally usable items: ${plan.targetNodeKey}:${plan.expectation}`,
      );
    }
    for (let index = 0; index < chosen.length; index += 1) {
      const source = chosen[index];
      const difficultyTier = DIAGNOSTIC_DIFFICULTY_TIERS[index];
      const promptFamily = diagnosticPromptFamilies(sectionKey, plan.expectation)[index];
      const correctAnswer = source.correctAnswer ?? source.acceptableAnswers[0];
      const raw: GeneratedItem = {
        ...source,
        nodeKey: node.key,
        strand: node.strand,
        modality: diagnosticItemModality(node, evidence),
        learnerMode: "shared",
        correctAnswer,
        acceptableAnswers: source.acceptableAnswers ?? [],
        validatorType: source.responseType === "mcq" ? "exact" : "exact",
        validatorConfig: undefined,
        difficulty: diagnosticDifficultyForTier(difficultyTier),
      };
      const gated = await runGates(raw, {
        knownNodeKeys,
        knownMisconceptionKeys: new Set(),
      });
      if (!gated.item || gated.gates.verdict === "rejected"
        || !gated.gates.gate1_schema
        || !gated.gates.gate1_invariants.ok
        || !gated.gates.gate2_answer_key.ok) {
        throw new Error(`Reused item failed hard QC: ${plan.targetNodeKey}:${difficultyTier}`);
      }
      usedPrompts.add(gated.item.promptFr);
      result.push({
        itemKey: [
          REUSED_DIAGNOSTIC_ITEM_PREFIX,
          plan.targetNodeKey,
          plan.expectation,
          difficultyTier,
        ].join(":"),
        item: gated.item,
        evidenceKey: evidence.key,
        evidenceExpectation: plan.expectation,
        sectionKey,
        promptFamily,
        difficultyTier,
        qcGates: gated.gates,
        reviewStatus: "needs_human_review",
      });
    }
  }

  return result;
}

function chooseTierCandidates(candidates: readonly GeneratedItem[]) {
  const remaining = [...candidates];
  return [25, 50, 75].flatMap((target) => {
    remaining.sort((left, right) =>
      Math.abs((left.difficulty ?? 50) - target)
      - Math.abs((right.difficulty ?? 50) - target)
    );
    const item = remaining.shift();
    return item ? [item] : [];
  });
}
