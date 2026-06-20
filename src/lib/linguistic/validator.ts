/**
 * Unified answer validator (Roadmap Phase 8) — the contract QC Gate 2 and live
 * grading both call. Routes on validator_type (migration 0008):
 *
 *   exact / regex       — deterministic string checks (no service)
 *   grammalecte / agreement — grammar-checker service: a *correct* answer is
 *                         clean (no rule hits); used to verify item answer keys
 *                         and to grade free-text production.
 *   conjugator          — deterministic conjugation check (Phase 8 next; routed
 *                         here so callers are stable).
 *   rubric / llm_assisted — handled elsewhere (rubric scoring / LLM judge).
 *
 * Gate-2 self-consistency: the item's correct_answer must validate true and each
 * distractor must validate false. validateAnswer is the primitive that makes that
 * deterministic.
 */

import type {
  FrenchGrammarChecker,
  ValidationResult,
  ValidationSpec,
} from "./types";

/** Lowercase, collapse whitespace, optional case/punctuation. Accents kept —
 *  they are meaningful in French and frequently the thing under test. */
export function normalize(
  s: string,
  { caseSensitive = false, ignorePunctuation = false } = {}
): string {
  let out = s.normalize("NFC").trim().replace(/\s+/g, " ");
  if (ignorePunctuation) out = out.replace(/[.,;:!?«»"'’]/g, "").replace(/\s+/g, " ").trim();
  if (!caseSensitive) out = out.toLocaleLowerCase("fr");
  return out;
}

export type ValidatorDeps = {
  grammarChecker?: FrenchGrammarChecker;
};

export async function validateAnswer(
  answer: string,
  spec: ValidationSpec,
  deps: ValidatorDeps = {}
): Promise<ValidationResult> {
  switch (spec.validatorType) {
    case "exact":
      return exactMatch(answer, spec);

    case "regex": {
      const pattern = spec.correctAnswer ?? "";
      let pass = false;
      try {
        pass = new RegExp(pattern).test(answer.trim());
      } catch {
        return {
          pass: false,
          validator: "regex",
          reason: `invalid regex: ${pattern}`,
        };
      }
      return { pass, validator: "regex", normalized: answer.trim() };
    }

    case "grammalecte":
    case "agreement": {
      if (!deps.grammarChecker) {
        throw new Error(
          `validateAnswer: ${spec.validatorType} requires a grammarChecker`
        );
      }
      const result = await deps.grammarChecker.check(answer);
      // Optionally restrict to a targeted category (e.g. agreement rules only).
      const targetCategory = spec.config?.category as string | undefined;
      const hits = targetCategory
        ? result.matches.filter((m) => m.category === targetCategory)
        : result.matches;
      return {
        pass: hits.length === 0,
        validator: spec.validatorType,
        ruleHits: hits,
        normalized: answer.trim(),
        reason: hits.length ? hits.map((h) => h.ruleId).join(", ") : undefined,
      };
    }

    case "conjugator":
      // Routed here for a stable contract; deterministic conjugation lands next.
      return {
        pass: false,
        validator: "conjugator",
        reason: "conjugator validator not yet implemented",
      };

    case "rubric":
    case "llm_assisted":
      return {
        pass: false,
        validator: spec.validatorType,
        reason: `${spec.validatorType} is scored by a separate pipeline`,
      };

    default:
      return {
        pass: false,
        validator: spec.validatorType,
        reason: "unknown validator type",
      };
  }
}

function exactMatch(answer: string, spec: ValidationSpec): ValidationResult {
  const opts = {
    caseSensitive: spec.caseSensitive,
    ignorePunctuation: spec.ignorePunctuation,
  };
  const got = normalize(answer, opts);
  const candidates = [spec.correctAnswer, ...(spec.acceptableAnswers ?? [])]
    .filter((c): c is string => typeof c === "string")
    .map((c) => normalize(c, opts));
  return {
    pass: candidates.includes(got),
    validator: "exact",
    normalized: got,
  };
}
