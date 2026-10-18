import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIProvider } from "@/lib/ai/provider";
import { verifyDictationAudio, type SpeechToText } from "./audio-check";
import { buildEditorialBrief } from "./brief";
import type { GateDeps } from "./gates";
import { runLibraryText } from "./library";
import type { EditorialLLM } from "./llm";
import type { ChapterContext } from "./prompts";
import { publishDictation, saveLibraryItem, submitPassageCandidate } from "./publisher";
import { publishEditorialPassage, type PassageEmbedder } from "./passage-publisher";
import { finishRun, startRun, SupabaseRunLogger } from "./store";
import { getStyleCard, pickStyle } from "./styles";
import { TENSES_BY_BAND, gradeBandFor, type GradeBand, type TargetLemma, type TenseKey } from "./types";

/**
 * Library-mode production (E.3, G.3, H.14, H.16): turns coverage gaps into
 * jobs and runs them. Driven by missingInterestCoverage() from
 * src/lib/content/interest-coverage.ts (interests stream); the gap type is
 * declared structurally here so this module does not depend on it at compile time.
 */

export type CoverageGap = { interest: string; type: "passage" | "practice" | "dictation"; cell: string; missing: number };
export type LibraryJob = { kind: "passage" | "dictation" | "fallback_chapter"; interest: string; grade: number; gradeBand: GradeBand; tenses: TenseKey[]; styleKey: string };

const BAND_FROM_CELL: Record<string, { band: GradeBand; grade: number }> = { cm: { band: "cm", grade: 5 }, "6e_5e": { band: "6e-5e", grade: 6 }, "4e_3e": { band: "4e-3e", grade: 8 }, lycee: { band: "lycee", grade: 10 } };
const FALLBACK_GRADE_FOR_BAND: Record<GradeBand, number> = { cm: 5, "6e-5e": 6, "4e-3e": 8, lycee: 10 };

/** Rotates tenses through the band's curriculum so every tense gets coverage (G.4). */
export function tenseRotation(band: GradeBand, index: number): TenseKey[] {
  const tenses = TENSES_BY_BAND[band];
  return [tenses[index % tenses.length]];
}

export function planLibraryJobs(gaps: CoverageGap[], options: { limit: number; styleHistory?: string[] }): LibraryJob[] {
  const jobs: LibraryJob[] = [];
  const history = [...(options.styleHistory ?? [])];
  for (const gap of gaps) {
    if (gap.type === "practice") continue; // themed practice sentences are produced by the practice generator, not here
    const target = gap.type === "passage" ? BAND_FROM_CELL[gap.cell] : (() => { const grade = Number(gap.cell); return Number.isFinite(grade) ? { band: gradeBandFor(grade), grade } : undefined; })();
    if (!target) continue;
    for (let i = 0; i < gap.missing && jobs.length < options.limit; i += 1) {
      const kind = gap.type === "passage" ? "passage" : "dictation";
      const style = pickStyle(target.band, kind, history);
      history.push(style.key);
      jobs.push({ kind, interest: gap.interest, grade: target.grade, gradeBand: target.band, tenses: tenseRotation(target.band, jobs.length), styleKey: style.key });
    }
    if (jobs.length >= options.limit) break;
  }
  return jobs;
}

/** Fallback pool (H.14): at least `perCell` chapters per interest × band, rotating styles. */
export function planFallbackJobs(interests: string[], existing: Array<{ interest: string; gradeBand: string }>, perCell = 3, limit = 10): LibraryJob[] {
  const jobs: LibraryJob[] = [];
  const history: string[] = [];
  for (const band of ["cm", "6e-5e", "4e-3e", "lycee"] as GradeBand[]) {
    for (const interest of interests) {
      const have = existing.filter((e) => e.interest === interest && e.gradeBand === band).length;
      for (let i = have; i < perCell && jobs.length < limit; i += 1) {
        const style = pickStyle(band, "chapter", history);
        history.push(style.key);
        jobs.push({ kind: "fallback_chapter", interest, grade: FALLBACK_GRADE_FOR_BAND[band], gradeBand: band, tenses: tenseRotation(band, i), styleKey: style.key });
      }
    }
  }
  return jobs;
}

