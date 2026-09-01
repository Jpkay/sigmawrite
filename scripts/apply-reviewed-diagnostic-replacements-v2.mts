import { readFileSync, writeFileSync } from "node:fs";
import type { FrenchTaxonomyV2Artifact } from "../src/lib/taxonomy/french-v2";
import {
  validateCanonicalDiagnosticBank,
  type CanonicalDiagnosticBankArtifact,
  type CanonicalDiagnosticBankItem,
} from "../src/lib/diagnostic/item-bank";

/**
 * Deterministic replacements for the eight diagnostic-v2 items rejected in
 * staging review on 2026-09-01. The wording below incorporates the submitted
 * educator feedback, but every replacement deliberately returns to
 * `needs_human_review`; this script never manufactures approval provenance.
 */

const bankPath = process.argv[2] ?? "generated/diagnostic-bank-v2.json";
const taxonomy = JSON.parse(
  readFileSync("generated/french-taxonomy-v2.json", "utf8"),
) as FrenchTaxonomyV2Artifact;
const bank = JSON.parse(
  readFileSync(bankPath, "utf8"),
) as CanonicalDiagnosticBankArtifact;

type Replacement = {
  rejectedItemKey: string;
  replacementItemKey: string;
  item: Partial<CanonicalDiagnosticBankItem["item"]> & Pick<CanonicalDiagnosticBankItem["item"], "promptFr" | "responseType" | "validatorType">;
};

const replacements: Replacement[] = [
  {
    rejectedItemKey: "review-draft-v1:distinguer_homophones_a_a:receptive:stretch",
    replacementItemKey: "local-remediation-v2:distinguer_homophones_a_a:receptive:stretch",
    item: {
      responseType: "mcq",
      validatorType: "exact",
      promptFr: "Dans quelle phrase « a » et « à » sont-ils tous les deux correctement écrits ?",
      correctAnswer: undefined,
      acceptableAnswers: [],
      choices: [
        { text: "Mina a pensé à prévenir son équipe.", correct: true, feedbackFr: "« a » est le verbe avoir et « à » est la préposition." },
        { text: "Mina à pensé à prévenir son équipe.", correct: false, feedbackFr: "Devant « pensé », il faut le verbe avoir : « a » sans accent." },
        { text: "Mina a pensé a prévenir son équipe.", correct: false, feedbackFr: "Devant l’infinitif « prévenir », il faut la préposition « à » avec accent." },
        { text: "Mina à pensé a prévenir son équipe.", correct: false, feedbackFr: "Les deux homophones sont inversés." },
      ],
    },
  },
  {
    rejectedItemKey: "local-grammar-v1:construction_subordonnee_relative:controlled_production:foundation",
    replacementItemKey: "local-remediation-v2:construction_subordonnee_relative:controlled_production:foundation",
    item: {
      responseType: "cloze",
      validatorType: "exact",
      promptFr: "Complète avec une subordonnée relative introduite par « qui » : « Les élèves ___ ont réussi l’exercice. » Utilise le verbe « réviser ».",
      correctAnswer: "qui ont révisé",
      acceptableAnswers: ["qui ont révisé"],
      choices: undefined,
    },
  },
  {
    rejectedItemKey: "local-grammar-v1:construction_nominalisation:controlled_production:foundation",
    replacementItemKey: "local-remediation-v2:construction_nominalisation:controlled_production:foundation",
    item: {
      responseType: "cloze",
      validatorType: "exact",
      promptFr: "Remplace le verbe « décider » par le nom de la même famille : « La ___ du conseil de fermer la route a été annoncée. »",
      correctAnswer: "décision",
      acceptableAnswers: ["décision"],
      choices: undefined,
    },
  },
  {
    rejectedItemKey: "local-grammar-v1:relation_contraste:receptive:stretch",
    replacementItemKey: "local-remediation-v2:relation_contraste:receptive:stretch",
    item: {
      responseType: "mcq",
      validatorType: "exact",
      promptFr: "Dans « Le sentier est escarpé ; pourtant, il reste accessible aux débutants », que signale « pourtant » ?",
      correctAnswer: undefined,
      acceptableAnswers: [],
      choices: [
        { text: "Un contraste entre les deux informations", correct: true },
        { text: "La cause de la première information", correct: false },
        { text: "Un exemple qui précise la première information", correct: false },
      ],
    },
  },
  {
    rejectedItemKey: "local-grammar-v1:relation_exemple_reformulation:controlled_production:foundation",
    replacementItemKey: "local-remediation-v2:relation_exemple_reformulation:controlled_production:foundation",
    item: {
      responseType: "short_answer",
      validatorType: "exact",
      promptFr: "Réécris en une seule phrase en ajoutant « par exemple » : « Plusieurs insectes pollinisent les fleurs. Les abeilles et les papillons. »",
      correctAnswer: "Plusieurs insectes pollinisent les fleurs, par exemple les abeilles et les papillons.",
      acceptableAnswers: [
        "Plusieurs insectes pollinisent les fleurs, par exemple les abeilles et les papillons.",
        "Plusieurs insectes, par exemple les abeilles et les papillons, pollinisent les fleurs.",
      ],
      choices: undefined,
    },
  },
  {
    rejectedItemKey: "local-grammar-v1:construction_progression_thematique:receptive:core",
    replacementItemKey: "local-remediation-v2:construction_progression_thematique:receptive:core",
    item: {
      responseType: "mcq",
      validatorType: "exact",
      promptFr: "Quel enchaînement reprend le nouvel élément de la première phrase pour en faire le thème de la suivante ?",
      correctAnswer: undefined,
      acceptableAnswers: [],
      choices: [
        { text: "Le quartier inaugure un jardin partagé. Ce nouvel espace accueillera des ateliers.", correct: true },
        { text: "Le quartier inaugure un jardin partagé. Il borde la rivière depuis longtemps.", correct: false },
        { text: "Le quartier inaugure un jardin partagé. Les volcans peuvent rester endormis.", correct: false },
      ],
    },
  },
  {
    rejectedItemKey: "local-grammar-v1:construction_progression_thematique:controlled_production:core",
    replacementItemKey: "local-remediation-v2:construction_progression_thematique:controlled_production:core",
    item: {
      responseType: "cloze",
      validatorType: "exact",
      promptFr: "Complète la deuxième phrase avec un groupe démonstratif qui reprend « une nouvelle piste cyclable » : « Une nouvelle piste cyclable traverse le quartier. ___ sécurise les déplacements. »",
      correctAnswer: "Cet aménagement",
      acceptableAnswers: ["Cet aménagement", "Cette voie"],
      choices: undefined,
    },
  },
  {
    rejectedItemKey: "local-grammar-v1:construction_progression_thematique:controlled_production:stretch",
    replacementItemKey: "local-remediation-v2:construction_progression_thematique:controlled_production:stretch",
    item: {
      responseType: "transform",
      validatorType: "exact",
      promptFr: "Réécris ces informations en deux phrases. La seconde doit reprendre « des panneaux solaires » par un groupe démonstratif : « Des panneaux solaires couvrent le toit. Les panneaux solaires produisent une partie de l’électricité du bâtiment. »",
      correctAnswer: "Des panneaux solaires couvrent le toit. Ces équipements produisent une partie de l’électricité du bâtiment.",
      acceptableAnswers: [
        "Des panneaux solaires couvrent le toit. Ces équipements produisent une partie de l’électricité du bâtiment.",
        "Des panneaux solaires couvrent le toit. Ces installations produisent une partie de l’électricité du bâtiment.",
      ],
      choices: undefined,
    },
  },
];

