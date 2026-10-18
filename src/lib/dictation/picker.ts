import type { DictationMode } from "./modes";
import { normalizeLemma } from "./tags";

/**
 * Dictée picker (roadmap 2026-10, G.5). Pure: the caller loads the rows.
 *
 * Hard filters: the student's grade, CM1–CM2 length cap (G.7), not done in the
 * last 120 days, and an expected error rate inside 15–30% (the 70–85% success
 * zone), estimated from the skill estimates of the dictée's nodes.
 *
 *   score = interest_match + weak_skill_match + due_word_overlap
 *           − new_word_overload − recent_theme_penalty
 *
 * When the pool is tiny the filters relax in a fixed order (error band, then
 * recency), never the grade: the student always gets the closest fit, and
 * easier is preferred to harder.
 */

export const DICTATION_PICKER = {
  recencyDays: 120,
  spacingHours: 36,
  brevetEveryDays: 90,
  errorBand: { min: 0.15, max: 0.3 },
  /** Mastery assumed when nothing is known: inside the band (22% expected errors). */
  priorMastery: 0.78,
  youngMaxGrade: 5,
  youngMaxWords: 40,
  weakMastery: 0.7,
  securedMastery: 0.85,
  newWordAllowance: 2,
  recentThemeDays: 14,
  weights: { interest: 3, extraInterest: 0.5, weakNode: 1, fragileNode: 0.5, dueWord: 1, newWord: 1, recentTheme: 1.5 },
  caps: { interest: 4, weakSkill: 3, dueWords: 3, recentTheme: 3 },
} as const;

export type PickerDictation = {
  id: string;
  kind: DictationMode;
  title: string;
  wordCount: number;
  gradeMin: number;
  gradeMax: number;
  targetNodeKeys: readonly string[];
  grammarNodeKeys: readonly string[];
  themes: readonly string[];
  interests: readonly string[];
  targetLemmas: readonly string[];
};

export type PickerAttempt = { dictationId: string; mode: string; submittedAt: string };

/**
 * A word due for review, supplied by the vocabulary memory (Phase B/D). The
 * picker matches on the normalized lemma because `dictations.target_lemmas`
 * stores lemma text; `lemmaId` is kept for the caller's bookkeeping.
 */
export type DueWordInput = { lemmaId: string; lemma: string; retrievability?: number };

export type PickerInput = {
  nowMs: number;
  grade: number;
  dictations: readonly PickerDictation[];
  /** Submitted attempts (at least the last 120 days), any order. */
  attempts: readonly PickerAttempt[];
  interests: readonly string[];
  /** P(mastery) by competency node key, 0–1. Missing nodes fall back to the student's mean, else the prior. */
  masteryByNodeKey: ReadonlyMap<string, number>;
  dueWords?: readonly DueWordInput[];
  /** Normalized lemmas the student already met; null/undefined = unknown, the overload term is then off. */
  knownLemmas?: ReadonlySet<string> | null;
};

export type ScoreParts = { interest: number; weakSkill: number; dueWords: number; newWordOverload: number; recentTheme: number; fallback: number };
export type Relaxation = "grade" | "error_band" | "recency";
export type ScoredDictation = { dictation: PickerDictation; score: number; parts: ScoreParts; expectedErrorRate: number };
export type Ranking = { ranked: ScoredDictation[]; relaxed: Relaxation[] };

const DAY = 86_400_000;
const round = (value: number) => Math.round(value * 1000) / 1000;

export const dictationNodes = (d: Pick<PickerDictation, "targetNodeKeys" | "grammarNodeKeys">) => [...new Set([...d.targetNodeKeys, ...d.grammarNodeKeys])];

function fallbackMastery(input: Pick<PickerInput, "masteryByNodeKey">): number {
  const values = [...input.masteryByNodeKey.values()].filter((value) => Number.isFinite(value));
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : DICTATION_PICKER.priorMastery;
}

/** Expected share of errors: 1 − mean mastery of the dictée's nodes. */
export function expectedErrorRate(d: PickerDictation, input: Pick<PickerInput, "masteryByNodeKey">): number {
  const prior = fallbackMastery(input);
  const nodes = dictationNodes(d);
  if (nodes.length === 0) return round(1 - prior);
  const mean = nodes.reduce((sum, key) => sum + (input.masteryByNodeKey.get(key) ?? prior), 0) / nodes.length;
  return round(Math.min(1, Math.max(0, 1 - mean)));
}

export function inErrorBand(rate: number) {
  return rate >= DICTATION_PICKER.errorBand.min && rate <= DICTATION_PICKER.errorBand.max;
}

