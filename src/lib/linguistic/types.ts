/**
 * Deterministic French linguistic engine — types (Roadmap Phase 8).
 *
 * This is the ground-truth layer: it verifies LLM-authored content (QC Gate 2)
 * and grades live student answers. The LLM is never the source of truth for
 * anything checkable here. Grammar/spelling/agreement go through a self-hosted
 * grammar-checker service (LanguageTool / Grammalecte); conjugation through a
 * deterministic conjugator.
 */

/** One issue reported by the grammar-checker service. */
export type GrammarMatch = {
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  ruleId: string;
  ruleDescription?: string;
  category: string;
  issueType?: string;
  replacements: string[];
};

export type GrammarCheckResult = {
  text: string;
  language: string;
  matches: GrammarMatch[];
  /** No issues found. */
  clean: boolean;
};

export type GrammarCheckOptions = {
  language?: string; // default 'fr'
  level?: "default" | "picky";
  enabledRules?: string[];
  disabledRules?: string[];
  enabledCategories?: string[];
};

export interface FrenchGrammarChecker {
  check(text: string, opts?: GrammarCheckOptions): Promise<GrammarCheckResult>;
}

// ─────────────────────────── Answer validation ─────────────────────────────
// Mirrors competency_items.validator_type (migration 0008). The unified
// validateAnswer() routes on this — it is the contract QC Gate 2 calls to
// confirm a correct answer passes and distractors fail.

export type ValidatorType =
  | "exact"
  | "regex"
  | "conjugator"
  | "agreement"
  | "grammalecte"
  | "rubric"
  | "llm_assisted";

export type ValidationSpec = {
  validatorType: ValidatorType;
  correctAnswer?: string;
  acceptableAnswers?: string[];
  /** e.g. {"verb":"aller","tense":"passe_compose","person":"3s","gender":"f"} */
  config?: Record<string, unknown>;
  /** Comparison knobs for exact match. */
  caseSensitive?: boolean;
  ignorePunctuation?: boolean;
};

export type ValidationResult = {
  pass: boolean;
  /** The normalized form actually compared (for transparency/debugging). */
  normalized?: string;
  /** Grammar issues found (for grammar/agreement validators). */
  ruleHits?: GrammarMatch[];
  /** Which validator produced the verdict, and why. */
  validator: ValidatorType;
  reason?: string;
};
