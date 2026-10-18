import { createHash } from "node:crypto";
import type { z } from "zod";
import { runGates, gateNotes, type GateDeps, type GateOptions, type GateReport } from "./gates";
import { completeJson, type CostMeter, type EditorialLLM, type LlmResult } from "./llm";
import {
  PROMPT_VERSIONS, authorOutputSchema, authorPrompt, chiefRewritePrompt, dictationReviewSchema, dictationReviewerPrompt,
  lineEditOutputSchema, lineEditorPrompt, proofReviewSchema, proofReviewerPrompt, rewritePrompt, rewriteBriefSchema,
  safetyReviewSchema, safetyReviewerPrompt, styleReviewSchema, styleReviewerPrompt, targetsReviewSchema, targetsReviewerPrompt,
  type AuthorOutput, type ChapterContext,
} from "./prompts";
import { rubricMean, rubricPasses, type RubricScores } from "./rubric";
import type { EditorialBrief } from "./brief";
import type { StyleCard } from "./styles";
import { normalizeFrenchTypography } from "./typography";
import type { EditorialRole } from "./types";
import { segmentDictation, dictationChecks } from "./dictation";

/**
 * The editorial team's shared steps (roles of roadmap H.10): author, line
 * editor, code checks, parallel reviewers and the editor-in-chief's decision.
 * live.ts and library.ts compose these with different budgets and bars.
 */

export type StepLog = {
  role: EditorialRole | "code_checks" | "decision" | "fallback";
  model: string | null;
  promptVersion: string | null;
  inputDigest: string | null;
  output: unknown;
  score: number | null;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  reasoningTokens?: number;
};
export interface RunLogger { step(entry: StepLog): Promise<void> }
export class MemoryLogger implements RunLogger {
  readonly steps: StepLog[] = [];
  async step(entry: StepLog) { this.steps.push(entry); }
}

export type TeamDeps = { llm: EditorialLLM; gates: GateDeps; logger: RunLogger; meter: CostMeter };

const digest = (value: string) => `sha256:${createHash("sha256").update(value).digest("hex").slice(0, 32)}`;

export async function callRole<T>(deps: TeamDeps, role: EditorialRole, prompt: { system: string; user: string }, schema: z.ZodType<T>, temperature: number, maxTokens = 2400): Promise<{ value: T; result: LlmResult }> {
  const call = await completeJson(deps.llm, { role, system: prompt.system, user: prompt.user, temperature, maxTokens }, schema, deps.meter);
  await deps.logger.step({
    role, model: call.result.model, promptVersion: PROMPT_VERSIONS[role], inputDigest: digest(prompt.system + prompt.user), output: call.value, score: null,
    inputTokens: call.result.usage.inputTokens, outputTokens: call.result.usage.outputTokens, costUsd: call.result.usage.costUsd, latencyMs: call.result.latencyMs,
    ...(call.result.usage.reasoningTokens ? { reasoningTokens: call.result.usage.reasoningTokens } : {}),
  });
  return call;
}

export async function draftText(deps: TeamDeps, brief: EditorialBrief, style: StyleCard, context: ChapterContext | null, temperature = 0.9): Promise<AuthorOutput> {
  const { value } = await callRole(deps, "author", authorPrompt(brief, style, context), authorOutputSchema, temperature, 5000);
  return { ...value, body: normalizeFrenchTypography(value.body), bonusScene: value.bonusScene ? normalizeFrenchTypography(value.bonusScene) : "" };
}

export async function rewriteText(deps: TeamDeps, brief: EditorialBrief, style: StyleCard, context: ChapterContext | null, draft: AuthorOutput, instructions: string[]): Promise<AuthorOutput> {
  const { value } = await callRole(deps, "author", rewritePrompt(brief, style, context, draft, instructions), authorOutputSchema, 0.7, 5000);
  return { ...value, body: normalizeFrenchTypography(value.body), bonusScene: value.bonusScene ? normalizeFrenchTypography(value.bonusScene) : "" };
}

/** Pre-check of a draft before the line edit: deterministic findings only (no provider moderation). */
export function preChecks(deps: TeamDeps, brief: EditorialBrief, style: StyleCard, draft: AuthorOutput): Promise<GateReport> {
  return codeChecks(deps, brief, style, draft, { moderation: false });
}

