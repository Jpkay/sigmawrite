/**
 * Spaced-retrieval engine (PRD §L). Turns reading into durable learning by
 * bringing concepts back at expanding intervals. The schedule ladder follows
 * the PRD: same session (handled in the reading flow) → 1d → 3d → 7d → 21d →
 * 45d. An SM-2-style ease factor stretches or compresses the ladder per the
 * learner's recall. Pure → unit-tested (§26).
 */

export type RetrievalResult = "forgot" | "hard" | "good" | "easy";

export const RETRIEVAL_RESULT_LABEL: Record<RetrievalResult, string> = {
  forgot: "Oublié",
  hard: "Difficile",
  good: "Correct",
  easy: "Facile",
};

/** Interval ladder in days (PRD §L). repetitions index into this. */
export const INTERVAL_LADDER = [1, 3, 7, 21, 45];

export type Schedule = {
  intervalDays: number;
  ease: number; // ~1.3–3.0
  repetitions: number;
};

export const INITIAL_SCHEDULE: Schedule = {
  intervalDays: 1,
  ease: 2.5,
  repetitions: 0,
};

const clampEase = (e: number) => Math.max(1.3, Math.min(3, e));

/**
 * Computes the next schedule from a recall result (SM-2 simplified).
 * @deprecated Scheduling now goes through scheduleFsrs (scoring/fsrs.ts);
 * kept only for legacy rows without FSRS state and historical tests.
 */
export function scheduleNext(prev: Schedule, result: RetrievalResult): Schedule {
  if (result === "forgot") {
    return { intervalDays: 1, ease: clampEase(prev.ease - 0.2), repetitions: 0 };
  }

  const ease = clampEase(
    prev.ease + (result === "easy" ? 0.15 : result === "hard" ? -0.15 : 0)
  );
  const repetitions = prev.repetitions + 1;

  // "hard" holds roughly the current rung; good/easy climb the ladder.
  const idx =
    result === "hard"
      ? Math.max(0, Math.min(INTERVAL_LADDER.length - 1, prev.repetitions - 1))
      : Math.min(INTERVAL_LADDER.length - 1, repetitions);
  const base = INTERVAL_LADDER[idx];
  const intervalDays = Math.max(1, Math.round(base * (ease / 2.5)));

  return { intervalDays, ease, repetitions };
}

/** ISO timestamp `days` from `fromMs` (epoch millis). */
export function dueAtFrom(fromMs: number, days: number): string {
  return new Date(fromMs + days * 86_400_000).toISOString();
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Auto-grades a free-text recall answer against the concept's key words.
 * Self-rating could replace this later; for now it keeps review hands-off.
 */
export function gradeRetrieval(answer: string, keywords: string[]): RetrievalResult {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  if (words.length < 3) return "forgot";

  const hay = normalize(answer);
  const coverage = keywords.length
    ? keywords.filter((k) => hay.includes(normalize(k))).length / keywords.length
    : words.length >= 8
      ? 1
      : 0.5;

  if (coverage >= 0.75 && words.length >= 6) return "easy";
  if (coverage >= 0.5) return "good";
  if (coverage > 0) return "hard";
  return "forgot";
}
