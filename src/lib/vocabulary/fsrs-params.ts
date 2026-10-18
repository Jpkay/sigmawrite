/**
 * FSRS parameter sets and calibration (roadmap 2026-10 C.3).
 *
 * Parameters are versioned rows in fsrs_parameter_sets. A student uses, in
 * order: their own active set (fitted on ≥ ~1,000 of their reviews and kept
 * only if it predicted their held-out reviews better), their age group's
 * active set (fitted on ≥ ~5,000 reviews, per trace), or the ts-fsrs FSRS-6
 * defaults. Calibration replays each card's history with a parameter set
 * and compares predicted recall with what happened: log-loss and RMSE over
 * probability bins (the open-spaced-repetition benchmark metrics).
 *
 * The optimiser itself is pluggable (FsrsOptimizer). No maintained FSRS
 * optimiser is installed in this repository yet (see the TODO in the
 * roadmap, item C.3): until one is, the job reports calibration only.
 */
import { default_w, forgetting_curve } from "ts-fsrs";
import { scheduleWithConfig, LONG_TERM_FSRS_CONFIG, type FsrsGrade } from "@/lib/scoring/fsrs";
import type { WordFacet } from "./types";

export const DEFAULT_PARAMS_VERSION = "fsrs6-default";
export const FSRS_FIT_RULES = {
  cohortMinReviews: 5000,
  studentMinReviews: 1000,
  /** Share of each history (latest reviews) held back to compare default vs fitted. */
  holdoutShare: 0.2,
  /** Fitted parameters must beat the current ones on held-out log-loss by at least this much. */
  minLogLossGain: 0.002,
  bins: 10,
} as const;

export type CohortKey = "cm" | "6e5e" | "4e3e";
export function cohortForGrade(grade: number | null | undefined): CohortKey {
  if (grade == null || grade <= 5) return "cm";
  return grade <= 7 ? "6e5e" : "4e3e";
}

export type ParameterSet = {
  version: string;
  scope: "cohort" | "student";
  cohortKey: CohortKey | null;
  facet: WordFacet;
  studentId: string | null;
  weights: number[];
  status: "candidate" | "active" | "rejected" | "retired";
};

export type SelectedParameters = { version: string; weights: readonly number[]; scope: "student" | "cohort" | "default" };

export function selectParameterSet(sets: ParameterSet[], input: { studentId: string; grade: number | null; facet: WordFacet }): SelectedParameters {
  const active = sets.filter((set) => set.status === "active" && set.facet === input.facet && set.weights.length === 21);
  const own = active.find((set) => set.scope === "student" && set.studentId === input.studentId);
  if (own) return { version: own.version, weights: own.weights, scope: "student" };
  const cohort = active.find((set) => set.scope === "cohort" && set.cohortKey === cohortForGrade(input.grade));
  if (cohort) return { version: cohort.version, weights: cohort.weights, scope: "cohort" };
  return { version: DEFAULT_PARAMS_VERSION, weights: default_w, scope: "default" };
}

/** One counted review in a card's history (word_review_log, counts_for_fsrs = true). */
export type ReviewEvent = { cardId: string; studentId: string; facet: WordFacet; at: string; rating: FsrsGrade };

export type Prediction = { predicted: number; observed: 0 | 1 };

const DAY_MS = 86_400_000;

/** Replays every card with `weights` and predicts recall before each review after the first. */
export function predictHistory(events: ReviewEvent[], weights: readonly number[]): Prediction[] {
  const byCard = new Map<string, ReviewEvent[]>();
  for (const event of events) {
    const list = byCard.get(event.cardId) ?? [];
    list.push(event);
    byCard.set(event.cardId, list);
  }
  const out: Prediction[] = [];
  for (const history of byCard.values()) {
    history.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    let state: { stability: number; difficulty: number } | null = null;
    let last: string | null = null;
    let reps = 0;
    for (const event of history) {
      const elapsed = last ? Math.max(0, (Date.parse(event.at) - Date.parse(last)) / DAY_MS) : 0;
      if (state) {
        const predicted = forgetting_curve(weights, elapsed, Math.max(0.01, state.stability));
        out.push({ predicted: Math.min(1 - 1e-6, Math.max(1e-6, predicted)), observed: event.rating > 1 ? 1 : 0 });
      }
      const next = scheduleWithConfig({ prev: state, grade: event.rating, elapsedDays: elapsed, now: new Date(event.at), config: { ...LONG_TERM_FSRS_CONFIG, enableFuzz: false, weights }, reps });
      state = { stability: next.stability, difficulty: next.difficulty };
      last = event.at;
      reps++;
    }
  }
  return out;
}

