import { createHash } from "node:crypto";
import { classifyDictation, tokenize } from "./classify";
import { buildTemplate, type DictationMode } from "./modes";
import { speakableSegment } from "./speech-text";
import { dictationTagsSchema, normalizeLemma, TENSE_FIRST_GRADE, type DictationTags } from "./tags";

/**
 * Automatic gates for dictée publication (roadmap 2026-10, G.2).
 *
 * A gate is a small object with a name, a version and a `run` function. The
 * deterministic gates below need nothing but the text; server gates
 * (LanguageTool, moderation) live in `auto-approve.ts`; the editorial
 * pipeline (Phase H) adds its own gates through the same interface and passes
 * them to `runDictationGates` / `autoApproveDictation({ extraGates })`.
 *
 * A dictée passes when every *blocking* gate passes or is skipped. Advisory
 * gates (blocking: false) are recorded but never stop publication.
 */

export type DictationCandidate = {
  key: string;
  title: string;
  kind: DictationMode;
  gradeMin: number;
  gradeMax: number;
  segments: string[];
  targetNodeKeys: string[];
  tags: DictationTags;
};

export type GateStatus = "pass" | "fail" | "skipped";
export type GateRun = { status: GateStatus; details?: Record<string, unknown> };
export type GateOutcome = GateRun & { gate: string; version: string; blocking: boolean };

export interface DictationGate {
  readonly name: string;
  readonly version: string;
  /** Advisory gates are recorded but cannot block publication. */
  readonly blocking: boolean;
  run(candidate: DictationCandidate): GateRun | Promise<GateRun>;
}

export type GateReport = { passed: boolean; textSha256: string; ranAt: string; gates: GateOutcome[] };

/** The stored dictée text: segments joined by one space (as in the seed script). */
export const dictationText = (segments: readonly string[]) => segments.join(" ");
/** Hash bound to the approval; equals `encode(sha256(convert_to(text_fr,'UTF8')),'hex')` in SQL. */
export const dictationTextSha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");

const wordsOf = (text: string) => tokenize(text).filter((token) => /[\p{L}\p{N}]/u.test(token));
export const dictationWordCount = (segments: readonly string[]) => wordsOf(dictationText(segments)).length;

/** Word-count band by grade and kind. CM1–CM2 dictées stay short (G.7). */
export function wordCountBand(candidate: Pick<DictationCandidate, "kind" | "gradeMin">): { min: number; max: number } {
  if (candidate.kind === "brevet") return { min: 60, max: 200 };
  if (candidate.gradeMin <= 5) return { min: 15, max: 40 };
  if (candidate.gradeMin <= 7) return { min: 20, max: 80 };
  if (candidate.gradeMin <= 9) return { min: 25, max: 100 };
  return { min: 30, max: 130 };
}

