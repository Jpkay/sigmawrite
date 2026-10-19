import { CostCapExceeded, CostMeter, type EditorialLLM } from "./llm";
import type { EditorialBrief } from "./brief";
import type { GateDeps, GateReport } from "./gates";
import { pairwisePrompt, pairwiseSchema, type AuthorOutput, type ChapterContext } from "./prompts";
import { RUBRIC_BARS } from "./rubric";
import type { StyleCard } from "./styles";
import { callRole, codeChecks, dictationChecks, draftText, judge, lineEdit, review, rewriteInstructions, rewriteText, segmentDictation, type Reviews, type RunLogger, type TeamDeps, type Verdict } from "./team";

/**
 * Library mode (roadmap H.17): no time pressure, so more compute for quality.
 *  - best of 4 drafts, compared in pairs (each match judged in both orders);
 *  - up to 3 revision rounds, each round's notes routed to the author;
 *  - published only at ≥ 4.3/5 on the rubric with every gate passing, else discarded
 *    (never "fixed by hand");
 *  - dictées are also checked for reading aloud (deterministic + reviewer).
 * Used for reading passages, dictées and fallback chapters (H.14).
 */

export const LIBRARY_DEFAULTS = {
  drafts: 4,
  maxRounds: 3,
  costCapUsd: Number(process.env.EDITORIAL_LIBRARY_COST_CAP_USD ?? 3),
};

export type LibraryRequest = { brief: EditorialBrief; style: StyleCard; gates: GateDeps; context?: ChapterContext | null; drafts?: number; maxRounds?: number; costCapUsd?: number };
export type LibraryOutcome =
  | { decision: "publish"; text: AuthorOutput; segments: string[]; gates: GateReport; reviews: Reviews; verdict: Verdict; rounds: number; costUsd: number }
  | { decision: "discard"; reason: string; verdict?: Verdict; rounds: number; costUsd: number; best?: AuthorOutput };

async function match(deps: TeamDeps, brief: EditorialBrief, style: StyleCard, a: AuthorOutput, b: AuthorOutput): Promise<AuthorOutput> {
  // Judged twice with swapped positions to cancel position bias; a split goes to fewer AI tells.
  const [first, second] = await Promise.all([
    callRole(deps, "judge_pairwise", pairwisePrompt(brief, style, a.body, b.body), pairwiseSchema, 0),
    callRole(deps, "judge_pairwise", pairwisePrompt(brief, style, b.body, a.body), pairwiseSchema, 0),
  ]);
  const votesA = (first.value.winner === "A" ? 1 : 0) + (second.value.winner === "B" ? 1 : 0);
  if (votesA === 2) return a;
  if (votesA === 0) return b;
  const [ga, gb] = await Promise.all([codeChecks(deps, brief, style, a), codeChecks(deps, brief, style, b)]);
  return ga.aiTells.score <= gb.aiTells.score ? a : b;
}

export async function runLibraryText(request: LibraryRequest, llm: EditorialLLM, logger: RunLogger): Promise<LibraryOutcome> {
  const meter = new CostMeter(request.costCapUsd ?? LIBRARY_DEFAULTS.costCapUsd);
  const deps: TeamDeps = { llm, gates: request.gates, logger, meter };
  const { brief, style } = request;
  const bars = { rubric: RUBRIC_BARS.library, floor: RUBRIC_BARS.library };
  let rounds = 0;
  let best: AuthorOutput | undefined;
  try {
    const temperatures = [0.8, 0.9, 1.0, 0.95].slice(0, request.drafts ?? LIBRARY_DEFAULTS.drafts);
    const settled = await Promise.allSettled(temperatures.map((t) => draftText(deps, brief, style, request.context ?? null, t)));
    const drafts = settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    // Drafts failing a hard gate never enter the tournament.
    const checked = await Promise.all(drafts.map(async (d) => ({ d, g: await codeChecks(deps, brief, style, d) })));
    const eligible = checked.filter((c) => !c.g.hardFailed).map((c) => c.d);
    if (eligible.length === 0) return { decision: "discard", reason: "all_drafts_failed_hard_gates", rounds, costUsd: meter.spent };
    let pool = eligible;
    while (pool.length > 1) {
      const next: AuthorOutput[] = [];
      for (let i = 0; i < pool.length; i += 2) next.push(pool[i + 1] ? await match(deps, brief, style, pool[i], pool[i + 1]) : pool[i]);
      pool = next;
    }
    let text = await lineEdit(deps, brief, style, pool[0]);
    best = text;
    for (;;) {
      rounds += 1;
      const [gates, reviews] = await Promise.all([codeChecks(deps, brief, style, text), review(deps, brief, style, text)]);
      const verdict = judge("library", brief, gates, reviews, bars);
      const segments = brief.kind === "dictation" ? segmentDictation(text.body, brief.gradeBand) : [];
      if (brief.kind === "dictation") {
        const dictation = dictationChecks(text.body, segments, brief.gradeBand, brief.lengthWords);
        if (!dictation.passed) { verdict.meetsBar = false; verdict.publishable = false; verdict.reasons.push("dictation_checks"); verdict.notes.unshift(...dictation.issues.map((i) => `[dictée] ${i}`)); }
      }
      await logger.step({ role: "decision", model: null, promptVersion: "chief-rules-1", inputDigest: null, output: { round: rounds, verdict }, score: reviews.rubricMean, inputTokens: 0, outputTokens: 0, costUsd: 0, latencyMs: 0 });
      if (verdict.meetsBar && verdict.publishable) return { decision: "publish", text, segments, gates, reviews, verdict, rounds, costUsd: meter.spent };
      if (rounds >= (request.maxRounds ?? LIBRARY_DEFAULTS.maxRounds)) return { decision: "discard", reason: verdict.reasons.join(","), verdict, rounds, costUsd: meter.spent, best: text };
      const instructions = await rewriteInstructions(deps, verdict.notes);
      text = await lineEdit(deps, brief, style, await rewriteText(deps, brief, style, request.context ?? null, text, instructions));
      best = text;
    }
  } catch (error) {
    if (error instanceof CostCapExceeded) return { decision: "discard", reason: "cost_cap", rounds, costUsd: meter.spent, best };
    return { decision: "discard", reason: `error:${error instanceof Error ? error.message.slice(0, 120) : "unknown"}`, rounds, costUsd: meter.spent, best };
  }
}
