/**
 * Seed items for the past-narration slice (Roadmap Phase 11, F3 — seed set).
 *
 * Hand-authored to bootstrap the slice before the LLM generation pipeline runs.
 * Every item carries a deterministic validator (conjugator or exact/MCQ) so its
 * answer key is machine-checkable by QC Gate 2 — the same contract the
 * LLM-generated volume will pass through. MCQ distractors map to misconceptions,
 * so a wrong pick is itself diagnostic evidence.
 */

import type { CefrLevel, LearnerMode, Modality, Strand } from "@/lib/graph/types";
import type { ValidatorType } from "@/lib/linguistic/types";

export type SeedChoice = {
  text: string;
  correct: boolean;
  misconceptionKey?: string;
  feedbackFr?: string;
};

export type SeedItem = {
  key: string;
  nodeKey: string;
  strand: Strand;
  modality: Modality;
  learnerMode: LearnerMode;
  responseType: "mcq" | "short_answer" | "cloze" | "transform";
  promptFr: string;
  instructionsFr?: string;
  correctAnswer?: string;
  acceptableAnswers?: string[];
  validatorType: ValidatorType;
  validatorConfig?: Record<string, unknown>;
  cefrLevel?: CefrLevel;
  nativeGradeBand?: number;
  difficulty?: number;
  choices?: SeedChoice[];
};