const SENTENCE_END = /[.!?…](?:\s*[»”"])?$/u;
const sentenceCount = (segment: string) => (segment.match(/[.!?…](?:\s*[»”"])?(?=\s+\p{Lu}|\s*$)/gu) ?? []).length;

export const structureGate: DictationGate = {
  name: "structure", version: "1", blocking: true,
  run(candidate) {
    const problems: string[] = [];
    if (!candidate.title.trim()) problems.push("missing_title");
    if (candidate.segments.length < 1 || candidate.segments.length > 40) problems.push("segment_count");
    candidate.segments.forEach((segment, index) => {
      const text = segment.trim();
      if (!text) { problems.push(`segment_${index}_empty`); return; }
      if (text !== segment || /\s{2,}/u.test(segment)) problems.push(`segment_${index}_spacing`);
      if (!SENTENCE_END.test(text)) problems.push(`segment_${index}_no_final_punctuation`);
      if (/\d/u.test(text)) problems.push(`segment_${index}_digits`);
      if (/[<>{}\[\]#*_@|\\]/u.test(text)) problems.push(`segment_${index}_markup`);
      if (wordsOf(text).length > 30) problems.push(`segment_${index}_too_long`);
    });
    if (candidate.gradeMin > candidate.gradeMax || candidate.gradeMin < 4 || candidate.gradeMax > 12) problems.push("grade_range");
    else if (candidate.gradeMax - candidate.gradeMin > 2) problems.push("grade_span_too_wide");
    return problems.length ? { status: "fail", details: { problems } } : { status: "pass" };
  },
};

export const lengthGate: DictationGate = {
  name: "length_for_grade", version: "1", blocking: true,
  run(candidate) {
    const words = dictationWordCount(candidate.segments);
    const band = wordCountBand(candidate);
    const problems: string[] = [];
    if (words < band.min || words > band.max) problems.push("word_count_out_of_band");
    // Young students and beginners write one sentence at a time (G.7).
    if (candidate.gradeMin <= 5) candidate.segments.forEach((segment, index) => { if (sentenceCount(segment) > 1) problems.push(`segment_${index}_several_sentences`); });
    return { status: problems.length ? "fail" : "pass", details: { words, band, ...(problems.length ? { problems } : {}) } };
  },
};

/**
 * The deterministic dictée engine must handle the text: the classifier finds
 * no error when the text is copied exactly, every segment can be spoken, and
 * gap modes find words to hide.
 */
export const linguisticValidatorGate: DictationGate = {
  name: "linguistic_validator", version: "1", blocking: true,
  run(candidate) {
    const problems: string[] = [];
    const outcome = classifyDictation(candidate.segments, candidate.segments);
    if (outcome.errors.length > 0 || outcome.score !== 10) problems.push("self_classification_errors");
    candidate.segments.forEach((segment, index) => {
      if (!speakableSegment(segment).trim()) problems.push(`segment_${index}_not_speakable`);
    });
    if ((candidate.kind === "trous" || candidate.kind === "choix") && candidate.segments.every((segment, index) => buildTemplate(segment, index).blanks.length === 0)) problems.push("no_gap_candidates");
    return problems.length ? { status: "fail", details: { problems } } : { status: "pass" };
  },
};

export const tagsGate: DictationGate = {
  name: "tags", version: "1", blocking: true,
  run(candidate) {
    const parsed = dictationTagsSchema.safeParse(candidate.tags);
    const problems: string[] = parsed.success ? [] : parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    if (candidate.tags.themes.length === 0) problems.push("themes: at least one theme");
    if (candidate.targetNodeKeys.length === 0) problems.push("target_node_keys: at least one node");
    return problems.length ? { status: "fail", details: { problems } } : { status: "pass" };
  },
};

/** Advisory: tenses expected later in the curriculum (G.4). */
export const tenseCurriculumGate: DictationGate = {
  name: "tense_curriculum", version: "1", blocking: false,
  run(candidate) {
    const early = candidate.tags.tenses.filter((tense) => TENSE_FIRST_GRADE[tense] > candidate.gradeMin);
    return early.length ? { status: "fail", details: { earlyTenses: early } } : { status: "pass" };
  },
};

/** Advisory: each target lemma should appear (crude stem match; the editorial pipeline brings the strict lemma check). */
export const targetLemmaGate: DictationGate = {
  name: "target_lemmas_present", version: "1", blocking: false,
  run(candidate) {
    const tokens = wordsOf(dictationText(candidate.segments)).map((token) => normalizeLemma(token.replace(/^[«"(]+|[.,;:!?»")…]+$/gu, "")).split("'").at(-1) ?? "");
    const missing = candidate.tags.target_lemmas.filter((lemma) => {
      const normalized = normalizeLemma(lemma);
      const stem = normalized.length > 4 ? normalized.replace(/(er|ir|re|al|au|e|s|x)$/u, "") : normalized;
      return !tokens.some((token) => token === normalized || (stem.length >= 3 && token.startsWith(stem)));
    });
    return missing.length ? { status: "fail", details: { missing } } : { status: "pass" };
  },
};

export const DETERMINISTIC_DICTATION_GATES: readonly DictationGate[] = [structureGate, lengthGate, linguisticValidatorGate, tagsGate, tenseCurriculumGate, targetLemmaGate];

/** Runs every gate; a gate that throws counts as a blocking failure (fail closed). */
export async function runDictationGates(candidate: DictationCandidate, gates: readonly DictationGate[], now = new Date()): Promise<GateReport> {
  const outcomes: GateOutcome[] = [];
  for (const gate of gates) {
    let run: GateRun;
    try { run = await gate.run(candidate); }
    catch (caught) { run = { status: "fail", details: { error: caught instanceof Error ? caught.message.slice(0, 300) : "gate_error" } }; }
    outcomes.push({ gate: gate.name, version: gate.version, blocking: gate.blocking, ...run });
  }
  return {
    passed: outcomes.every((outcome) => !outcome.blocking || outcome.status !== "fail"),
    textSha256: dictationTextSha256(dictationText(candidate.segments)),
    ranAt: now.toISOString(),
    gates: outcomes,
  };
}
