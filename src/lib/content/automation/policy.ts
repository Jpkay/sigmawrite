import { createHash } from "node:crypto";
import { z } from "zod";
import type { ContentCandidate } from "@/lib/ai/pipeline";
import { generatedTextCandidateSchema, generateTextInputSchema } from "@/lib/ai/schemas";
import { isSensitive, hasUncataloguedNumericClaim, hasUnknownGroundingReference, isDifficultyMismatch } from "@/lib/ai/pipeline";
import { scoreTextDifficulty } from "@/lib/scoring/text-difficulty";
import { paragraphsFromText } from "@/lib/content/text-format";

export const PASSAGE_QA_VERSION = "selective-passage-2";
export const judgmentSchema = z.object({
  risk: z.enum(["low", "medium", "high", "prohibited"]),
  naturalness: z.number().min(0).max(1),
  ageAppropriate: z.boolean(),
  factualGroundingSufficient: z.boolean(),
  concerns: z.array(z.string()),
  questions: z.array(z.object({ index: z.number().int().nonnegative(), correct: z.boolean(), unambiguous: z.boolean(), supportedByPassage: z.boolean(), reason: z.string() })),
});
export type Judgment = z.infer<typeof judgmentSchema>;
export type AutomatedEvidence = {
  generatorModel: string; evaluatorModel: string;
  moderationPassed: boolean; grammarIssueCount: number; duplicateChecked: boolean; nearDuplicate: boolean;
  judgment: Judgment;
};
export type PassageDecision = { decision: "pass" | "human_review" | "reject"; reasons: string[]; sampled: boolean };
export function decidePassageAutomation(candidate: ContentCandidate, evidence: AutomatedEvidence, samplePercent = 5): PassageDecision {
  const input = generateTextInputSchema.parse(candidate.input);
  const text = generatedTextCandidateSchema.parse(candidate.generated);
  const j = judgmentSchema.parse(evidence.judgment);
  if (!Number.isFinite(samplePercent) || samplePercent < 0 || samplePercent > 100) throw new Error("Invalid sample percent");
  const reasons: string[] = [];
  const normalizedModel = (m: string) => m.toLowerCase().split("/").at(-1)?.replace(/:.*$/, "").trim();
  if (!evidence.generatorModel || !evidence.evaluatorModel || normalizedModel(evidence.generatorModel) === normalizedModel(evidence.evaluatorModel)) reasons.push("independent_evaluator_required");
  if (!evidence.moderationPassed || j.risk === "prohibited" || !j.ageAppropriate) return { decision: "reject", reasons: ["safety_gate"], sampled: false };
  if (isSensitive(input) || j.risk !== "low") reasons.push("risk_requires_editor");
  if (input.textType !== "expository" || text.questions.some(q => q.answerFormat !== "multiple_choice")) reasons.push("format_not_calibrated");
  if (!j.factualGroundingSufficient || hasUncataloguedNumericClaim(text.body, text.factualClaims) || hasUnknownGroundingReference(text.factualClaims, input.groundingPackets) || text.factualClaims.some(c => c.needsHumanReview || c.confidence === "low")) reasons.push("grounding_requires_editor");
  if (evidence.grammarIssueCount !== 0) reasons.push("grammar_requires_editor");
  if (!evidence.duplicateChecked || evidence.nearDuplicate) reasons.push("duplicate_gate");
  const difficulty = scoreTextDifficulty(paragraphsFromText(text.body), { conceptCount: text.knowledgeConcepts.length, newVocabCount: text.targetVocabulary.length, inferenceQuestionCount: text.questions.filter(q => q.questionType === "inference").length });
  if (isDifficultyMismatch(input.targetReadingBand, difficulty.overall)) reasons.push("difficulty_mismatch");
  if (difficulty.features.wordCount < input.wordCountTarget * .7 || difficulty.features.wordCount > input.wordCountTarget * 1.3) reasons.push("length_mismatch");
  if (j.naturalness < .85 || j.concerns.length) reasons.push("quality_requires_editor");
  if (!text.questions.length || j.questions.length !== text.questions.length || new Set(j.questions.map(q => q.index)).size !== text.questions.length || j.questions.some(q => q.index >= text.questions.length || !q.correct || !q.unambiguous || !q.supportedByPassage)) reasons.push("question_qa_failed");
  for (const q of text.questions) if (q.answerFormat === "multiple_choice" && (!q.choices || q.choices.length < 2 || new Set(q.choices.map(c => c.trim().toLowerCase())).size !== q.choices.length || q.choices.filter(c => c === q.correctAnswer).length !== 1)) reasons.push("answer_key_invalid");
  const sampled = parseInt(createHash("sha256").update(`${candidate.id}:${PASSAGE_QA_VERSION}`).digest("hex").slice(0,8),16) % 100 < samplePercent;
  return { decision: reasons.length ? "human_review" : "pass", reasons: [...new Set(reasons)], sampled: !reasons.length && sampled };
}

export const PASSAGE_AUTOMATION_INSTRUCTION = "Pour ce lot de calibration automatique : toutes les questions doivent utiliser answerFormat=multiple_choice, au moins trois choix distincts, une seule réponse exacte copiée dans correctAnswer. Les questions doivent être résolues uniquement à partir du passage. Respecte la longueur demandée. Privilégie des connaissances stables et étayées ; aucune affirmation chiffrée non sourcée.";