export const ITEMS: SeedItem[] = [
  // ── Conjugation (conjugator-verified) ──
  {
    key: "pn_present_parler_2s", nodeKey: "present_indicatif", strand: "conjugaison",
    modality: "grammar_analysis", learnerMode: "shared", responseType: "short_answer",
    promptFr: "Conjugue « parler » au présent à la 2e personne du singulier (tu …).",
    correctAnswer: "parles", validatorType: "conjugator",
    validatorConfig: { verb: "parler", tense: "present", person: "2s" },
    cefrLevel: "A1", nativeGradeBand: 6, difficulty: 20,
  },
  {
    key: "pn_imparfait_faire_3s", nodeKey: "imparfait_formation", strand: "conjugaison",
    modality: "grammar_analysis", learnerMode: "shared", responseType: "short_answer",
    promptFr: "Conjugue « faire » à l'imparfait à la 3e personne du singulier (il …).",
    correctAnswer: "faisait", validatorType: "conjugator",
    validatorConfig: { verb: "faire", tense: "imparfait", person: "3s" },
    cefrLevel: "A2", nativeGradeBand: 7, difficulty: 40,
  },
  {
    key: "pn_pc_manger_1s", nodeKey: "passe_compose_avoir", strand: "conjugaison",
    modality: "grammar_analysis", learnerMode: "shared", responseType: "transform",
    promptFr: "Mets au passé composé : « je (manger) une pomme ». Écris « j'… ».",
    correctAnswer: "ai mangé", acceptableAnswers: ["j'ai mangé"],
    validatorType: "conjugator",
    validatorConfig: { verb: "manger", tense: "passe_compose", person: "1s" },
    cefrLevel: "A2", nativeGradeBand: 7, difficulty: 45,
  },
  {
    key: "pn_pc_etre_aller_3sf", nodeKey: "passe_compose_etre", strand: "conjugaison",
    modality: "grammar_analysis", learnerMode: "shared", responseType: "transform",
    promptFr: "« Elle (aller) au marché. » Mets au passé composé.",
    correctAnswer: "est allée", validatorType: "conjugator",
    validatorConfig: { verb: "aller", tense: "passe_compose", person: "3s", gender: "f" },
    cefrLevel: "B1", nativeGradeBand: 8, difficulty: 60,
  },
  {
    key: "pn_pp_avoir_cod_cueillir", nodeKey: "accord_pp_avoir_cod", strand: "orthographe_grammaticale",
    modality: "writing", learnerMode: "shared", responseType: "cloze",
    promptFr: "Complète en accordant : « Les fleurs que j'(cueillir) sont belles. » Écris « ai … ».",
    correctAnswer: "ai cueillies", validatorType: "conjugator",
    validatorConfig: { verb: "cueillir", tense: "passe_compose", person: "1s", codBefore: { gender: "f", number: "p" } },
    cefrLevel: "B2", nativeGradeBand: 9, difficulty: 85,
  },

  // ── MCQ (one correct; distractors tagged with misconceptions) ──
  {
    key: "pn_aux_aller", nodeKey: "auxiliaire_choix", strand: "conjugaison",
    modality: "grammar_analysis", learnerMode: "shared", responseType: "mcq",
    promptFr: "Quel auxiliaire faut-il pour conjuguer « aller » au passé composé ?",
    validatorType: "exact", cefrLevel: "A2", nativeGradeBand: 7, difficulty: 35,
    choices: [
      { text: "être", correct: true, feedbackFr: "Oui : « je suis allé(e) »." },
      { text: "avoir", correct: false, misconceptionKey: "wrong_auxiliary", feedbackFr: "Non : « j'ai allé » est incorrect." },
    ],
  },
  {
    key: "pn_accord_etre_elles", nodeKey: "accord_pp_etre", strand: "orthographe_grammaticale",
    modality: "grammar_analysis", learnerMode: "shared", responseType: "mcq",
    promptFr: "Choisis la forme correcte : « Elles sont ___ au cinéma. »",
    validatorType: "exact", cefrLevel: "B1", nativeGradeBand: 8, difficulty: 65,
    choices: [
      { text: "allées", correct: true, feedbackFr: "Accord avec « elles » (féminin pluriel)." },
      { text: "allé", correct: false, misconceptionKey: "no_pp_agreement_etre", feedbackFr: "Le participe doit s'accorder avec le sujet." },
      { text: "allés", correct: false, misconceptionKey: "no_pp_agreement_etre", feedbackFr: "Bon nombre, mauvais genre." },
    ],
  },
  {
    key: "pn_cod_marie", nodeKey: "cod_identification", strand: "grammaire_syntaxe",
    modality: "grammar_analysis", learnerMode: "shared", responseType: "mcq",
    promptFr: "Dans « Marie mange une pomme », quel est le COD ?",
    validatorType: "exact", cefrLevel: "A2", nativeGradeBand: 7, difficulty: 40,
    choices: [
      { text: "une pomme", correct: true, feedbackFr: "Marie mange quoi ? une pomme → COD." },
      { text: "Marie", correct: false, feedbackFr: "« Marie » est le sujet." },
      { text: "mange", correct: false, feedbackFr: "« mange » est le verbe." },
    ],
  },
  {
    key: "pn_homophone_a", nodeKey: "homophone_a_a", strand: "orthographe_grammaticale",
    modality: "grammar_analysis", learnerMode: "shared", responseType: "mcq",
    promptFr: "Complète : « Il ___ mangé une pomme. »",
    validatorType: "exact", cefrLevel: "A2", nativeGradeBand: 7, difficulty: 30,
    choices: [
      { text: "a", correct: true, feedbackFr: "« a » = verbe avoir (il a)." },
      { text: "à", correct: false, feedbackFr: "« à » est une préposition." },
    ],
  },
  {
    key: "pn_pc_vs_imp", nodeKey: "pc_vs_imparfait", strand: "conjugaison",
    modality: "grammar_analysis", learnerMode: "shared", responseType: "mcq",
    promptFr: "« Quand j'étais petit, je ___ souvent au parc. »",
    validatorType: "exact", cefrLevel: "B1", nativeGradeBand: 8, difficulty: 70,
    choices: [
      { text: "allais", correct: true, feedbackFr: "Habitude dans le passé → imparfait." },
      { text: "suis allé", correct: false, misconceptionKey: "pc_imparfait_confusion", feedbackFr: "Le passé composé marque une action ponctuelle." },
    ],
  },
  {
    key: "pn_terminaison_er_e", nodeKey: "terminaison_er_e_ez", strand: "orthographe_grammaticale",
    modality: "grammar_analysis", learnerMode: "shared", responseType: "mcq",
    promptFr: "Complète : « J'ai ___ une pomme. »",
    validatorType: "exact", cefrLevel: "B1", nativeGradeBand: 8, difficulty: 55,
    choices: [
      { text: "mangé", correct: true, feedbackFr: "Après l'auxiliaire → participe passé (-é)." },
      { text: "manger", correct: false, misconceptionKey: "er_e_confusion", feedbackFr: "« manger » est l'infinitif." },
      { text: "mangez", correct: false, feedbackFr: "« -ez » = 2e personne du pluriel." },
    ],
  },
];
