import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIProvider } from "@/lib/ai/provider";
import { moderationResultSchema } from "@/lib/ai/schemas";
import { LanguageToolChecker } from "@/lib/linguistic/languagetool";
import type { FrenchGrammarChecker } from "@/lib/linguistic/types";
import { fallbackModeration } from "@/lib/safety/moderate-input";
import { renderPendingDictationAudio } from "./audio";
import { DETERMINISTIC_DICTATION_GATES, dictationText, runDictationGates, type DictationCandidate, type DictationGate, type GateReport } from "./gates";
import type { DictationMode } from "./modes";
import { EMPTY_DICTATION_TAGS, type CefrBand, type DictationTense } from "./tags";

/**
 * Automatic approval of a dictée (roadmap 2026-10, G.2): run the gates, then
 * mark the text `auto_approved` with the pipeline version and the gate
 * results, and queue its audio. No person approves each text; people audit
 * in /admin/dictations and can take a dictée down at once.
 *
 * Plug-in point for the editorial pipeline (Phase H, G.3): pass its gates as
 * `extraGates` and its own `pipelineVersion`. They run after the gates below,
 * with the same fail-closed rule.
 */

export const DICTATION_PIPELINE_VERSION = "dictation-gates-1";

/** LanguageTool rules that misfire on dictée typography. */
const IGNORED_GRAMMAR_RULES = new Set(["WHITESPACE_RULE", "APOS_TYP", "FRENCH_WHITESPACE"]);

/** LanguageTool when configured (LANGUAGETOOL_URL); otherwise recorded as skipped. */
export function languageToolGate(options: { checker?: FrenchGrammarChecker; configured?: boolean } = {}): DictationGate {
  const configured = options.configured ?? (!!options.checker || !!process.env.LANGUAGETOOL_URL);
  return {
    name: "languagetool", version: "1", blocking: true,
    async run(candidate) {
      if (!configured) return { status: "skipped", details: { reason: "not_configured" } };
      const checker = options.checker ?? new LanguageToolChecker();
      const result = await checker.check(dictationText(candidate.segments));
      const matches = result.matches.filter((match) => !IGNORED_GRAMMAR_RULES.has(match.ruleId));
      return matches.length
        ? { status: "fail", details: { matches: matches.slice(0, 20).map((match) => ({ ruleId: match.ruleId, message: match.message, offset: match.offset, length: match.length })) } }
        : { status: "pass", details: { ignored: result.matches.length - matches.length } };
    },
  };
}

function providerConfigured(): boolean {
  const provider = process.env.AI_PROVIDER ?? "mock";
  return provider !== "mock" && !!(process.env.OPENAI_API_KEY || process.env.LLM_API_KEY);
}

/** Deterministic safety rules always; the model moderator too when configured. Errors fail closed. */
export function moderationGate(options: { provider?: AIProvider | null } = {}): DictationGate {
  return {
    name: "moderation", version: "1", blocking: true,
    async run(candidate) {
      const text = `${candidate.title}\n${dictationText(candidate.segments)}`;
      const rules = fallbackModeration(text);
      if (!rules.allowed) return { status: "fail", details: { source: "rules", categories: rules.categories } };
      const provider = options.provider === undefined ? (providerConfigured() ? (await import("@/lib/ai")).getAIProvider() : null) : options.provider;
      if (!provider) return { status: "pass", details: { source: "rules" } };
      const result = moderationResultSchema.parse(await provider.moderate({ content: text, context: "generated_content" }));
      const passed = result.passed && !result.needsHumanReview && result.flaggedCategories.length === 0;
      return { status: passed ? "pass" : "fail", details: { source: "provider", categories: result.flaggedCategories } };
    },
  };
}

type DictationRecord = {
  id: string; key: string; title_fr: string; kind: DictationMode; text_fr: string; segments: { text: string }[]; grade_min: number; grade_max: number;
  target_node_keys: string[]; review_status: string; themes: string[] | null; interests: string[] | null; tenses: string[] | null;
  target_lemmas: string[] | null; grammar_node_keys: string[] | null; cefr_band: string | null;
};

