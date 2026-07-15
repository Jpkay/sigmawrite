import { runGates } from "@/lib/ai/item-generation/pipeline";
import type { GeneratedItem } from "@/lib/ai/item-generation/schemas";
import type { Agreement, Gender, Person, Tense } from "@/lib/linguistic/conjugation";
import type { TaxonomyCandidate } from "@/lib/taxonomy/validate";
import {
  diagnosticDifficultyForTier,
  diagnosticPromptFamilies,
} from "./item-authoring";
import type {
  CanonicalDiagnosticBankItem,
  DiagnosticDifficultyTier,
} from "./item-bank";

type ComputedConjugationPlan = {
  nodeKey: string;
  difficultyTier: DiagnosticDifficultyTier;
  responseType: GeneratedItem["responseType"];
  promptFr: string;
  verb: string;
  tense: Tense;
  person: Person;
  gender?: Gender;
  codBefore?: Agreement;
};

const PLANS: readonly ComputedConjugationPlan[] = [
  {
    nodeKey: "produire_present_indicatif",
    difficultyTier: "foundation",
    responseType: "short_answer",
    promptFr: "Conjugue « parler » au présent avec « tu ». Écris seulement la forme verbale.",
    verb: "parler",
    tense: "present",
    person: "2s",
  },
  {
    nodeKey: "produire_present_indicatif",
    difficultyTier: "core",
    responseType: "cloze",
    promptFr: "Complète au présent : Nous ___ ce travail aujourd’hui. (finir) Écris seulement la forme verbale.",
    verb: "finir",
    tense: "present",
    person: "1p",
  },
  {
    nodeKey: "produire_present_indicatif",
    difficultyTier: "stretch",
    responseType: "transform",
    promptFr: "Remplace « je viens » par la forme correspondant à « ils », au présent. Écris seulement la forme verbale.",
    verb: "venir",
    tense: "present",
    person: "3p",
  },
  {
    nodeKey: "produire_imparfait",
    difficultyTier: "foundation",
    responseType: "short_answer",
    promptFr: "Conjugue « parler » à l’imparfait avec « je ». Écris seulement la forme verbale.",
    verb: "parler",
    tense: "imparfait",
    person: "1s",
  },
  {
    nodeKey: "produire_imparfait",
    difficultyTier: "core",
    responseType: "cloze",
    promptFr: "Complète à l’imparfait : Nous ___ ensemble chaque dimanche. (manger) Écris seulement la forme verbale.",
    verb: "manger",
    tense: "imparfait",
    person: "1p",
  },
  {
    nodeKey: "produire_imparfait",
    difficultyTier: "stretch",
    responseType: "transform",
    promptFr: "Mets « ils voient » à l’imparfait. Écris seulement la forme verbale.",
    verb: "voir",
    tense: "imparfait",
    person: "3p",
  },
  {
    nodeKey: "produire_passe_compose",
    difficultyTier: "foundation",
    responseType: "short_answer",
    promptFr: "Conjugue « parler » au passé composé avec « je ». Écris seulement le groupe verbal.",
    verb: "parler",
    tense: "passe_compose",
    person: "1s",
  },
  {
    nodeKey: "produire_passe_compose",
    difficultyTier: "core",
    responseType: "cloze",
    promptFr: "Complète au passé composé : Elle ___ hier soir. (venir) Écris seulement le groupe verbal.",
    verb: "venir",
    tense: "passe_compose",
    person: "3s",
    gender: "f",
  },
  {
    nodeKey: "produire_passe_compose",
    difficultyTier: "stretch",
    responseType: "transform",
    promptFr: "Mets « ils prennent » au passé composé. Écris seulement le groupe verbal.",
    verb: "prendre",
    tense: "passe_compose",
    person: "3p",
  },
  {
    nodeKey: "accorder_participe_etre",
    difficultyTier: "foundation",
    responseType: "short_answer",
    promptFr: "Conjugue « aller » au passé composé avec « elle ». Écris seulement le groupe verbal et fais l’accord nécessaire.",
    verb: "aller",
    tense: "passe_compose",
    person: "3s",
    gender: "f",
  },
  {
    nodeKey: "accorder_participe_etre",
    difficultyTier: "core",
    responseType: "cloze",
    promptFr: "Complète : Ils ___ tôt ce matin. (venir, passé composé) Écris seulement le groupe verbal.",
    verb: "venir",
    tense: "passe_compose",
    person: "3p",
    gender: "m",
  },
  {
    nodeKey: "accorder_participe_etre",
    difficultyTier: "stretch",
    responseType: "transform",
    promptFr: "Mets « elles partent » au passé composé. Écris seulement le groupe verbal et conserve le sujet féminin pluriel.",
    verb: "partir",
    tense: "passe_compose",
    person: "3p",
    gender: "f",
  },
  {
    nodeKey: "accorder_participe_avoir_cod",
    difficultyTier: "foundation",
    responseType: "short_answer",
    promptFr: "Complète : Les pommes que j’___ étaient sucrées. (manger, passé composé) Écris seulement le groupe verbal.",
    verb: "manger",
    tense: "passe_compose",
    person: "1s",
    codBefore: { gender: "f", number: "p" },
  },
  {
    nodeKey: "accorder_participe_avoir_cod",
    difficultyTier: "core",
    responseType: "cloze",
    promptFr: "Complète : La chanson qu’ils ___ passe à la radio. (écouter, passé composé) Écris seulement le groupe verbal.",
    verb: "écouter",
    tense: "passe_compose",
    person: "3p",
    codBefore: { gender: "f", number: "s" },
  },
  {
    nodeKey: "accorder_participe_avoir_cod",
    difficultyTier: "stretch",
    responseType: "transform",
    promptFr: "Complète : Les devoirs que tu ___ sont précis. (finir, passé composé) Écris seulement le groupe verbal.",
    verb: "finir",
    tense: "passe_compose",
    person: "2s",
    codBefore: { gender: "m", number: "p" },
  },
] as const;

