/**
 * Bayesian Knowledge Tracing (Roadmap Phase 10, E3).
 *
 * Replaces the v1 evidence-weighted heuristic (skill-estimate.ts) for competency
 * nodes once the graph is live. BKT models p(known) as a latent state updated by
 * each observation through slip/guess noise, then a learning transition. Pure and
 * unit-tested; the per-dimension routing (receptive vs productive) is the caller's.
 *
 * Params (per node; sensible defaults until Gate-5 psychometrics fit them):
 *   pKnownInit — prior p(known) before any evidence
 *   pTransit   — p(learn) on each opportunity (not-known → known)
 *   pSlip      — p(wrong | known)
 *   pGuess     — p(right | not-known); for MCQ ≈ 1/choices
 */

export type BktParams = {
  pTransit: number;
  pSlip: number;
  pGuess: number;
};

export const DEFAULT_BKT: BktParams = {
  pTransit: 0.15,
  pSlip: 0.1,
  pGuess: 0.2,
};

export const INITIAL_P_KNOWN = 0.1;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * One BKT update. Returns the posterior p(known) after observing `correct`,
 * including the learning transition. `guessOverride` lets MCQ pass 1/choices.
 */
export function bktUpdate(
  pKnown: number,
  correct: boolean,
  params: Partial<BktParams> = {},
  guessOverride?: number
): number {
  const { pTransit, pSlip, pGuess } = { ...DEFAULT_BKT, ...params };
  const guess = guessOverride ?? pGuess;
  const prior = clamp01(pKnown);

  // Posterior p(known | observation) via Bayes.
  const posterior = correct
    ? (prior * (1 - pSlip)) /
      (prior * (1 - pSlip) + (1 - prior) * guess || 1e-9)
    : (prior * pSlip) /
      (prior * pSlip + (1 - prior) * (1 - guess) || 1e-9);

  // Learning transition: a not-yet-known student may have learned this step.
  return clamp01(posterior + (1 - posterior) * pTransit);
}

/**
 * Uncertainty proxy in [0,1]: high when little evidence or p(known) is mid-range
 * (least decisive). Used to decide when the adaptive diagnostic can stop probing.
 */
export function masteryUncertainty(pKnown: number, evidenceCount: number): number {
  const evidenceTerm = 1 / (1 + evidenceCount); // → 0 as evidence grows
  const ambiguity = 1 - Math.abs(clamp01(pKnown) - 0.5) * 2; // 1 at p=0.5, 0 at extremes
  return clamp01(0.6 * evidenceTerm + 0.4 * ambiguity);
}

/** MCQ guess rate from the number of choices (≥2). */
export function guessFromChoices(choices: number): number {
  return choices >= 2 ? 1 / choices : DEFAULT_BKT.pGuess;
}