/** Distance outside the band; harder-than-band counts double (never punish). */
function bandDistance(rate: number) {
  const { min, max } = DICTATION_PICKER.errorBand;
  if (rate < min) return min - rate;
  if (rate > max) return (rate - max) * 2;
  return 0;
}

export function interestMatch(d: PickerDictation, interests: readonly string[]): number {
  const wanted = new Set(interests);
  const overlap = d.interests.filter((key) => wanted.has(key)).length;
  if (overlap === 0) return 0;
  const { interest, extraInterest } = DICTATION_PICKER.weights;
  return Math.min(DICTATION_PICKER.caps.interest, interest + (overlap - 1) * extraInterest);
}

export function weakSkillMatch(d: PickerDictation, mastery: ReadonlyMap<string, number>): number {
  let total = 0;
  for (const key of dictationNodes(d)) {
    const value = mastery.get(key);
    if (value === undefined) continue;
    if (value < DICTATION_PICKER.weakMastery) total += DICTATION_PICKER.weights.weakNode;
    else if (value < DICTATION_PICKER.securedMastery) total += DICTATION_PICKER.weights.fragileNode;
  }
  return Math.min(DICTATION_PICKER.caps.weakSkill, total);
}

export function dueWordOverlap(d: PickerDictation, dueWords: readonly DueWordInput[]): number {
  if (dueWords.length === 0) return 0;
  const due = new Set(dueWords.map((word) => normalizeLemma(word.lemma)));
  const overlap = new Set(d.targetLemmas.map(normalizeLemma).filter((lemma) => due.has(lemma))).size;
  return Math.min(DICTATION_PICKER.caps.dueWords, overlap * DICTATION_PICKER.weights.dueWord);
}

export function newWordOverload(d: PickerDictation, knownLemmas: ReadonlySet<string> | null | undefined, dueWords: readonly DueWordInput[]): number {
  if (!knownLemmas) return 0;
  const due = new Set(dueWords.map((word) => normalizeLemma(word.lemma)));
  const fresh = new Set(d.targetLemmas.map(normalizeLemma).filter((lemma) => !knownLemmas.has(lemma) && !due.has(lemma))).size;
  return Math.max(0, fresh - DICTATION_PICKER.newWordAllowance) * DICTATION_PICKER.weights.newWord;
}

export function recentThemePenalty(d: PickerDictation, input: Pick<PickerInput, "attempts" | "dictations" | "nowMs">): number {
  if (d.themes.length === 0) return 0;
  const themes = new Set(d.themes);
  const byId = new Map(input.dictations.map((row) => [row.id, row]));
  const recent = [...input.attempts]
    .filter((attempt) => input.nowMs - Date.parse(attempt.submittedAt) < DICTATION_PICKER.recentThemeDays * DAY)
    .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))
    .slice(0, 3);
  const hits = recent.filter((attempt) => (byId.get(attempt.dictationId)?.themes ?? []).some((theme) => themes.has(theme))).length;
  return Math.min(DICTATION_PICKER.caps.recentTheme, hits * DICTATION_PICKER.weights.recentTheme);
}

const LYCEE_FALLBACK_FLOOR = 9;

function eligibleForGrade(d: PickerDictation, grade: number) {
  if (grade < d.gradeMin || grade > d.gradeMax) return false;
  if (grade <= DICTATION_PICKER.youngMaxGrade && d.wordCount > DICTATION_PICKER.youngMaxWords) return false;
  return true;
}

/**
 * Ranks the dictées the student may do now, best first. `kinds` restricts the
 * pool (e.g. only brevet). Relaxations are reported so callers can log them.
 */