export function candidateFromRecord(row: DictationRecord): DictationCandidate {
  return {
    key: row.key, title: row.title_fr, kind: row.kind, gradeMin: row.grade_min, gradeMax: row.grade_max,
    segments: row.segments.map((segment) => segment.text), targetNodeKeys: row.target_node_keys ?? [],
    tags: {
      ...EMPTY_DICTATION_TAGS,
      themes: row.themes ?? [], interests: row.interests ?? [], tenses: (row.tenses ?? []) as DictationTense[],
      target_lemmas: row.target_lemmas ?? [], grammar_node_keys: row.grammar_node_keys ?? [], cefr_band: (row.cefr_band as CefrBand | null) ?? null,
    },
  };
}

/** The stored text must be exactly the segments the audio is rendered from. */
const storedTextGate = (row: DictationRecord): DictationGate => ({
  name: "stored_text_matches_segments", version: "1", blocking: true,
  run: (candidate) => (dictationText(candidate.segments) === row.text_fr ? { status: "pass" } : { status: "fail", details: { reason: "text_fr differs from joined segments" } }),
});

export type AutoApprovalOutcome = {
  id: string; key: string;
  status: "auto_approved" | "already_human_approved" | "held" | "taken_down";
  report: GateReport | null;
  audio?: { rendered: number; failed: number; considered: number };
};

/**
 * Runs one dictée through the gates and approves it automatically when it
 * passes. A held dictée keeps its status and stores the failing report for
 * the audit portal. Human decisions are never overridden.
 */
export async function autoApproveDictation(db: SupabaseClient, options: {
  dictationId?: string; key?: string; extraGates?: readonly DictationGate[]; pipelineVersion?: string;
  languageTool?: DictationGate; moderation?: DictationGate; renderAudio?: boolean; now?: Date;
}): Promise<AutoApprovalOutcome> {
  if (!options.dictationId && !options.key) throw new Error("dictationId or key required");
  let query = db.from("dictations").select("id,key,title_fr,kind,text_fr,segments,grade_min,grade_max,target_node_keys,review_status,themes,interests,tenses,target_lemmas,grammar_node_keys,cefr_band");
  query = options.dictationId ? query.eq("id", options.dictationId) : query.eq("key", options.key!);
  const { data, error } = await query.single();
  if (error || !data) throw new Error(error?.message ?? "dictation_not_found");
  const row = data as DictationRecord;
  if (row.review_status === "taken_down") return { id: row.id, key: row.key, status: "taken_down", report: null };
  if (row.review_status === "human_approved") return { id: row.id, key: row.key, status: "already_human_approved", report: null };

  const gates = [
    storedTextGate(row), ...DETERMINISTIC_DICTATION_GATES,
    options.languageTool ?? languageToolGate(), options.moderation ?? moderationGate(),
    ...(options.extraGates ?? []),
  ];
  const report = await runDictationGates(candidateFromRecord(row), gates, options.now);
  const pipelineVersion = options.pipelineVersion ?? DICTATION_PIPELINE_VERSION;
  if (!report.passed) {
    if (row.review_status !== "auto_approved") await db.from("dictations").update({ gate_results: { ...report, pipelineVersion } }).eq("id", row.id);
    return { id: row.id, key: row.key, status: "held", report };
  }
  const { error: approveError } = await db.rpc("auto_approve_dictation", { p_dictation_id: row.id, p_pipeline_version: pipelineVersion, p_gate_results: { ...report, pipelineVersion } });
  if (approveError) throw new Error(`${row.key}: ${approveError.message}`);
  // Audio is queued (audio_status pending); the hourly job renders it, or now on request.
  const audio = options.renderAudio ? await renderPendingDictationAudio(db, { dictationId: row.id, limit: 1 }) : undefined;
  return { id: row.id, key: row.key, status: "auto_approved", report, audio };
}