export const DETERMINISTIC_DIAGNOSTIC_ITEM_PREFIX = "computed-conjugation-v1";

export async function buildDeterministicDiagnosticItems(
  taxonomy: TaxonomyCandidate,
): Promise<CanonicalDiagnosticBankItem[]> {
  const nodeByKey = new Map(taxonomy.nodes.map((node) => [node.key, node]));
  const knownNodeKeys = new Set(nodeByKey.keys());
  const results: CanonicalDiagnosticBankItem[] = [];

  for (const plan of PLANS) {
    const node = nodeByKey.get(plan.nodeKey);
    if (!node || node.strand !== "conjugaison") {
      throw new Error(`Deterministic item node is missing or incompatible: ${plan.nodeKey}`);
    }
    const evidence = node.evidence.find((candidate) =>
      candidate.expectation === "controlled_production"
    );
    if (!evidence) {
      throw new Error(`Controlled-production evidence is missing: ${plan.nodeKey}`);
    }
    const familyIndex = plan.difficultyTier === "foundation"
      ? 0
      : plan.difficultyTier === "core"
        ? 1
        : 2;
    const promptFamily = diagnosticPromptFamilies(
      "conjugation",
      "controlled_production",
    )[familyIndex];
    const validatorConfig = {
      verb: plan.verb,
      tense: plan.tense,
      person: plan.person,
      ...(plan.gender ? { gender: plan.gender } : {}),
      ...(plan.codBefore ? { codBefore: plan.codBefore } : {}),
    };
    const raw: GeneratedItem = {
      nodeKey: node.key,
      strand: node.strand,
      modality: "writing",
      learnerMode: "shared",
      responseType: plan.responseType,
      promptFr: plan.promptFr,
      instructionsFr: "Respecte les accents et écris uniquement la forme demandée.",
      acceptableAnswers: [],
      validatorType: "conjugator",
      validatorConfig,
      cefrLevel: node.mappings.find((mapping) => mapping.framework === "cefr")
        ?.levelMin as GeneratedItem["cefrLevel"],
      difficulty: diagnosticDifficultyForTier(plan.difficultyTier),
    };
    const gated = await runGates(raw, {
      knownNodeKeys,
      knownMisconceptionKeys: new Set(),
    });
    if (!gated.item || gated.gates.verdict !== "auto_approved"
      || !gated.gates.gate0_computed.applied
      || !gated.gates.gate2_answer_key.ok) {
      throw new Error(
        `Deterministic item failed QC: ${plan.nodeKey}:${plan.difficultyTier}`,
      );
    }
    results.push({
      itemKey: [
        DETERMINISTIC_DIAGNOSTIC_ITEM_PREFIX,
        plan.nodeKey,
        plan.difficultyTier,
      ].join(":"),
      item: gated.item,
      evidenceKey: evidence.key,
      evidenceExpectation: "controlled_production",
      sectionKey: "conjugation",
      promptFamily,
      difficultyTier: plan.difficultyTier,
      qcGates: gated.gates,
      reviewStatus: "auto_approved",
    });
  }

  return results;
}