/** The line edit can be skipped when the draft already passes every deterministic check with no AI-tell finding. */
export function draftIsClean(report: GateReport): boolean {
  return !report.hardFailed && !report.requiredFailed && report.aiTells.findings.length === 0 && report.results.every((r) => r.level !== "signal" || r.passed || r.gate === "languagetool");
}

export async function lineEdit(deps: TeamDeps, brief: EditorialBrief, style: StyleCard, draft: AuthorOutput, preReport?: GateReport): Promise<AuthorOutput> {
  const pre = preReport ?? await preChecks(deps, brief, style, draft);
  const findings = [...gateNotes(pre), ...pre.aiTells.findings.flatMap((f) => f.evidence.slice(0, 2).map((e) => `${f.label} : « ${e} »`))];
  const { value } = await callRole(deps, "line_editor", lineEditorPrompt(brief, style, draft, findings), lineEditOutputSchema, 0.5, 5000);
  return { ...draft, body: normalizeFrenchTypography(value.body), tenseEvidence: value.tenseEvidence.length ? value.tenseEvidence : draft.tenseEvidence };
}

export async function codeChecks(deps: TeamDeps, brief: EditorialBrief, style: StyleCard, text: AuthorOutput, options: GateOptions = {}): Promise<GateReport> {
  const started = Date.now();
  const report = await runGates({ template: text.body, brief, style, tenseEvidence: text.tenseEvidence }, deps.gates, options);
  await deps.logger.step({ role: "code_checks", model: null, promptVersion: null, inputDigest: digest(text.body), output: report.results.map((r) => ({ gate: r.gate, level: r.level, passed: r.passed, detail: r.detail })), score: report.aiTells.score, inputTokens: 0, outputTokens: 0, costUsd: 0, latencyMs: Date.now() - started });
  return report;
}

export type Reviews = {
  rubric: RubricScores | null;
  rubricMean: number | null;
  styleNotes: string[];
  targets: z.infer<typeof targetsReviewSchema> | null;
  proof: z.infer<typeof proofReviewSchema> | null;
  safety: z.infer<typeof safetyReviewSchema> | null;
  dictation: z.infer<typeof dictationReviewSchema> | null;
  errors: string[];
};

/** Reviewers run in parallel; a reviewer failure is recorded, never silently treated as a pass. */
export async function review(deps: TeamDeps, brief: EditorialBrief, style: StyleCard, text: AuthorOutput, options: { auditorRole?: boolean } = {}): Promise<Reviews> {
  const errors: string[] = [];
  // One retry per reviewer; a reviewer that still fails is recorded (and blocks where it matters), never treated as a pass.
  const guard = async <T>(name: string, run: () => Promise<T>): Promise<T | null> => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try { return await run(); } catch (error) {
        if (attempt === 1) {
          const message = `${name}:${error instanceof Error ? error.message.slice(0, 200) : "error"}`;
          errors.push(message);
          await deps.logger.step({ role: "code_checks", model: null, promptVersion: null, inputDigest: null, output: { reviewerError: message }, score: null, inputTokens: 0, outputTokens: 0, costUsd: 0, latencyMs: 0 });
        }
      }
    }
    return null;
  };
  const segments = brief.kind === "dictation" ? segmentDictation(text.body, brief.gradeBand) : [];
  const [style_, targets, proof, safety, dictation] = await Promise.all([
    guard("style", async () => (await callRole(deps, options.auditorRole ? "auditor" : "reviewer_style", styleReviewerPrompt(brief, style, text.body), styleReviewSchema, 0.2)).value),
    brief.targetLemmas.length ? guard("targets", async () => (await callRole(deps, "reviewer_targets", targetsReviewerPrompt(brief, text.body), targetsReviewSchema, 0.2)).value) : Promise.resolve(null),
    guard("proof", async () => (await callRole(deps, "reviewer_proof", proofReviewerPrompt(text.body), proofReviewSchema, 0)).value),
    guard("safety", async () => (await callRole(deps, "reviewer_safety", safetyReviewerPrompt(brief, text.body), safetyReviewSchema, 0)).value),
    brief.kind === "dictation" ? guard("dictation", async () => (await callRole(deps, "reviewer_dictation", dictationReviewerPrompt(brief, segments), dictationReviewSchema, 0.2)).value) : Promise.resolve(null),
  ]);
  return { rubric: style_?.rubric ?? null, rubricMean: style_ ? rubricMean(style_.rubric) : null, styleNotes: style_?.notes ?? [], targets, proof, safety, dictation, errors };
}

