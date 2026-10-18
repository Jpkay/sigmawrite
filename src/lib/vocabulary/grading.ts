/**
 * Answer grading for word reviews (roadmap 2026-10 B.2 accent rule, B.4).
 *
 * Hint levels follow the practice ladder (src/lib/practice/hints.ts and
 * scaffolding.ts): 0 = no help, 1 = first prompt (for words: the first
 * letter), 2 = a real clue, 3 = the answer is shown (explicit correction).
 * Spelling is decided deterministically here, never by a model.
 */
import type { FsrsRating, WordActivityFormat } from "./types";
import { FORMAT_CREDIT } from "./types";

export const HINT_LEVEL = { none: 0, firstLetter: 1, clue: 2, answerShown: 3 } as const;

export const GRADE_RULES = {
  /** Above this response time an answer loses one grade level. */
  slowAnswerMs: {
    default: 20_000,
    hear_and_type: 25_000,
    type_from_definition: 25_000,
    explain_own_words: 90_000,
    mini_dictation: 60_000,
    pick_spelling: 12_000,
    pick_definition: 15_000,
  } as Partial<Record<WordActivityFormat | "default", number>>,
} as const;

export type SpellingOutcome = "exact" | "accent" | "near" | "wrong";

const apostrophes = /[’'`´]/gu;
function normalize(value: string) {
  return value.normalize("NFC").trim().replace(/\s+/gu, " ").replace(apostrophes, "'").toLocaleLowerCase("fr");
}
function deaccent(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/gu, "").normalize("NFC");
}
function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let prior = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prior + (a[i - 1] === b[j - 1] ? 0 : 1));
      prior = old;
    }
  }
  return row[b.length];
}

/**
 * exact: correct spelling (case and apostrophe style ignored).
 * accent: only accents differ (é/e, à/a, ç/c…) → graded Hard, never a success.
 * near: one letter off → not correct.
 */
export function gradeSpelling(answer: string, expected: string): SpellingOutcome {
  const a = normalize(answer);
  const e = normalize(expected);
  if (!a) return "wrong";
  if (a === e) return "exact";
  if (deaccent(a) === deaccent(e)) return "accent";
  return distance(a, e) <= 1 ? "near" : "wrong";
}

export type AttemptForGrade = {
  /** Exactly right. An accent-only slip is `correct: false, accentOnly: true`. */
  correct: boolean;
  accentOnly?: boolean;
  hintLevel?: number;
  answerRevealed?: boolean;
  responseMs?: number | null;
  format: WordActivityFormat;
};

export function isSlowAnswer(format: WordActivityFormat, responseMs: number | null | undefined): boolean {
  if (responseMs == null || !Number.isFinite(responseMs)) return false;
  return responseMs > (GRADE_RULES.slowAnswerMs[format] ?? GRADE_RULES.slowAnswerMs.default ?? 20_000);
}

/**
 * FSRS rating for one answer:
 *  - wrong, or the answer was shown → Again (1);
 *  - accent mistake → Hard (2): remembered, but not a success;
 *  - a hint caps the grade at Hard, or at Good when it was only the first letter;
 *  - recognition formats cap at Hard (weak credit);
 *  - a very slow correct answer loses one level, but never becomes a lapse.
 * Easy is never given automatically.
 */
export function ratingForAttempt(attempt: AttemptForGrade): FsrsRating {
  const hint = attempt.hintLevel ?? 0;
  if (attempt.answerRevealed || hint >= HINT_LEVEL.answerShown) return 1;
  if (!attempt.correct && !attempt.accentOnly) return 1;
  let rating: FsrsRating = attempt.accentOnly ? 2 : 3;
  if (FORMAT_CREDIT[attempt.format].credit === "recognition") rating = Math.min(rating, 2) as FsrsRating;
  if (hint >= HINT_LEVEL.clue) rating = Math.min(rating, 2) as FsrsRating;
  else if (hint === HINT_LEVEL.firstLetter) rating = Math.min(rating, 3) as FsrsRating;
  if (isSlowAnswer(attempt.format, attempt.responseMs)) rating = Math.max(2, rating - 1) as FsrsRating;
  return rating;
}
