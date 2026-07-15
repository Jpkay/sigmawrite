import type { GeneratedItem } from "@/lib/ai/item-generation/schemas";
import type { TaxonomyCandidate } from "@/lib/taxonomy/validate";
import type {
  DiagnosticDifficultyTier,
  DiagnosticEvidenceExpectation,
} from "./item-bank";
import type { DiagnosticSectionKey } from "./protocol";

const PROMPT_FAMILIES: Record<
  DiagnosticSectionKey,
  Record<Exclude<DiagnosticEvidenceExpectation, "independent_production">, readonly string[]>
> = {
  reading_comprehension: {
    receptive: ["text-evidence-choice", "context-inference", "evidence-span"],
    controlled_production: ["brief-constructed-response", "reformulation", "evidence-explanation"],
  },
  grammar: {
    receptive: ["sentence-identification", "contrast-analysis", "role-analysis"],
    controlled_production: ["sentence-completion", "targeted-correction", "sentence-transformation"],
  },
  spelling: {
    receptive: ["orthographic-contrast", "error-detection", "contextual-choice"],
    controlled_production: ["contextual-cloze", "error-correction", "word-from-cue"],
  },
  conjugation: {
    receptive: ["tense-recognition", "meaning-in-context", "chronology-choice"],
    controlled_production: ["controlled-form", "sentence-completion", "sentence-transformation"],
  },
};

export const DIAGNOSTIC_DIFFICULTY_TIERS = ["foundation", "core", "stretch"] as const;

export function diagnosticPromptFamilies(
  section: DiagnosticSectionKey,
  expectation: Exclude<DiagnosticEvidenceExpectation, "independent_production">,
) {
  return PROMPT_FAMILIES[section][expectation];
}
export function diagnosticDifficultyForTier(tier: DiagnosticDifficultyTier) {
  return tier === "foundation" ? 25 : tier === "core" ? 50 : 75;
}

/**
 * Item modality describes the observable response in the current web client.
 * A real dictation needs a reviewed audio asset; until that pipeline exists,
 * spelling production uses text cues that do not reveal the target spelling.
 */
export function diagnosticItemModality(
  node: TaxonomyCandidate["nodes"][number],
  evidence: TaxonomyCandidate["nodes"][number]["evidence"][number],
): GeneratedItem["modality"] {
  if (evidence.expectation !== "receptive") return "writing";
  if (node.strand === "comprehension_ecrite") return "reading";
  return "grammar_analysis";
}
