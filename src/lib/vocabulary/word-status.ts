/**
 * The mastery rule (roadmap 2026-10 B.2) as one pure function.
 *
 * A word is mastered only when the student has shown, again and again over
 * time, that they can SPELL it and that they know what it MEANS. Exposure,
 * look-ups and recognition answers never move a word past "En route".
 * Every number lives in WORD_STATUS_RULES and is revisited after the pilot
 * with the weekly memory-quality report (C.6).
 */
import { dayDiff, localDay, MEMORY_TIME_ZONE } from "./days";
import type { WordCards, WordEvidence, WordFacet, WordStatus } from "./types";

export const WORD_STATUS_RULES = {
  timeZone: MEMORY_TIME_ZONE,
  spelling: {
    minSuccesses: 3,
    minDistinctDays: 3,
    /** The last success must come at least this many days after the one before. */
    minFinalGapDays: 7,
    minStabilityDays: 21,
  },
  meaning: {
    minSuccesses: 3,
    minDistinctDays: 3,
    minFormats: 2,
    /** At least this many successes in a sentence the student had not seen before. */
    minNovelContexts: 1,
    minStabilityDays: 21,
  },
  /** "Ancré": both traces this stable (≈ a pass about four months after the previous review). */
  anchoredStabilityDays: 180,
  /** "Presque": one trace secured, or unaided recall of both traces on this many different days. */
  almostRecallDaysPerFacet: 2,
  /** After a lapse on a secured trace: one relearning success, then one spaced success this many days later. */
  relearnSpacingDays: 1,
} as const;

export type WordStatusRules = typeof WORD_STATUS_RULES;

export type FacetAssessment = {
  /** Unaided full-credit recall successes. */
  successes: number;
  successDays: number;
  formats: number;
  novelContexts: number;
  stability: number | null;
  secured: boolean;
  /** A failed answer not yet followed by a success. */
  unresolvedLapse: boolean;
  /** The trace was secured just before its most recent lapse. */
  securedBeforeLapse: boolean;
};

export type WordStatusResult = {
  status: WordStatus;
  spelling: FacetAssessment;
  meaning: FacetAssessment;
  hasCards: boolean;
};

const RECALL_KINDS: Record<WordFacet, ReadonlySet<string>> = {
  spelling: new Set(["correct_spelling", "contextual_use"]),
  meaning: new Set(["meaning_recall"]),
};

/** Full credit: a recall answer, correct, without help, not an accent slip, not capped below Good. */
export function isUnaidedRecallSuccess(evidence: WordEvidence, facet: WordFacet): boolean {
  return evidence.facet === facet
    && RECALL_KINDS[facet].has(evidence.kind)
    && evidence.successful
    && (evidence.hintLevel ?? 0) === 0
    && !evidence.answerRevealed
    && !evidence.accentOnly
    && (evidence.rating == null || evidence.rating >= 3);
}

/** A failed answer that FSRS treats as a lapse (in-session retries do not count). */
function isLapse(evidence: WordEvidence, facet: WordFacet): boolean {
  return evidence.facet === facet
    && !evidence.successful
    && !evidence.accentOnly
    && (evidence.kind === "recognition" || RECALL_KINDS[facet].has(evidence.kind))
    && evidence.countsForFsrs !== false;
}

function byTime(a: WordEvidence, b: WordEvidence) {
  return Date.parse(a.at) - Date.parse(b.at);
}

function criteria(facet: WordFacet, events: WordEvidence[], stability: number | null, rules: WordStatusRules) {
  const successes = events.filter((event) => isUnaidedRecallSuccess(event, facet));
  const days = [...new Set(successes.map((event) => localDay(event.at, rules.timeZone)))].sort();
  const formats = new Set(successes.map((event) => event.format ?? "unknown")).size;
  const novelContexts = successes.filter((event) => event.novelContext).length;
  let secured: boolean;
  if (facet === "spelling") {
    const rule = rules.spelling;
    const finalGap = days.length >= 2 ? dayDiff(days[days.length - 2], days[days.length - 1]) : 0;
    secured = successes.length >= rule.minSuccesses
      && days.length >= rule.minDistinctDays
      && finalGap >= rule.minFinalGapDays
      && (stability ?? 0) >= rule.minStabilityDays;
  } else {
    const rule = rules.meaning;
    secured = successes.length >= rule.minSuccesses
      && days.length >= rule.minDistinctDays
      && formats >= rule.minFormats
      && novelContexts >= rule.minNovelContexts
      && (stability ?? 0) >= rule.minStabilityDays;
  }
  return { successes: successes.length, successDays: days.length, formats, novelContexts, secured };
}

function assessFacet(facet: WordFacet, evidence: WordEvidence[], stability: number | null, rules: WordStatusRules): FacetAssessment {
  const events = evidence.filter((event) => event.facet === facet).sort(byTime);
  const all = criteria(facet, events, stability, rules);
  let lapseIndex = -1;
  for (let index = events.length - 1; index >= 0; index--) {
    if (isLapse(events[index], facet)) { lapseIndex = index; break; }
  }
  if (lapseIndex < 0) return { ...all, stability, unresolvedLapse: false, securedBeforeLapse: false };

  const lapse = events[lapseIndex];
  const before = events.slice(0, lapseIndex);
  const securedBeforeLapse = criteria(facet, before, lapse.stabilityBefore ?? null, rules).secured;
  const after = events.slice(lapseIndex + 1).filter((event) => isUnaidedRecallSuccess(event, facet));
  const unresolvedLapse = after.length === 0;
  let secured: boolean;
  if (securedBeforeLapse) {
    // "Maîtrisé comes back after one successful relearning plus one spaced review."
    const firstDay = after.length ? localDay(after[0].at, rules.timeZone) : null;
    secured = !!firstDay && after.some((event) => dayDiff(firstDay, localDay(event.at, rules.timeZone)) >= rules.relearnSpacingDays);
  } else {
    secured = !unresolvedLapse && all.secured;
  }
  return { ...all, secured, stability, unresolvedLapse, securedBeforeLapse };
}

