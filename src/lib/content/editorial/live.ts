import { CostCapExceeded, CostMeter, type EditorialLLM } from "./llm";
import type { EditorialBrief } from "./brief";
import type { GateDeps, GateReport } from "./gates";
import { RUBRIC_BARS } from "./rubric";
import type { AuthorOutput, ChapterContext } from "./prompts";
import type { StyleCard } from "./styles";
import { codeChecks, draftIsClean, draftText, judge, lineEdit, preChecks, review, rewriteInstructions, rewriteText, type Reviews, type RunLogger, type TeamDeps, type Verdict } from "./team";

/**
 * When the line editor runs (measured in README "Cost and latency"):
 *  - always: every draft;
 *  - conditional: only when the draft's deterministic pre-check finds something
 *    (AI tells, a failed required gate, a signal) — clean drafts go straight to review;
 *  - never.
 */
export type LineEditMode = "always" | "conditional" | "never";
export function liveLineEditMode(env: Record<string, string | undefined> = process.env): LineEditMode {
  const value = env.EDITORIAL_LIVE_LINE_EDIT;
  return value === "always" || value === "never" || value === "conditional" ? value : DEFAULT_LINE_EDIT;
}
export const DEFAULT_LINE_EDIT: LineEditMode = "always";

/**
 * Live orchestrator (roadmap H.10): author → line editor → code checks +
 * parallel reviewers → editor-in-chief. At most ONE targeted rewrite, a cost
 * cap per chapter, every step logged. Never throws to the student path:
 * any failure returns { decision: "fallback" } and the caller serves a
 * pre-checked fallback chapter (H.14).
 */

export const LIVE_DEFAULTS = {
  costCapUsd: Number(process.env.EDITORIAL_LIVE_COST_CAP_USD ?? 0.6),
  /** Live floor: below the 4.0 target a chapter still publishes after the rewrite if ≥ floor and every gate passes. */
  floor: Number(process.env.EDITORIAL_LIVE_RUBRIC_FLOOR ?? 3.6),
  timeoutMs: Number(process.env.EDITORIAL_LIVE_TIMEOUT_MS ?? 150_000),
};

export type LiveRequest = {
  brief: EditorialBrief;
  style: StyleCard;
  context: ChapterContext | null;
  gates: GateDeps;
  costCapUsd?: number;
  lineEdit?: LineEditMode;
};

export type LiveOutcome =
  | { decision: "publish"; text: AuthorOutput; gates: GateReport; reviews: Reviews; verdict: Verdict; rewrites: number; costUsd: number; latencyMs: number }
  | { decision: "fallback"; reason: string; verdict?: Verdict; rewrites: number; costUsd: number; latencyMs: number };

export async function runLiveChapter(request: LiveRequest, llm: EditorialLLM, logger: RunLogger): Promise<LiveOutcome> {
  const started = Date.now();
  const meter = new CostMeter(request.costCapUsd ?? LIVE_DEFAULTS.costCapUsd);
  const deps: TeamDeps = { llm, gates: request.gates, logger, meter };
  const bars = { rubric: RUBRIC_BARS.live, floor: LIVE_DEFAULTS.floor };
  let rewrites = 0;
  const fallback = async (reason: string, verdict?: Verdict): Promise<LiveOutcome> => {
    await logger.step({ role: "fallback", model: null, promptVersion: null, inputDigest: null, output: { reason, verdict }, score: null, inputTokens: 0, outputTokens: 0, costUsd: 0, latencyMs: Date.now() - started });
    return { decision: "fallback", reason, verdict, rewrites, costUsd: meter.spent, latencyMs: Date.now() - started };
  };
  const work = async (): Promise<LiveOutcome> => {
    const draft = await draftText(deps, request.brief, request.style, request.context);
    const mode = request.lineEdit ?? liveLineEditMode();
    let text = draft;
    if (mode !== "never") {
      const pre = await preChecks(deps, request.brief, request.style, draft);
      if (mode === "always" || !draftIsClean(pre)) text = await lineEdit(deps, request.brief, request.style, draft, pre);
    }
    for (;;) {
      const [gates, reviews] = await Promise.all([
        codeChecks(deps, request.brief, request.style, text),
        review(deps, request.brief, request.style, text),
      ]);
      const verdict = judge("live", request.brief, gates, reviews, bars);
      await logger.step({ role: "decision", model: null, promptVersion: "chief-rules-1", inputDigest: null, output: verdict, score: reviews.rubricMean, inputTokens: 0, outputTokens: 0, costUsd: 0, latencyMs: Date.now() - started });
      if (verdict.meetsBar || (rewrites >= 1 && verdict.publishable)) {
        return { decision: "publish", text, gates, reviews, verdict, rewrites, costUsd: meter.spent, latencyMs: Date.now() - started };
      }
      if (rewrites >= 1) return fallback(`after_rewrite:${verdict.reasons.join(",")}`, verdict);
      rewrites += 1;
      const instructions = await rewriteInstructions(deps, verdict.notes);
      text = await rewriteText(deps, request.brief, request.style, request.context, text, instructions);
    }
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<LiveOutcome>((resolve) => { timer = setTimeout(() => resolve(fallback("timeout")), LIVE_DEFAULTS.timeoutMs); });
    return await Promise.race([work(), timeout]);
  } catch (error) {
    if (error instanceof CostCapExceeded) return fallback("cost_cap");
    return fallback(`error:${error instanceof Error ? error.message.slice(0, 120) : "unknown"}`);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