const replacementByRejectedKey = new Map(
  replacements.map((replacement) => [replacement.rejectedItemKey, replacement]),
);
const expectedRejectedKeys = [...replacementByRejectedKey.keys()].sort();
const actualRejectedKeys = bank.items
  .filter((entry) => entry.reviewStatus === "rejected" || entry.qcGates.verdict === "rejected")
  .map((entry) => entry.itemKey)
  .sort();
const alreadyApplied = replacements.every((replacement) =>
  bank.items.some((entry) => entry.itemKey === replacement.replacementItemKey)
) && actualRejectedKeys.length === 0;

if (!alreadyApplied && JSON.stringify(actualRejectedKeys) !== JSON.stringify(expectedRejectedKeys)) {
  throw new Error(
    `Replacement source mismatch. Expected ${JSON.stringify(expectedRejectedKeys)}, received ${JSON.stringify(actualRejectedKeys)}.`,
  );
}

const remediatedItems = alreadyApplied ? bank.items : bank.items.map((entry) => {
  const replacement = replacementByRejectedKey.get(entry.itemKey);
  if (!replacement) return entry;
  return {
    ...entry,
    itemKey: replacement.replacementItemKey,
    item: { ...entry.item, ...replacement.item },
    qcGates: {
      gate1_schema: true,
      gate1_invariants: { ok: true, violations: [] },
      gate0_computed: { applied: false },
      gate2_answer_key: { ok: true },
      gate3_ensemble: { agreement: 0, agrees: false },
      verdict: "needs_human_review",
    },
    reviewStatus: "needs_human_review",
    review: undefined,
  } satisfies CanonicalDiagnosticBankItem;
});

const remediated = {
  ...bank,
  generatedAt: alreadyApplied ? bank.generatedAt : new Date().toISOString(),
  items: remediatedItems,
};
const validation = validateCanonicalDiagnosticBank(remediated, taxonomy.taxonomy);
const rejectedIssues = validation.issues.filter((issue) => issue.includes("rejected item"));
if (rejectedIssues.length) {
  throw new Error(`Rejected items remain after replacement: ${rejectedIssues.join("; ")}`);
}

writeFileSync(bankPath, `${JSON.stringify({ ...remediated, manifest: validation.manifest }, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({
  bankPath,
  alreadyApplied,
  replacements: replacements.length,
  itemCount: remediated.items.length,
  checksum: validation.manifest.checksum,
  publishReady: validation.valid,
  remainingIssues: validation.issues.length,
  note: "Every replacement is pending human review; no approval provenance was synthesized.",
}, null, 2)}\n`);