export type Verdict = { publishable: boolean; meetsBar: boolean; hardFailed: boolean; reasons: string[]; notes: string[] };

/**
 * Editor-in-chief decision rules (deterministic, auditable). The model only
 * phrases rewrite instructions; it never decides to publish.
 */
export function judge(mode: "live" | "library", brief: EditorialBrief, gates: GateReport, reviews: Reviews, bars: { rubric: number; floor: number }): Verdict {
  const reasons: string[] = [];
  const notes: string[] = [];
  if (gates.hardFailed) reasons.push("hard_gate");
  if (gates.requiredFailed) reasons.push("required_gate");
  notes.push(...gateNotes(gates).filter((n) => !n.startsWith("[languagetool] non configuré")));
  if (!reviews.safety) reasons.push("safety_review_missing");
  else if (!reviews.safety.safe || !reviews.safety.ageAppropriate) { reasons.push("safety_review"); notes.push(...reviews.safety.concerns.map((c) => `[sécurité] ${c}`)); }
  if (!reviews.rubric) reasons.push("style_review_missing");
  const proofIssues = reviews.proof?.issues ?? [];
  if (reviews.proof && (reviews.proof.languageScore < 4 || proofIssues.length >= 3)) reasons.push("proofreading");
  notes.push(...proofIssues.map((i) => `[langue] « ${i.excerpt} » : ${i.problem} → ${i.fix}`));
  if (reviews.targets && (reviews.targets.naturalness < 3 || !reviews.targets.contextHelpsMeaning)) reasons.push("targets_unnatural");
  notes.push(...(reviews.targets?.notes ?? []).map((n) => `[mots cibles] ${n}`));
  notes.push(...reviews.styleNotes.map((n) => `[style] ${n}`));
  if (brief.kind === "dictation") {
    const dictation = reviews.dictation;
    if (!dictation) reasons.push("dictation_review_missing");
    else if (dictation.readAloudScore < 4 || dictation.ambiguousHomophones.length || dictation.tongueTwisters.length || dictation.segmentIssues.length) {
      reasons.push("dictation_read_aloud");
      notes.push(...dictation.ambiguousHomophones.map((h) => `[dictée] homophone ambigu : ${h}`), ...dictation.tongueTwisters.map((t) => `[dictée] difficile à dire : ${t}`), ...dictation.segmentIssues.map((s) => `[dictée] ${s}`));
    }
  }
  const aiGate = gates.results.find((r) => r.gate === "ai_tells");
  if (aiGate && !aiGate.passed) reasons.push("ai_tells");
  const mean = reviews.rubricMean ?? 0;
  const meetsRubric = reviews.rubric ? rubricPasses(reviews.rubric, bars.rubric) : false;
  if (!meetsRubric) reasons.push(`rubric_below_${bars.rubric}`);
  const blocking = ["hard_gate", "required_gate", "safety_review", "safety_review_missing", "style_review_missing", "dictation_review_missing"];
  const publishable = !reasons.some((r) => blocking.includes(r)) && mean >= bars.floor && (mode === "live" || reasons.length === 0);
  return { publishable, meetsBar: reasons.length === 0, hardFailed: gates.hardFailed, reasons, notes };
}

export async function rewriteInstructions(deps: TeamDeps, notes: string[]): Promise<string[]> {
  if (notes.length === 0) return ["Rends le texte plus concret et plus surprenant, sans changer l'histoire."];
  try {
    const { value } = await callRole(deps, "editor_in_chief", chiefRewritePrompt(notes.slice(0, 30)), rewriteBriefSchema, 0.2, 900);
    return value.instructions;
  } catch {
    return notes.slice(0, 6);
  }
}

export { segmentDictation, dictationChecks };