function almost(spelling: Pick<FacetAssessment, "secured" | "successDays">, meaning: Pick<FacetAssessment, "secured" | "successDays">, rules: WordStatusRules) {
  return spelling.secured || meaning.secured
    || (spelling.successDays >= rules.almostRecallDaysPerFacet && meaning.successDays >= rules.almostRecallDaysPerFacet);
}

/**
 * Status of one word from all its evidence and its two cards.
 *
 *  - Découvert: only exposure / look-ups so far.
 *  - En route: introduced (cards exist) or any successful answer. Recognition
 *    and exposure can never go further than this.
 *  - Presque: one trace secured, or unaided recall of both traces on ≥ 2 days.
 *  - Maîtrisé: both traces secured (B.2 rules, stability ≥ 21 days each).
 *  - Ancré: maîtrisé and both cards ≥ 180 days stable.
 *  - À revoir: a lapse not yet relearned on a word that had reached Presque or more.
 */
export function wordStatus(evidence: WordEvidence[], cards: WordCards, rules: WordStatusRules = WORD_STATUS_RULES): WordStatusResult {
  const spellingCard = cards.spelling ?? null;
  const meaningCard = cards.meaning ?? null;
  const hasCards = !!spellingCard || !!meaningCard;
  const spelling = assessFacet("spelling", evidence, spellingCard?.stability ?? null, rules);
  const meaning = assessFacet("meaning", evidence, meaningCard?.stability ?? null, rules);
  // Without both cards there is no spaced schedule, so nothing is "secured".
  if (!spellingCard) spelling.secured = false;
  if (!meaningCard) meaning.secured = false;

  const result = (status: WordStatus): WordStatusResult => ({ status, spelling, meaning, hasCards });
  const unresolved = spelling.unresolvedLapse || meaning.unresolvedLapse;

  if (spelling.secured && meaning.secured) {
    const anchored = (spellingCard?.stability ?? 0) >= rules.anchoredStabilityDays
      && (meaningCard?.stability ?? 0) >= rules.anchoredStabilityDays;
    return result(anchored ? "ancre" : "maitrise");
  }
  if (unresolved && hasCards) {
    const reachedBefore = spelling.securedBeforeLapse || meaning.securedBeforeLapse
      || almostBeforeLastLapse(evidence, cards, rules);
    if (reachedBefore) return result("a_revoir");
  }
  if (hasCards && !unresolved && almost(spelling, meaning, rules)) return result("presque");
  const anySuccess = evidence.some((event) => (event.successful || event.accentOnly) && event.kind !== "exposure" && event.kind !== "help_lookup");
  if (hasCards || anySuccess) return result("en_route");
  return result("decouvert");
}

function almostBeforeLastLapse(evidence: WordEvidence[], cards: WordCards, rules: WordStatusRules): boolean {
  const lapses = evidence.filter((event) => isLapse(event, "spelling") || isLapse(event, "meaning")).sort(byTime);
  const last = lapses[lapses.length - 1];
  if (!last) return false;
  const before = evidence.filter((event) => Date.parse(event.at) < Date.parse(last.at));
  const spelling = criteria("spelling", before.filter((event) => event.facet === "spelling"), cards.spelling?.stability ?? null, rules);
  const meaning = criteria("meaning", before.filter((event) => event.facet === "meaning"), cards.meaning?.stability ?? null, rules);
  return almost({ secured: false, successDays: spelling.successDays }, { secured: false, successDays: meaning.successDays }, rules);
}

/** Order of the ladder, for "best status" comparisons and progress bars. */
export const WORD_STATUS_RANK: Record<WordStatus, number> = {
  decouvert: 0,
  en_route: 1,
  a_revoir: 2,
  presque: 3,
  maitrise: 4,
  ancre: 5,
};

/** Student-facing labels (B.3). Lapses are framed gently (rule 4: never punish). */
export const WORD_STATUS_LABELS: Record<WordStatus, string> = {
  decouvert: "Découvert",
  en_route: "En route",
  presque: "Presque",
  a_revoir: "On le revoit",
  maitrise: "Maîtrisé",
  ancre: "Ancré",
};

/** Shown when the 2026-10 recompute lowered a legacy mastery value (A.2). Never "lost". */
export const TO_CONFIRM_LABEL = "À confirmer";

/**
 * Legacy `student_word_mastery.mastery` (0–1) derived from the status, so
 * existing readers (content reuse, reports) keep a meaningful number. Only
 * spaced typed production can raise it: Découvert and recognition-only
 * "En route" stay at 0.
 */
export function masteryForStatus(result: WordStatusResult): number {
  switch (result.status) {
    case "ancre": return 1;
    case "maitrise": return 0.9;
    case "presque": return 0.6;
    case "a_revoir": return 0.5;
    case "en_route": return result.spelling.successes + result.meaning.successes > 0 ? 0.25 : 0;
    default: return 0;
  }
}

/** Legacy learning_status column (0092): new → review → maintenance. */
export function learningStatusFor(status: WordStatus): "new" | "review" | "maintenance" {
  if (status === "ancre" || status === "maitrise") return "maintenance";
  return status === "decouvert" ? "new" : "review";
}