export type CalibrationBin = { lower: number; upper: number; count: number; meanPredicted: number; meanObserved: number };
export type Calibration = { count: number; logLoss: number | null; rmseBins: number | null; bins: CalibrationBin[] };

export function calibration(predictions: Prediction[], binCount: number = FSRS_FIT_RULES.bins): Calibration {
  if (!predictions.length) return { count: 0, logLoss: null, rmseBins: null, bins: [] };
  let loss = 0;
  const bins = Array.from({ length: binCount }, (_, index) => ({ lower: index / binCount, upper: (index + 1) / binCount, count: 0, sumP: 0, sumY: 0 }));
  for (const { predicted, observed } of predictions) {
    loss += -(observed * Math.log(predicted) + (1 - observed) * Math.log(1 - predicted));
    const bin = bins[Math.min(binCount - 1, Math.floor(predicted * binCount))];
    bin.count++; bin.sumP += predicted; bin.sumY += observed;
  }
  let squared = 0;
  for (const bin of bins) if (bin.count) squared += bin.count * (bin.sumP / bin.count - bin.sumY / bin.count) ** 2;
  return {
    count: predictions.length,
    logLoss: loss / predictions.length,
    rmseBins: Math.sqrt(squared / predictions.length),
    bins: bins.filter((bin) => bin.count).map((bin) => ({ lower: bin.lower, upper: bin.upper, count: bin.count, meanPredicted: bin.sumP / bin.count, meanObserved: bin.sumY / bin.count })),
  };
}

/** Splits each card's history: the latest `share` of its reviews go to the holdout. */
export function holdoutSplit(events: ReviewEvent[], share: number = FSRS_FIT_RULES.holdoutShare) {
  const sorted = [...events].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const cut = Math.floor(sorted.length * (1 - share));
  const boundary = sorted[cut]?.at ?? null;
  return {
    train: boundary ? sorted.filter((event) => event.at < boundary) : sorted,
    // The holdout keeps the full history so predictions have prior state; only
    // reviews at or after the boundary are scored.
    boundary,
  };
}

export function holdoutCalibration(events: ReviewEvent[], weights: readonly number[], boundary: string | null): Calibration {
  if (!boundary) return calibration([]);
  const scored: Prediction[] = [];
  const byCard = new Map<string, ReviewEvent[]>();
  for (const event of events) byCard.set(event.cardId, [...(byCard.get(event.cardId) ?? []), event]);
  for (const history of byCard.values()) {
    const predictions = predictHistory(history, weights);
    const sorted = [...history].sort((a, b) => Date.parse(a.at) - Date.parse(b.at)).slice(1);
    predictions.forEach((prediction, index) => { if (sorted[index] && sorted[index].at >= boundary) scored.push(prediction); });
  }
  return calibration(scored);
}

/** Keep fitted parameters only if they predict held-out reviews better (C.3). */
export function shouldAdopt(current: Calibration, fitted: Calibration, minGain: number = FSRS_FIT_RULES.minLogLossGain): boolean {
  if (current.logLoss == null || fitted.logLoss == null || fitted.count < 30) return false;
  return fitted.logLoss <= current.logLoss - minGain;
}

/** Pluggable optimiser: given training reviews, returns 21 FSRS-6 weights or null. */
export type FsrsOptimizer = {
  name: string;
  available: boolean;
  fit(events: ReviewEvent[]): Promise<number[] | null>;
};

/**
 * TODO(C.3): replace with the fsrs-rs bindings (@open-spaced-repetition/binding)
 * once the dependency is approved and installed; it exposes computeParameters
 * over FSRS review histories. Until then no parameters are fitted.
 */
export const UNAVAILABLE_OPTIMIZER: FsrsOptimizer = {
  name: "none",
  available: false,
  async fit() { return null; },
};
