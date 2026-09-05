import type { DiagnosticEvidenceExpectation } from "./item-bank";

const CONTROLLED_RESPONSE_TYPES = new Set([
  "short_answer",
  "cloze",
  "transform",
  "ordering",
  "combine",
]);

/**
 * Ordinary node practice never proves independent production. Constructed,
 * deterministically graded responses count as controlled production; choice
 * and any unsupported/ambiguous response shapes fall back to receptive
 * evidence so they cannot be overclaimed.
 */
export function nodePracticeEvidenceExpectation(
  responseType: string,
): Exclude<DiagnosticEvidenceExpectation, "independent_production"> {
  return CONTROLLED_RESPONSE_TYPES.has(responseType)
    ? "controlled_production"
    : "receptive";
}