/** Band-level vocabulary for library texts: words close to the grade's difficulty, with vetted definitions. */
export async function libraryTargetWords(db: SupabaseClient | null, seed: number): Promise<TargetLemma[]> {
  if (!db) return [];
  try {
    const { data } = await db.from("vocabulary_items").select("lemma,definition_fr").not("definition_fr", "is", null).order("difficulty", { ascending: true }).range(seed % 40, (seed % 40) + 20);
    return (data ?? []).filter((v) => /^[\p{L}][\p{L}' -]{1,38}$/u.test(v.lemma as string)).slice(0, 3)
      .map((v, i) => ({ lemma: v.lemma as string, kind: i < 1 ? "new" as const : "due" as const, definition: (v.definition_fr as string | null) ?? undefined }));
  } catch { return []; }
}

const FALLBACK_CONTEXT: ChapterContext = {
  outline: null, chapterIndex: 4, chapterCount: 8,
  storySoFar: "(Chapitre de secours autonome : un épisode complet qui peut s'insérer au milieu de n'importe quelle aventure de cet univers. Ne mentionne aucun personnage ni événement antérieur précis ; le héros affronte une situation neuve et le chapitre se termine sur deux choix.)",
  previousChoice: null,
};

export type LibraryJobResult = { job: LibraryJob; decision: "publish" | "discard"; reason?: string; libraryItemId?: string; ref?: unknown; costUsd: number; rubricMean?: number | null };

export async function runLibraryJob(db: SupabaseClient, job: LibraryJob, deps: { llm: EditorialLLM; gates: GateDeps; speech?: Pick<AIProvider, "synthesizeSpeechPlan"> | null; stt?: SpeechToText | null; targetWords?: TargetLemma[]; embedder?: PassageEmbedder | null; runTag?: string; costCapUsd?: number }): Promise<LibraryJobResult> {
  const lemmas = deps.targetWords ?? await libraryTargetWords(db, job.grade * 7 + job.interest.length);
  const brief = buildEditorialBrief({
    kind: job.kind === "fallback_chapter" ? "chapter" : job.kind, mode: "library", interests: [job.interest], grade: job.grade, gradeBand: job.gradeBand,
    newLemmas: lemmas.filter((l) => l.kind === "new"), dueLemmas: lemmas.filter((l) => l.kind === "due"), targetTenses: job.tenses, styleKey: job.styleKey,
    narration: job.kind === "fallback_chapter" ? "tu" : "il",
  });
  const runId = await startRun(db, { mode: "library", kind: job.kind, brief: deps.runTag ? { ...brief, runTag: deps.runTag } : brief });
  const outcome = await runLibraryText({ brief, style: getStyleCard(job.styleKey), gates: deps.gates, context: job.kind === "fallback_chapter" ? FALLBACK_CONTEXT : null, costCapUsd: deps.costCapUsd }, deps.llm, new SupabaseRunLogger(db, runId));
  if (outcome.decision === "discard") {
    await finishRun(db, runId, { status: "discarded", reasons: [outcome.reason], costUsd: outcome.costUsd });
    return { job, decision: "discard", reason: outcome.reason, costUsd: outcome.costUsd };
  }
  let audioCheck = null;
  if (job.kind === "dictation" && deps.speech) {
    audioCheck = await verifyDictationAudio(outcome.segments, deps.speech, deps.stt ?? null);
    if (audioCheck.status === "failed") {
      await finishRun(db, runId, { status: "discarded", reasons: ["audio_check_failed"], rubricMean: outcome.reviews.rubricMean, costUsd: outcome.costUsd });
      return { job, decision: "discard", reason: "audio_check_failed", costUsd: outcome.costUsd };
    }
  }
  const libraryItemId = await saveLibraryItem(db, { kind: job.kind, brief, outcome, runId, audioCheck });
  let ref: unknown = null;
  if (job.kind === "dictation") ref = await publishDictation(db, { brief, outcome, libraryItemId, runId, audioCheck });
  if (job.kind === "passage") {
    const candidateId = await submitPassageCandidate(db, { brief, outcome, libraryItemId, runId, authorModel: deps.llm.modelFor("author") });
    // H.16: materialise it as a reading passage at once; a failure leaves it for the job's sweep.
    let textVersionId: string | null = null;
    try { textVersionId = (await publishEditorialPassage(db, candidateId, deps.embedder)).textVersionId; } catch { /* swept later by publishPendingEditorialPassages */ }
    ref = { candidateId, textVersionId };
  }
  if (ref) await db.from("editorial_library_items").update({ published_ref: ref }).eq("id", libraryItemId);
  await finishRun(db, runId, { status: "published", reasons: outcome.verdict.reasons, rubricMean: outcome.reviews.rubricMean, aiTells: outcome.gates.aiTells.score, gates: outcome.gates.results.map((r) => ({ gate: r.gate, passed: r.passed })), costUsd: outcome.costUsd });
  return { job, decision: "publish", libraryItemId, ref, costUsd: outcome.costUsd, rubricMean: outcome.reviews.rubricMean };
}
