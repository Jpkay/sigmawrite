/** Shared types of the editorial pipeline (roadmap Phase F + H). */

export type GradeBand = "cm" | "6e-5e" | "4e-3e" | "lycee";
export type EditorialMode = "live" | "library";
export type EditorialKind = "chapter" | "passage" | "dictation";

export const EDITORIAL_PIPELINE_VERSION = "editorial-1.0.0";

/** Placeholder written by the model instead of the hero's name (H.2). Never the real name. */
export const HERO_PLACEHOLDER = "{{HEROS}}";

export type EditorialRole =
  | "architect"
  | "author"
  | "line_editor"
  | "reviewer_style"
  | "reviewer_targets"
  | "reviewer_proof"
  | "reviewer_safety"
  | "reviewer_dictation"
  | "judge_pairwise"
  | "editor_in_chief"
  | "summarizer"
  | "auditor"
  | "practice_writer";

export type TenseKey =
  | "present"
  | "imparfait"
  | "passe_compose"
  | "futur_simple"
  | "passe_simple"
  | "conditionnel_present"
  | "subjonctif_present"
  | "imperatif_present"
  | "plus_que_parfait";

export const TENSE_LABELS: Record<TenseKey, string> = {
  present: "présent de l'indicatif",
  imparfait: "imparfait",
  passe_compose: "passé composé",
  futur_simple: "futur simple",
  passe_simple: "passé simple",
  conditionnel_present: "conditionnel présent",
  subjonctif_present: "subjonctif présent",
  imperatif_present: "impératif présent",
  plus_que_parfait: "plus-que-parfait",
};

/** Curriculum order (roadmap G.4): which tenses may be targeted in each band. */
export const TENSES_BY_BAND: Record<GradeBand, TenseKey[]> = {
  cm: ["present", "passe_compose", "imparfait", "futur_simple"],
  "6e-5e": ["present", "passe_compose", "imparfait", "futur_simple", "passe_simple", "conditionnel_present", "imperatif_present"],
  "4e-3e": ["present", "passe_compose", "imparfait", "futur_simple", "passe_simple", "conditionnel_present", "imperatif_present", "plus_que_parfait", "subjonctif_present"],
  lycee: ["present", "passe_compose", "imparfait", "futur_simple", "passe_simple", "conditionnel_present", "imperatif_present", "plus_que_parfait", "subjonctif_present"],
};

export function gradeBandFor(grade: number): GradeBand {
  if (grade <= 5) return "cm";
  if (grade <= 7) return "6e-5e";
  if (grade <= 9) return "4e-3e";
  return "lycee";
}

export type TargetLemma = {
  lemma: string;
  kind: "new" | "due";
  /** Optional child-friendly definition from the vetted base (never written by the model). */
  definition?: string;
  partOfSpeech?: "nom" | "verbe" | "adjectif" | "adverbe" | "autre";
};

export type Usage = { inputTokens: number; outputTokens: number; costUsd: number; reasoningTokens?: number; cachedTokens?: number };