export function rankDictations(input: PickerInput, options: { kinds?: (kind: DictationMode) => boolean } = {}): Ranking {
  const dueWords = input.dueWords ?? [];
  const lastDone = new Map<string, number>();
  for (const attempt of input.attempts) {
    const at = Date.parse(attempt.submittedAt);
    if (Number.isFinite(at) && at > (lastDone.get(attempt.dictationId) ?? -Infinity)) lastDone.set(attempt.dictationId, at);
  }
  const relaxed: Relaxation[] = [];
  const kindOk = (d: PickerDictation) => (options.kinds ? options.kinds(d.kind) : true);
  let pool = input.dictations.filter((d) => eligibleForGrade(d, input.grade) && kindOk(d));
  // Lycée (grades 10–12) falls back to the closest lower grade until its own dictées are published.
  for (let grade = input.grade - 1; pool.length === 0 && grade >= LYCEE_FALLBACK_FLOOR; grade -= 1) {
    pool = input.dictations.filter((d) => eligibleForGrade(d, grade) && kindOk(d));
    if (pool.length) relaxed.push("grade");
  }
  const scored = pool.map((d) => {
    const parts: ScoreParts = {
      interest: interestMatch(d, input.interests),
      weakSkill: weakSkillMatch(d, input.masteryByNodeKey),
      dueWords: dueWordOverlap(d, dueWords),
      newWordOverload: newWordOverload(d, input.knownLemmas, dueWords),
      recentTheme: recentThemePenalty(d, input),
      fallback: 0,
    };
    return { dictation: d, parts, expectedErrorRate: expectedErrorRate(d, input), doneAt: lastDone.get(d.id) };
  });
  const fresh = (entry: (typeof scored)[number]) => entry.doneAt === undefined || input.nowMs - entry.doneAt >= DICTATION_PICKER.recencyDays * DAY;

  let candidates = scored.filter((entry) => fresh(entry) && inErrorBand(entry.expectedErrorRate));
  if (candidates.length === 0) {
    relaxed.push("error_band");
    candidates = scored.filter(fresh).map((entry) => ({ ...entry, parts: { ...entry.parts, fallback: -10 * bandDistance(entry.expectedErrorRate) } }));
  }
  if (candidates.length === 0) {
    relaxed.push("recency");
    // Least recently done first; the band still orders the rest.
    candidates = scored.map((entry) => ({ ...entry, parts: { ...entry.parts, fallback: -10 * bandDistance(entry.expectedErrorRate) - 3 + Math.min(3, (input.nowMs - (entry.doneAt ?? 0)) / (40 * DAY)) } }));
  }
  const center = (DICTATION_PICKER.errorBand.min + DICTATION_PICKER.errorBand.max) / 2;
  const ranked = candidates
    .map(({ dictation, parts, expectedErrorRate: rate }) => ({
      dictation, parts, expectedErrorRate: rate,
      score: round(parts.interest + parts.weakSkill + parts.dueWords - parts.newWordOverload - parts.recentTheme + parts.fallback),
    }))
    .sort((a, b) => b.score - a.score
      || Math.abs(a.expectedErrorRate - center) - Math.abs(b.expectedErrorRate - center)
      || a.dictation.wordCount - b.dictation.wordCount
      || a.dictation.id.localeCompare(b.dictation.id));
  return { ranked, relaxed };
}

const lastAttemptMs = (attempts: readonly PickerAttempt[]) => attempts.reduce((latest, attempt) => Math.max(latest, Date.parse(attempt.submittedAt) || 0), 0);

export function brevetDue(input: Pick<PickerInput, "grade" | "attempts" | "nowMs">) {
  return input.grade === 9 && !input.attempts.some((attempt) => attempt.mode === "brevet" && input.nowMs - Date.parse(attempt.submittedAt) < DICTATION_PICKER.brevetEveryDays * DAY);
}

/**
 * Today's dictée for the session plan: nothing within 36 h of the last one;
 * a brevet-length dictée for 3e when none was done in 90 days; otherwise the
 * best non-brevet dictée.
 */
export function pickDailyDictation(input: PickerInput): (ScoredDictation & { relaxed: Relaxation[] }) | null {
  if (input.nowMs - lastAttemptMs(input.attempts) < DICTATION_PICKER.spacingHours * 3_600_000) return null;
  if (brevetDue(input)) {
    const brevet = rankDictations(input, { kinds: (kind) => kind === "brevet" });
    if (brevet.ranked[0]) return { ...brevet.ranked[0], relaxed: brevet.relaxed };
  }
  const regular = rankDictations(input, { kinds: (kind) => kind !== "brevet" });
  return regular.ranked[0] ? { ...regular.ranked[0], relaxed: regular.relaxed } : null;
}

/**
 * 2–3 suggestions the student chooses from (autonomy rule 5). Brevet texts
 * are suggested only to 3e. Prefers different themes when possible.
 */
export function suggestDictations(input: PickerInput, count = 3): ScoredDictation[] {
  const { ranked } = rankDictations(input, { kinds: (kind) => kind !== "brevet" || input.grade === 9 });
  const chosen: ScoredDictation[] = [];
  const seenThemes = new Set<string>();
  for (const entry of ranked) {
    if (chosen.length >= count) break;
    if (entry.dictation.themes.length && entry.dictation.themes.every((theme) => seenThemes.has(theme))) continue;
    chosen.push(entry); entry.dictation.themes.forEach((theme) => seenThemes.add(theme));
  }
  for (const entry of ranked) {
    if (chosen.length >= count) break;
    if (!chosen.includes(entry)) chosen.push(entry);
  }
  return chosen;
}
